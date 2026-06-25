import { gradeFromPercentage } from './exam-utils.js';
import { studentAttendanceFromRegisters, loopAttendanceSummary } from './attendance.js';

/**
 * Build a draft report card from student profile, published exam marks, and attendance registers.
 * Pure — no Firebase I/O.
 *
 * @param {object} opts
 * @param {object} opts.student — participant doc
 * @param {string} opts.schoolId
 * @param {string} opts.academicYearId
 * @param {string} opts.termId
 * @param {Array<object>} opts.exams — exam docs with nested marks for this student
 * @param {Array<object>} opts.registers — attendance_days docs (submitted/locked)
 * @param {Record<string, { title?: string, label?: string }>} opts.subjectLabels
 */
export function buildReportCard({
  student,
  schoolId,
  academicYearId,
  termId,
  exams = [],
  registers = [],
  subjectLabels = {},
}) {
  const bookingId = student.bookingId || student.id;
  const divisionId = student.divisionId || student.classId || '';

  const subjects = [];
  let totalObtained = 0;
  let totalMax = 0;

  for (const row of exams) {
    const mark = row.mark;
    if (!mark?.published) continue;
    const obt = mark.obtained?.total ?? 0;
    const max = mark.max?.total ?? row.exam.maxMarks ?? 100;
    totalObtained += obt;
    totalMax += max;
    const pct = max ? Math.round((obt / max) * 100) : null;
    subjects.push({
      subjectId: row.exam.subjectId,
      subjectName: subjectLabels[row.exam.subjectId]?.title
        || subjectLabels[row.exam.subjectId]?.label
        || row.exam.subjectId,
      marks: obt,
      maxMarks: max,
      grade: mark.grade || gradeFromPercentage(pct),
      teacherRemark: mark.remarks || '',
    });
  }

  const attendance = studentAttendanceFromRegisters(registers, bookingId);
  const loop = loopAttendanceSummary(student.loopAttendance || {});
  const overallPct = totalMax ? Math.round((totalObtained / totalMax) * 100) : null;

  return {
    schoolId,
    academicYearId,
    termId,
    bookingId,
    divisionId,
    student: {
      name: student.name || '',
      rollNo: student.rollNo || '',
      admissionNo: student.admissionNo || '',
    },
    subjects,
    attendance: {
      workingDays: attendance.workingDays,
      presentDays: attendance.presentDays,
      percentage: attendance.percentage,
    },
    loopCompletion: {
      completedDays: loop.completedDays,
      streak: loop.streak,
      lastCompleted: loop.lastCompleted,
    },
    overall: {
      total: totalObtained,
      maxTotal: totalMax,
      percentage: overallPct,
      grade: gradeFromPercentage(overallPct),
      rankBand: null,
    },
    remarks: '',
    status: 'draft',
    generatedAt: new Date().toISOString(),
  };
}

/** report_cards/{schoolId}__{academicYearId}__{termId}__{bookingId} */
export function reportCardDocId(schoolId, academicYearId, termId, bookingId) {
  return `${schoolId}__${academicYearId}__${termId}__${bookingId}`;
}
