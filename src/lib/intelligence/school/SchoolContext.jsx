import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { app, auth, db, onAuthStateChanged } from '../firebase';
import { setActiveSchool, invalidateParticipants } from '../cache/participants-cache';
import { cached } from '../cache/data-cache';
import { resolveVocab, DEFAULT_VOCAB, EVENT_FALLBACK_VOCAB } from './vocab';
import { isAdminEmail } from '../admins';

/**
 * SchoolContext — the single place that resolves WHO the signed-in user is in the
 * multi-school model and WHICH school is active (plan §0/§5.1).
 *
 * Identity resolution (the centralized gate that makes the callable path safe):
 *   1. On auth, read the ID token's custom claims.
 *   2. Staff/admin have claims from `syncClaims` (membership trigger). Students/parents
 *      have NONE until `provisionMembership` runs — so if claims are missing we call it
 *      once, then force getIdToken(true) and re-read.
 *   3. Until claims have resolved (`ready === false`) NO school-scoped query should run.
 *      Consumers gate on `ready`; because the staged rules are claims-required, any
 *      scoped query fired early fails closed (denied/empty) — not a leak.
 *
 * Super-admins (platform owners) may not carry a school claim; they get a school
 * switcher and default to `zero2dev`.
 */

const SchoolCtx = createContext(null);
export const useSchool = () => useContext(SchoolCtx);
/** The resolved, context-aware label dictionary for the active school (plan §1c).
 * Fallback is the EVENT voice (live tenant = Zero2Dev): a school resolves its own voice
 * explicitly via resolveVocab, so the only time this fallback shows is before resolution. */
export const useVocab = () => useContext(SchoolCtx)?.vocab || EVENT_FALLBACK_VOCAB;

const provisionMembership = httpsCallable(getFunctions(app), 'provisionMembership');

/** Shape claims (token) into the identity object the app consumes. */
function deriveIdentity(claims, email) {
  const isSuper = isAdminEmail(email);
  const schools = claims.schools || (claims.schoolId ? { [claims.schoolId]: claims.role } : {});
  const schoolIds = Object.keys(schools);
  return {
    isSuper,
    role: claims.role || (isSuper ? 'super_admin' : null),
    schools,
    schoolIds,
    linkedId: claims.linkedId || null,
    childBookingIds: claims.childBookingIds || null,
    claimsVersion: claims.claimsVersion || null,
    // Default active school: claim's primary, else first membership, else the live event
    // tenant (zero2dev). A non-super user with STALE/missing claims (e.g. the old
    // {role:participant} format, no schoolId) must NOT fall through to null → that
    // resolved to the school voice and showed Zero2Dev event students "SankalpAEI".
    primarySchoolId: claims.schoolId || schoolIds[0] || 'zero2dev',
  };
}

