/** Exam / marks helpers (pure). */

export const EXAM_TYPES = ['unit_test', 'midterm', 'final', 'assignment'];
export const EXAM_STATUS = ['draft', 'marks_entry', 'published', 'locked'];

/** exams/{schoolId}__{divisionId}__{subjectId}__{slug} */
export function examDocId(schoolId, divisionId, subjectId, slug) {
  return `${schoolId}__${divisionId}__${subjectId}__${slug}`;
}

export function slugExamName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** Simple percentage → letter grade (CBSE-ish bands). */
export function gradeFromPercentage(pct) {
  if (pct == null || Number.isNaN(pct)) return '';
  if (pct >= 91) return 'A1';
  if (pct >= 81) return 'A2';
  if (pct >= 71) return 'B1';
  if (pct >= 61) return 'B2';
  if (pct >= 51) return 'C1';
  if (pct >= 41) return 'C2';
  if (pct >= 33) return 'D';
  return 'E';
}

export function totalMarks(obtained = {}, max = {}) {
  const theory = Number(obtained.theory) || 0;
  const practical = Number(obtained.practical) || 0;
  const maxTheory = Number(max.theory) || 0;
  const maxPractical = Number(max.practical) || 0;
  return {
    obtained: { theory, practical, total: theory + practical },
    max: { theory: maxTheory, practical: maxPractical, total: maxTheory + maxPractical },
  };
}

export function percentageFromMarks(obtainedTotal, maxTotal) {
  if (!maxTotal) return null;
  return Math.round((obtainedTotal / maxTotal) * 100);
}

/** Participant exam summary patch when marks are published. */
export function publishedExamSummary(exam, mark) {
  const obt = mark.obtained?.total ?? mark.obtained ?? 0;
  const max = mark.max?.total ?? mark.max ?? exam.maxMarks ?? 100;
  const pct = percentageFromMarks(obt, max);
  return {
    examId: exam.examId || exam.id,
    name: exam.name,
    subjectId: exam.subjectId,
    type: exam.type,
    date: exam.date || null,
    obtained: obt,
    max,
    grade: mark.grade || gradeFromPercentage(pct),
    publishedAt: mark.publishedAt || new Date().toISOString(),
  };
}
