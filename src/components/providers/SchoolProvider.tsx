"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { db, firebaseAuth } from "@/lib/firebase-client";
import { isAdminEmail } from "@/lib/admins";
import { DEFAULT_VOCAB, EVENT_FALLBACK_VOCAB, resolveVocab } from "@/lib/intelligence/school/vocab";
import { provisionSchoolMembership } from "@/lib/school-api";

export interface SchoolIdentity {
  isSuper: boolean;
  role: string | null;
  schools: Record<string, string>;
  schoolIds: string[];
  linkedId: string | null;
  childBookingIds: string[] | null;
  primarySchoolId: string;
}

interface SchoolContextValue {
  ready: boolean;
  user: User | null;
  identity: SchoolIdentity | null;
  activeSchoolId: string | null;
  vocab: typeof DEFAULT_VOCAB;
  setActiveSchoolId: (id: string | null) => void;
}

const SchoolCtx = createContext<SchoolContextValue | null>(null);

function deriveIdentity(claims: Record<string, unknown>, email: string | null): SchoolIdentity {
  const isSuper = isAdminEmail(email);
  const schools =
    (claims.schools as Record<string, string>) ||
    (claims.schoolId ? { [claims.schoolId as string]: String(claims.role || "student") } : {});
  const schoolIds = Object.keys(schools);
  return {
    isSuper,
    role: (claims.role as string) || (isSuper ? "super_admin" : null),
    schools,
    schoolIds,
    linkedId: (claims.linkedId as string) || null,
    childBookingIds: (claims.childBookingIds as string[]) || (claims.childIds as string[]) || null,
    primarySchoolId: (claims.schoolId as string) || schoolIds[0] || "zero2dev",
  };
}

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<SchoolIdentity | null>(null);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const [vocab, setVocab] = useState(DEFAULT_VOCAB);

  const resolveUser = useCallback(async (nextUser: User | null) => {
    if (!nextUser) {
      setUser(null);
      setIdentity(null);
      setActiveSchoolId(null);
      setReady(true);
      return;
    }

    let token = await nextUser.getIdTokenResult();
    let claims = token.claims as Record<string, unknown>;

    if (!claims.schoolId && !claims.schools && !isAdminEmail(nextUser.email)) {
      try {
        await provisionSchoolMembership();
        await nextUser.getIdToken(true);
        token = await nextUser.getIdTokenResult();
        claims = token.claims as Record<string, unknown>;
      } catch (error) {
        console.warn("School provision skipped:", error);
      }
    }

    let nextIdentity = deriveIdentity(claims, nextUser.email);

    if (!nextIdentity.isSuper && !claims.schoolId && !claims.schools && db) {
      try {
        const roleSnap = await getDoc(doc(db, "teacher_roles", nextUser.uid));
        if (roleSnap.exists()) {
          const role = roleSnap.data();
          let sid = (role.schoolId as string) || null;
          if (!sid && role.teacherId) {
            const tSnap = await getDoc(doc(db, "teachers", role.teacherId as string));
            sid = tSnap.exists() ? ((tSnap.data().schoolId as string) || null) : null;
          }
          if (sid) {
            nextIdentity = {
              ...nextIdentity,
              role: "teacher",
              primarySchoolId: sid,
              schoolIds: [sid],
              schools: { [sid]: "teacher" },
            };
          }
        }
      } catch {
        /* not a teacher */
      }
    }

    if (!nextIdentity.isSuper && nextIdentity.primarySchoolId) {
      setActiveSchoolId((prev) => prev || nextIdentity.primarySchoolId);
    }

    setUser(nextUser);
    setIdentity(nextIdentity);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!firebaseAuth) {
      setReady(true);
      return;
    }
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      void resolveUser(u);
    });
    return () => unsub();
  }, [resolveUser]);

  useEffect(() => {
    if (!db || !activeSchoolId) {
      setVocab(EVENT_FALLBACK_VOCAB);
      return;
    }
    void (async () => {
      const snap = await getDoc(doc(db, "schools", activeSchoolId));
      setVocab(snap.exists() ? resolveVocab(snap.data() as never) : EVENT_FALLBACK_VOCAB);
    })();
  }, [activeSchoolId]);

  const value = useMemo(
    () => ({ ready, user, identity, activeSchoolId, vocab, setActiveSchoolId }),
    [ready, user, identity, activeSchoolId, vocab],
  );

  return <SchoolCtx.Provider value={value}>{children}</SchoolCtx.Provider>;
}

export function useSchool() {
  const ctx = useContext(SchoolCtx);
  if (!ctx) throw new Error("useSchool must be used within SchoolProvider");
  return ctx;
}

export function useVocab() {
  return useSchool().vocab;
}
