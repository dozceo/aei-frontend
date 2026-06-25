/** Official school attendance register helpers (pure — no Firebase). */

export const STUDENT_ATTENDANCE = ['present', 'absent', 'late', 'excused'];
export const REGISTER_STATUS = ['draft', 'submitted', 'locked'];

/** Doc id: attendance_days/{schoolId}__{divisionId}__{YYYY-MM-DD} */
export function attendanceDayDocId(schoolId, divisionId, date) {
  return `${schoolId}__${divisionId}__${date}`;
}

/** Doc id: daily_recall/{schoolId}__{classId}__{YYYY-MM-DD} (teacher-set today's recall topic). */
export function dailyRecallDocId(schoolId, classId, date) {
  return `${schoolId}__${classId}__${date}`;
}

/** Local (not UTC) YYYY-MM-DD for a date — the day-key used by registers, plans and daily recall. */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Count present/absent/late/excused from a students map. */
export function computeRegisterSummary(studentsMap = {}) {
  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;
  const keys = Object.keys(studentsMap);
  for (const bid of keys) {
    const st = studentsMap[bid]?.status || 'absent';
    if (st === 'present') present++;
    else if (st === 'late') late++;
    else if (st === 'excused') excused++;
    else absent++;
  }
  return { present, absent, late, excused, total: keys.length };
}

/**
 * Derive one student's attendance summary from locked/submitted register docs.
 * @param {Array<{ date: string, status?: string, students?: Record<string, { status?: string }> }>} registers
 * @param {string} bookingId
 */
export function studentAttendanceFromRegisters(registers, bookingId) {
  let workingDays = 0;
  let presentDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let excusedDays = 0;

  for (const reg of registers || []) {
    if (reg.status !== 'submitted' && reg.status !== 'locked') continue;
    const entry = reg.students?.[bookingId];
    if (!entry?.status) continue;
    workingDays++;
    if (entry.status === 'present') presentDays++;
    else if (entry.status === 'late') lateDays++;
    else if (entry.status === 'excused') excusedDays++;
    else absentDays++;
  }

  const percentage = workingDays
    ? Math.round((presentDays / workingDays) * 100)
    : null;

  return { workingDays, presentDays, absentDays, lateDays, excusedDays, percentage };
}

const localDateKeyFromDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Summary of Sankalp Loop auto-completions (participants.loopAttendance map).
 * @param {Record<string, boolean>} loopMap
 */
export function loopAttendanceSummary(loopMap = {}) {
  const completedDates = Object.keys(loopMap || {})
    .filter((k) => loopMap[k])
    .sort();
  const completedDays = completedDates.length;
  const lastCompleted = completedDates.length ? completedDates[completedDates.length - 1] : null;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const k = localDateKeyFromDate(cursor);
    if (loopMap[k]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }

  return { completedDays, streak, lastCompleted };
}

/** Build participant.academicAttendance patch from register list. */
export function academicAttendancePatch(registers, bookingId) {
  const summary = studentAttendanceFromRegisters(registers, bookingId);
  return {
    academicAttendance: {
      ...summary,
      updatedAt: new Date().toISOString(),
    },
  };
}

/** CSV rows for one register doc. */
export function registerToCsvRows(register, participantsById) {
  const rows = [['Booking ID', 'Name', 'Status', 'Note']];
  const students = register.students || {};
  for (const [bid, entry] of Object.entries(students)) {
    const p = participantsById[bid];
    rows.push([
      bid,
      p?.name || p?.email || '',
      entry.status || '',
      entry.note || '',
    ]);
  }
  return rows;
}

export function rowsToCsv(rows) {
  return rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}
