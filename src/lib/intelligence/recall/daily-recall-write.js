/**
 * Shared writer for the teacher slice of daily_recall — used by TodayRecallTopicCard
 * and LessonCard so recall-topic saves never diverge.
 */
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { recordAudit } from '../audit/audit-log';

/**
 * Merge one subject's slice into daily_recall/{docId}.
 * @param {object} opts
 * @param {string} opts.docId — dailyRecallDocId(schoolId, classId, date)
 */
export async function saveDailyRecallSlice({
  schoolId,
  classId,
  date,
  subjectId,
  chapterIds,
  freeTopics,
  teacherId,
  subjectLabel,
  className,
  docId,
}) {
  const picked = chapterIds || [];
  const freeList = Array.isArray(freeTopics)
    ? freeTopics.filter(Boolean)
    : (freeTopics?.trim() ? [freeTopics.trim()] : []);

  await setDoc(
    doc(db, 'daily_recall', docId),
    {
      schoolId,
      classId,
      date,
      subjects: {
        [subjectId]: {
          source: 'teacher',
          chapterIds: picked,
          freeTopics: freeList,
          setBy: teacherId || null,
          setAt: serverTimestamp(),
        },
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  recordAudit({
    schoolId,
    actorRole: 'teacher',
    action: 'daily_recall.set',
    targetType: 'daily_recall',
    targetId: docId,
    summary: `Set today's recall topic for ${subjectLabel || subjectId} · ${className || classId}`,
    meta: { subjectId, chapterIds: picked, freeTopics: freeList },
  });
}
