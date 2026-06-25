/**
 * Pure grading helpers for recall quizzes (Misconception Radar M3 + Confidence Tap M4).
 * Kept framework-free so it is unit-testable and shared by the attempt writer.
 */

/**
 * Summarise a question group's per-question details.
 * @param {Array<{isCorrect:boolean, confidence:('sure'|'unsure'|null)}>} questionDetails
 * @returns {{misconceptions:number, calibrationErrors:number}}
 *   misconceptions  — wrong answers (a "which wrong" radar feeds off questionDetails.selectedIndex)
 *   calibrationErrors — confident + wrong (the dangerous quadrant: won't study, M4)
 */
export function gradeQuestionDetails(questionDetails = []) {
  const misconceptions = questionDetails.filter((qd) => !qd.isCorrect).length;
  const calibrationErrors = questionDetails.filter((qd) => qd.confidence === 'sure' && !qd.isCorrect).length;
  return { misconceptions, calibrationErrors };
}
