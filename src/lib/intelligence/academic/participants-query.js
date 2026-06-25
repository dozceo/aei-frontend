/**
 * Cursor-paginated participant queries (school admin roster).
 */
import {
  collection, query, where, orderBy, limit, startAfter, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { getActiveSchool } from '../cache/participants-cache';

export const PARTICIPANT_PAGE_SIZE = 50;

/**
 * @param {object} opts
 * @param {string} [opts.schoolId]
 * @param {string} [opts.divisionId] — filters divisionId field
 * @param {string} [opts.status] — active|inactive|…
 * @param {import('firebase/firestore').DocumentSnapshot} [opts.cursor]
 * @param {number} [opts.pageSize]
 */
export function buildParticipantsPageQuery({
  schoolId = getActiveSchool(),
  divisionId = '',
  status = '',
  cursor = null,
  pageSize = PARTICIPANT_PAGE_SIZE,
} = {}) {
  const constraints = [];
  if (schoolId) constraints.push(where('schoolId', '==', schoolId));
  if (divisionId) constraints.push(where('divisionId', '==', divisionId));
  if (status && status !== 'all') constraints.push(where('status', '==', status));
  constraints.push(orderBy('name'));
  constraints.push(limit(pageSize));
  if (cursor) constraints.push(startAfter(cursor));
  return query(collection(db, 'participants'), ...constraints);
}

/** Fetch one page; returns { rows, lastDoc, hasMore }. */
export async function fetchParticipantsPage(opts = {}) {
  const pageSize = opts.pageSize || PARTICIPANT_PAGE_SIZE;
  try {
    const q = buildParticipantsPageQuery(opts);
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, bookingId: d.id, ...d.data() }));
    const lastDoc = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    return { rows, lastDoc, hasMore: snap.docs.length >= pageSize };
  } catch (e) {
    // The ordered roster query (where(schoolId) + orderBy(name)) needs the composite
    // index `participants: schoolId + name`. If it's missing or still building on a
    // freshly-provisioned project, Firestore throws `failed-precondition` and the
    // roster would silently render empty. Degrade gracefully: re-read with the
    // single-field filters only (always indexed) and sort client-side, so admins
    // still see their students. The composite index restores true pagination.
    if (e?.code === 'failed-precondition') return fetchParticipantsPageUnordered(opts);
    throw e;
  }
}

/** Unordered fallback used when the composite index is unavailable (see above). */
async function fetchParticipantsPageUnordered({
  schoolId = getActiveSchool(),
  divisionId = '',
  status = '',
} = {}) {
  const constraints = [];
  if (schoolId) constraints.push(where('schoolId', '==', schoolId));
  if (divisionId) constraints.push(where('divisionId', '==', divisionId));
  if (status && status !== 'all') constraints.push(where('status', '==', status));
  constraints.push(limit(1000));
  const snap = await getDocs(query(collection(db, 'participants'), ...constraints));
  const rows = snap.docs
    .map((d) => ({ id: d.id, bookingId: d.id, ...d.data() }))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  // No reliable cursor without an order — return the whole (capped) set in one page.
  return { rows, lastDoc: null, hasMore: false };
}

/**
 * Roster for ONE division/class, scoped + bounded — replaces full-school reads on the
 * attendance / marks / report-card screens (each already picks a division first). Matches
 * participantDivisionId() semantics (academic/class-identity.js): a participant belongs to
 * division X iff (divisionId || classId) === X. After backfill-participant-divisionid.mjs,
 * run the two equality queries and reconcile:
 *   • divisionId == X              → always belongs to X
 *   • classId == X AND no divisionId → belongs to X (legacy rows lacking a divisionId)
 * A single division is bounded (≤ a few hundred), so one capped query each is enough — no
 * cursor needed, and crucially we never read the whole school.
 */
export async function fetchDivisionRoster({
  schoolId = getActiveSchool(),
  divisionId,
  status = '',
  cap = 1000,
} = {}) {
  if (!schoolId || !divisionId) return [];
  const run = (field) => {
    const constraints = [where('schoolId', '==', schoolId), where(field, '==', divisionId)];
    if (status && status !== 'all') constraints.push(where('status', '==', status));
    constraints.push(limit(cap));
    return getDocs(query(collection(db, 'participants'), ...constraints)).catch((e) => {
      console.warn('[fetchDivisionRoster] query failed:', field, divisionId, e?.code || e?.message || e);
      return { docs: [] };
    });
  };
  const [byDiv, byClass] = await Promise.all([run('divisionId'), run('classId')]);
  const map = new Map();
  for (const d of byDiv.docs) map.set(d.id, { id: d.id, bookingId: d.id, ...d.data() });
  for (const d of byClass.docs) {
    if (map.has(d.id)) continue;
    const data = d.data();
    if (!data.divisionId) map.set(d.id, { id: d.id, bookingId: d.id, ...data }); // legacy classId-only
  }
  return [...map.values()].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}

/** Client-side search within loaded rows (full-roster search needs searchTokens / external index). */
export function filterParticipantsBySearch(rows, term) {
  const t = String(term || '').trim().toLowerCase();
  if (!t) return rows;
  return rows.filter((p) => [
    p.name, p.email, p.phone, p.bookingId, p.studentCode, p.admissionNo, p.rollNo,
    p.divisionId, p.classId, ...(p.parentEmails || []),
  ].filter(Boolean).join(' ').toLowerCase().includes(t));
}
