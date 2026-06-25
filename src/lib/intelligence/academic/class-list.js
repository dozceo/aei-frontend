import { getDocs } from 'firebase/firestore';
import { schoolScoped } from '../cache/participants-cache';

/**
 * Selectable class list for the active school's attendance / roster pickers.
 *
 * A school can acquire its class structure two ways:
 *   • "Add a school" (SchoolsAdmin) seeds `divisions` docs.
 *   • Onboarding by importing a Classes sheet (ImportData) creates `classes` docs and
 *     stamps participant.classId — but no `divisions`.
 *
 * The pickers must surface whichever exists, otherwise a school set up the second way
 * shows an empty "Select class…" dropdown even though its students have classes. We read
 * both collections and merge by effective id (divisionId/classId), preferring a division
 * when both define the same id. Returns [{ id, name }] sorted by order then name.
 */
export async function listSchoolClasses() {
  const [divSnap, clsSnap] = await Promise.all([
    getDocs(schoolScoped('divisions')).catch(() => ({ docs: [] })),
    getDocs(schoolScoped('classes')).catch(() => ({ docs: [] })),
  ]);
  const byId = new Map();
  divSnap.docs.forEach((d) => {
    const data = d.data();
    const id = data.divisionId || d.id;
    byId.set(id, { id, name: data.name || id, order: data.order ?? 0 });
  });
  clsSnap.docs.forEach((d) => {
    const data = d.data();
    const id = data.classId || d.id;
    if (!byId.has(id)) byId.set(id, { id, name: data.name || id, order: data.order ?? 999 });
  });
  return [...byId.values()].sort(
    (a, b) => (a.order - b.order) || String(a.name).localeCompare(String(b.name)),
  );
}
