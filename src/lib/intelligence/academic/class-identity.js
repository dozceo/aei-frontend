/**
 * Academic class identity — divisions are canonical; classId is a legacy compat alias.
 *
 * After backfill-participant-divisionid.mjs runs on prod, every participant should
 * carry divisionId. Until then, participantDivisionId() falls back to classId at read time.
 */
export function participantDivisionId(row) {
  return row?.divisionId || row?.classId || '';
}

/** @deprecated Use participantDivisionId — removed after backfill verified (grep must return 0). */
export function effectiveClassId(row) {
  return participantDivisionId(row);
}