export function SchoolProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null, identity: null });
  const [activeSchoolId, setActiveSchoolId] = useState(null);
  // The resolved vocabulary for the active school (plan §1c). Defaults to the neutral
  // school voice; refined once the school doc's orgType/shortName/vocabOverrides load.
  const [vocab, setVocab] = useState(EVENT_FALLBACK_VOCAB);

  const resolve = useCallback(async (user) => {
    if (!user) { setState({ ready: true, user: null, identity: null }); return; }
    let res = await user.getIdTokenResult();
    let claims = res.claims;

    // Students/parents arrive with no school claims → provision once, then refresh.
    if (!claims.schoolId && !claims.schools && !isAdminEmail(user.email)) {
      try {
        const out = await provisionMembership();
        if (out?.data?.provisioned) {
          await user.getIdToken(true);
          res = await user.getIdTokenResult();
          claims = res.claims;
        }
      } catch (e) {
        // Leave claims empty — scoped queries fail closed; UI can show a "no access" state.
        console.warn('provisionMembership failed', e);
      }
    }

    let identity = deriveIdentity(claims, user.email);

    // H6 — a TEACHER's token may never carry staff claims (provisionMembership only
    // auto-stamps students/parents). When claims have NO school, adopt the school from
    // the teacher record (teacher_roles → teachers) so the teacher sees THEIR school's
    // subjects, not the Zero2Dev default ("Figma & Design"/etc.). Client-side only — no
    // auth-path/Functions change — and a non-teacher simply finds no role doc.
    if (!identity.isSuper && !claims.schoolId && !claims.schools) {
      try {
        const roleSnap = await getDoc(doc(db, 'teacher_roles', user.uid));
        if (roleSnap.exists()) {
          const role = roleSnap.data();
          let sid = role.schoolId || null;
          if (!sid && role.teacherId) {
            const tSnap = await getDoc(doc(db, 'teachers', role.teacherId));
            sid = tSnap.exists() ? (tSnap.data().schoolId || null) : null;
          }
          if (sid) identity = { ...identity, role: 'teacher', primarySchoolId: sid, schoolIds: [sid], schools: { [sid]: 'teacher' } };
        }
      } catch { /* not a teacher / read failed → keep the default */ }
    }

    // Super-admins default to "All schools" (null) and can switch; everyone else is
    // locked to their own school.
    if (!identity.isSuper && identity.primarySchoolId) {
      setActiveSchoolId((prev) => prev || identity.primarySchoolId);
    }
    setState({ ready: true, user, identity });
  }, []);

  useEffect(() => {
    if (!auth) { setState({ ready: true, user: null, identity: null }); return; }
    const unsub = onAuthStateChanged(auth, resolve);
    return () => unsub();
  }, [resolve]);

  // Set the active school SYNCHRONOUSLY during render so it is correct before any child
  // view's effect runs (child effects fire before parent effects, so a useEffect here
  // would race). Cheap + idempotent (just assigns a module var).
  setActiveSchool(activeSchoolId);
  // Invalidate cached participants only when the school actually changes.
  useEffect(() => { invalidateParticipants(); }, [activeSchoolId]);

  // Resolve the vocabulary for the active school: fetch schools/{id} once (orgType/shortName/
  // vocabOverrides), cache it, compute the dictionary. "All schools" (null) → school voice.
  // A read failure falls back to the EVENT voice so the live Zero2Dev tenant never breaks (§1c).
  useEffect(() => {
    if (!state.ready) return;
    // "All schools" (null, super-admin) → EVENT voice, not school voice: the live tenant
    // is the Zero2Dev event, so an unresolved/aggregate school must never read "SankalpAEI".
    if (!activeSchoolId || !db) { setVocab(EVENT_FALLBACK_VOCAB); return; }
    let alive = true;
    (async () => {
      try {
        const meta = await cached(`school:${activeSchoolId}:meta`, async () => {
          const snap = await getDoc(doc(db, 'schools', activeSchoolId));
          const d = snap.exists() ? snap.data() : {};
          return { orgType: d.orgType, shortName: d.shortName, vocabOverrides: d.vocabOverrides };
        }, { ttlMs: 30 * 60_000, scope: 'persistent', staleWhileRevalidate: true });
        if (alive) setVocab(resolveVocab(meta.orgType, meta.vocabOverrides, meta.shortName));
      } catch (e) {
        console.warn('vocab: school doc read failed; using event fallback', e);
        if (alive) setVocab(EVENT_FALLBACK_VOCAB);
      }
    })();
    return () => { alive = false; };
  }, [activeSchoolId, state.ready]);

  /** Force a fresh token (e.g. after an admin changed this user's school/role). */
  const refreshClaims = useCallback(async () => {
    if (state.user) { await state.user.getIdToken(true); await resolve(state.user); }
  }, [state.user, resolve]);

  const identity = state.identity;
  const value = {
    ready: state.ready,
    user: state.user,
    identity,
    // The active school all scoped queries should filter by: where('schoolId','==', schoolId).
    schoolId: activeSchoolId,
    setActiveSchoolId,                       // super-admin school switcher
    canSwitchSchool: !!identity?.isSuper,
    role: identity ? (activeSchoolId && identity.schools[activeSchoolId]) || identity.role : null,
    linkedId: identity?.linkedId || null,
    vocab,                                   // context-aware label dictionary (useVocab)
    refreshClaims,
  };

  return <SchoolCtx.Provider value={value}>{children}</SchoolCtx.Provider>;
}
