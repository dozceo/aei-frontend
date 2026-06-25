/**
 * today-recall-core — PURE reducer from a timetable day-row to today's lesson
 * slots. Split out of today-recall.js so it can be unit-tested with `node --test`
 * (no firebase/react). today-recall.js imports rowToSlots from here.
 */
import { normalizeCell } from '../curriculum/timetable-cell.js';

/**
 * Reduce one day's grid row (array of cells: '' | 'subjectId' | {subjectId, chapterId})
 * to deduped lesson slots. Dedup key is subjectId::chapterId so the same subject
 * taught twice in a day collapses, but the same subject with two different chapters
 * yields two slots (SCH-1).
 *
 * @returns {{ slots: {subjectId:string, chapterId:string}[], subjectIds: string[] }}
 */
export function rowToSlots(row) {
  const seen = new Set();
  const slots = [];
  for (const cell of Array.isArray(row) ? row : []) {
    const { subjectId, chapterId } = normalizeCell(cell);
    if (!subjectId) continue;
    const key = `${subjectId}::${chapterId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push({ subjectId, chapterId });
  }
  const subjectIds = [...new Set(slots.map((s) => s.subjectId))];
  return { slots, subjectIds };
}

/**
 * One slot per period (no dedup) — for teacher "today's lessons" where each period is a row.
 * @returns {{ period: number, subjectId: string, chapterId: string }[]}
 */
export function rowToPeriodSlots(row) {
  const slots = [];
  const cells = Array.isArray(row) ? row : [];
  for (let i = 0; i < cells.length; i++) {
    const { subjectId, chapterId } = normalizeCell(cells[i]);
    if (!subjectId) continue;
    slots.push({ period: i + 1, subjectId, chapterId });
  }
  return slots;
}
