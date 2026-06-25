/**
 * Aggregate school recall attempts into a subject → chapter → student heatmap cube.
 * Pure — used by EWS publish (Wave 5) and unit tests.
 */

function riskFromMastery(m) {
  if (m == null) return 'unknown';
  if (m < 0.35) return 'high';
  if (m < 0.55) return 'medium';
  return 'low';
}

/**
 * @param {Array<{ bookingId?: string, subjectId?: string, chapterId?: string, subjectLabel?: string, chapterLabel?: string, topicLabel?: string, score?: number, completedAt?: string }>} attempts
 * @param {string} schoolId
 * @param {string} divisionId
 */
export function buildChapterHeatmap(attempts, schoolId, divisionId) {
  /** @type {Record<string, { subjectId: string, subjectLabel: string, chapters: Record<string, object> }>} */
  const bySubject = {};

  for (const at of attempts || []) {
    const subjectId = at.subjectId;
    const chapterId = at.chapterId || at.topicId;
    const bookingId = at.bookingId;
    if (!subjectId || !chapterId || !bookingId) continue;

    const subjectLabel = at.subjectLabel || subjectId;
    const chapterLabel = at.chapterLabel || at.topicLabel || chapterId;

    if (!bySubject[subjectId]) {
      bySubject[subjectId] = { schoolId, divisionId, subjectId, subjectLabel, chapters: {} };
    }
    const sub = bySubject[subjectId];
    if (!sub.chapters[chapterId]) {
      sub.chapters[chapterId] = {
        schoolId,
        divisionId,
        subjectId,
        chapterId,
        chapterLabel,
        students: {},
        summary: { avgMastery: 0, strugglingCount: 0, noDataCount: 0, attemptCount: 0 },
      };
    }
    const ch = sub.chapters[chapterId];
    const score = typeof at.score === 'number' ? at.score : null;
    const prev = ch.students[bookingId];
    const mastery = score != null
      ? (prev?.mastery != null ? (prev.mastery + score) / 2 : score)
      : prev?.mastery ?? null;

    ch.students[bookingId] = {
      mastery,
      lastAttemptAt: at.completedAt || prev?.lastAttemptAt || null,
      attempts: (prev?.attempts || 0) + 1,
      risk: riskFromMastery(mastery),
    };
  }

  for (const sub of Object.values(bySubject)) {
    for (const ch of Object.values(sub.chapters)) {
      const cells = Object.values(ch.students);
      let sum = 0;
      let n = 0;
      let struggling = 0;
      let noData = 0;
      for (const c of cells) {
        if (c.mastery == null) { noData++; continue; }
        sum += c.mastery;
        n++;
        if (c.mastery < 0.45) struggling++;
      }
      ch.summary = {
        avgMastery: n ? sum / n : 0,
        strugglingCount: struggling,
        noDataCount: noData,
        attemptCount: cells.reduce((s, c) => s + (c.attempts || 0), 0),
      };
    }
  }

  return bySubject;
}

/** Load attempts for a class roster and build the chapter heatmap cube. */
export async function buildChapterHeatmapForClass(participants, schoolId, divisionId, loadAttemptsFn) {
  const allAttempts = [];
  for (const p of participants) {
    const attempts = await loadAttemptsFn(p.id);
    for (const a of attempts) {
      if (!a.subjectId) continue;
      allAttempts.push({ ...a, bookingId: p.id });
    }
  }
  return buildChapterHeatmap(allAttempts, schoolId, divisionId);
}

/** Compact JSON for Firestore (mirrors session heatmap compactTopics pattern). */
export function compactChapterHeatmap(chapters) {
  const out = {};
  for (const [cid, ch] of Object.entries(chapters || {})) {
    const students = {};
    for (const [bid, s] of Object.entries(ch.students || {})) {
      students[bid] = [
        s.mastery ?? null,
        s.attempts ?? 0,
        s.risk === 'high' ? 1 : 0,
      ];
    }
    out[cid] = { l: ch.chapterLabel, s: students, m: ch.summary?.avgMastery ?? 0 };
  }
  return out;
}

export function parseCompactChapterHeatmap(data) {
  if (!data) return {};
  const raw = data.chaptersJson ? JSON.parse(data.chaptersJson) : data.chapters;
  const out = {};
  for (const [cid, ch] of Object.entries(raw || {})) {
    const students = {};
    for (const [bid, arr] of Object.entries(ch.c || ch.s || {})) {
      const a = Array.isArray(arr) ? arr : [];
      students[bid] = {
        mastery: a[0],
        attempts: a[1] ?? 0,
        risk: a[2] ? 'high' : 'low',
      };
    }
    out[cid] = { chapterId: cid, chapterLabel: ch.l, students, avgMastery: ch.m ?? 0 };
  }
  return out;
}
