import { doc, getDoc, getDocs, collection } from "firebase/firestore";
/**
 * @deprecated Browser cohort publish — use enqueueCohortPublish + cohort-worker (Consolidation 1.3).
 * Retained for reference/tests; EarlyWarningAdmin queues backend jobs only.
 */
import { db } from "../firebase";
import { dumpsToGraph } from "../recall/mind/dump-classify";
import { loadAttempts, applyAttempts } from "../brainmap/attempts";
import {
  collectConceptItems,
  buildConceptIndex,
  replayMastery,
  addParentAggregates,
  buildLearnerState,
} from "../brainmap/recall-to-graph";
import {
  stratifyStudent,
  detectTrigger,
  findBestIntervention,
  heatmapCells,
  detectStruggleAlerts,
} from "./ews-engine";
import { computeAttentionState } from "./engagement-signals";
import { loadEngagementSummary } from "../brainmap/engagement";
import { trendFromScores, streakFromDates, reviewDueCounts, scoreVolatility, effectiveMastery, growthFromScores, bestScore, percentileRank } from "../ml/class-metrics";
import { participationSlope } from "../ml/event-metrics";
import { computeAllReviewIntervals } from "../anps/anps-engine";

const CONCURRENCY = 12; // students processed in parallel (each does ~9 small reads)

function safeISO(dateStr) {
  const t = Date.parse(dateStr);
  return Number.isNaN(t) ? undefined : new Date(t).toISOString();
}

/** Coerce a Firestore Timestamp | seconds-obj | ISO string into an ISO string. */
function tsToISO(c) {
  if (!c) return null;
  const ts = c.toMillis?.() ?? (c.seconds ? c.seconds * 1000 : Date.parse(c));
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
}

// Derive ordered session ids + meta from the active school's subjects (the `subjects`
// shape preserves the legacy session key as `id`, so event/zero2dev is unchanged).
function deriveSessionMeta(subjects) {
  return (subjects || []).reduce((acc, s) => {
    acc[s.id] = { label: s.label, title: s.title, date: s.date, dateISO: safeISO(s.date) };
    return acc;
  }, {});
}

// Local module-level cache for session questions, keyed by the subject set so two
// schools published in the same page session can't serve each other's questions.
const sessionQuestionCache = new Map(); // sessionOrder.join(',') → { sid: data }

async function loadSessionQuestions(sessionOrder) {
  const key = sessionOrder.join(",");
  if (sessionQuestionCache.has(key)) return sessionQuestionCache.get(key);
  const out = {};
  await Promise.all(
    sessionOrder.map(async (sid) => {
      try {
        const snap = await getDoc(doc(db, "session_questions", sid));
        out[sid] = snap.exists() ? snap.data() : null;
      } catch {
        out[sid] = null;
      }
    }),
  );
  sessionQuestionCache.set(key, out);
  return out;
}

async function loadRecall(bookingId, sessionOrder) {
  const out = {};
  await Promise.all(
    sessionOrder.map(async (sid) => {
      try {
        const snap = await getDoc(doc(db, "participants", bookingId, "recall", sid));
        out[sid] = snap.exists() ? snap.data() : null;
      } catch {
        out[sid] = null;
      }
    }),
  );
  return out;
}

async function loadDumps(bookingId) {
  try {
    const snap = await getDocs(collection(db, "student_dumps", bookingId, "dumps"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

/** Run `fn` over `items` with bounded concurrency; reports progress as each finishes. */
async function mapLimit(items, limit, fn, onProgress) {
  const out = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx], idx);
      done++;
      onProgress?.(done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, worker));
  return out;
}

/** Compute one student's risk + per-topic heatmap cells (deterministic, no Gemini). */
async function processStudent(p, sessionQuestionsBySession, classId, sessionOrder, sessionMeta) {
  const bookingId = p.id;
  // D1 — only fetch recall for sessions that actually have published questions. A
  // session with no questions yields no concept items anyway, and a pure-school student
  // (recall lives in student_plan_attempts, not participants/recall) has none of these
  // docs — so this drops N wasted getDocs per student without changing any output.
  const sessionsWithQuestions = sessionOrder.filter((sid) => sessionQuestionsBySession[sid]);
  const [recallBySession, dumps, attempts, summary] = await Promise.all([
    loadRecall(bookingId, sessionsWithQuestions),
    loadDumps(bookingId),
    loadAttempts(bookingId),
    loadEngagementSummary(bookingId),
  ]);

  const conceptItems = collectConceptItems(sessionQuestionsBySession, recallBySession, sessionOrder, sessionMeta, {});
  const { questionToConcept, concepts, parents } = buildConceptIndex(conceptItems, {});

  let topicMasteryMap = replayMastery(conceptItems, questionToConcept, recallBySession, sessionMeta, {});
  topicMasteryMap = addParentAggregates(topicMasteryMap, concepts, parents);

  const dumpGraph = dumpsToGraph(dumps);
  Object.assign(topicMasteryMap, dumpGraph.masteryEntries);
  applyAttempts(topicMasteryMap, attempts);

  // Most recent activity → meaningful inactivity signal (default would be "now").
  let lastActiveAt = 0;
  if (summary?.lastViewAt) {
    const ts = Date.parse(summary.lastViewAt);
    if (ts > lastActiveAt) lastActiveAt = ts;
  }
  for (const sid of sessionOrder) {
    const c = recallBySession[sid]?.completedAt;
    if (c) { const ts = c.toMillis?.() ?? (c.seconds ? c.seconds * 1000 : Date.parse(c)); if (ts > lastActiveAt) lastActiveAt = ts; }
  }
  for (const d of dumps) { if (d.generatedAt) { const ts = Date.parse(d.generatedAt); if (ts > lastActiveAt) lastActiveAt = ts; } }
  for (const a of attempts) { if (a.completedAt) { const ts = Date.parse(a.completedAt); if (ts > lastActiveAt) lastActiveAt = ts; } }
  const lastActiveAtOverride = lastActiveAt > 0 ? new Date(lastActiveAt).toISOString() : null;

  const learnerState = buildLearnerState(bookingId, topicMasteryMap, {}, classId, lastActiveAtOverride);
  learnerState.attentionState = computeAttentionState(summary, attempts, dumps);

  const strat = stratifyStudent(learnerState);
  const { trigger, severityScore } = detectTrigger(learnerState);
  const bestIntervention = trigger ? findBestIntervention(trigger, severityScore) : null;
  const alerts = detectStruggleAlerts(learnerState);

  // Per-student performance signals for the teacher roster (F1/F2 trend, F19 streak).
  // Reuses the same tested pure helpers as the student surface; no extra reads.
  const scoreSeries = [...attempts]
    .filter((a) => typeof a.score === "number" && a.completedAt)
    .sort((x, y) => String(x.completedAt).localeCompare(String(y.completedAt)))
    .map((a) => a.score);
  const trend = trendFromScores(scoreSeries);
  const volatility = scoreVolatility(scoreSeries); // F3 consistency
  const growth = growthFromScores(scoreSeries); // F31 since-start growth

  const activityDates = [];
  if (summary?.dailyMs) for (const k of Object.keys(summary.dailyMs)) activityDates.push(k);
  for (const a of attempts) { const iso = tsToISO(a.completedAt); if (iso) activityDates.push(iso); }
  for (const d of dumps) { const iso = tsToISO(d.generatedAt); if (iso) activityDates.push(iso); }
  for (const sid of sessionOrder) { const iso = tsToISO(recallBySession[sid]?.completedAt); if (iso) activityDates.push(iso); }
  const streak = streakFromDates(activityDates);

  // Weekly consistency (F21): distinct active days in the last 7 days.
  const wkCut = Date.now() - 7 * 86400000;
  const weekDays = new Set();
  for (const d of activityDates) { const t = Date.parse(d); if (!Number.isNaN(t) && t >= wkCut) weekDays.add(d.slice(0, 10)); }
  const weeklyActiveDays = weekDays.size;

  // Participation slope (Wave-F): trend of daily study-time from the engagement
  // rollup buckets — no extra reads. Negative = disengaging. Latency trend from
  // the attempt series (positive = slowing down → struggling). Both advisory.
  const dailyMsSeries = summary?.dailyMs
    ? Object.keys(summary.dailyMs).sort().map((k) => summary.dailyMs[k]).filter((n) => Number.isFinite(n))
    : [];
  const partSlope = participationSlope(dailyMsSeries);
  const latencySeries = [...attempts]
    .filter((a) => typeof a.avgLatencyMs === "number" && a.avgLatencyMs > 0 && a.completedAt)
    .sort((x, y) => String(x.completedAt).localeCompare(String(y.completedAt)))
    .map((a) => a.avgLatencyMs);
  const latencyTrend = participationSlope(latencySeries);
  const avgLatencyMs = latencySeries.length ? latencySeries.reduce((s, n) => s + n, 0) / latencySeries.length : null;

  // Review due / overdue (F13/F15) via the same spacing engine the student planner uses.
  const reviewIntervals = computeAllReviewIntervals(topicMasteryMap);
  const { due: reviewDue, overdue: reviewOverdue } = reviewDueCounts(reviewIntervals);

  // Forgetting-adjusted (effective) mastery (F42): mean of mastery × time-decayed retention.
  let effSum = 0, effN = 0;
  for (const iv of reviewIntervals) {
    const tm = topicMasteryMap[iv.topicId];
    if (tm && typeof tm.mastery === "number") { effSum += effectiveMastery(tm.mastery, iv.currentRetention); effN++; }
  }
  const effMastery = effN ? effSum / effN : null;

  // SCH (G4 short-term) — school recall attempts have no event recall taxonomy, so
  // their topicId is the bare curriculum id (chapter/subject). Map each id to the
  // human label the attempt was recorded with so the teacher heatmap reads as
  // "Subject → Chapter" instead of a raw id. Label only — no pipeline/structure change.
  const attemptLabels = {};
  for (const at of attempts) {
    if (!at?.topicId) continue;
    const subjectLabel = at.subjectLabel || "";
    const chapterLabel = at.chapterLabel || at.topicLabel || "";
    const label = (subjectLabel && chapterLabel && chapterLabel !== subjectLabel)
      ? `${subjectLabel} → ${chapterLabel}`
      : (chapterLabel || subjectLabel);
    if (label) attemptLabels[at.topicId] = { label, subjectLabel };
  }

  const studentHeatmap = heatmapCells(topicMasteryMap);
  const topics = {};
  for (const [topicId, cell] of Object.entries(studentHeatmap)) {
    let label = topicId;
    let sessionId = "general";
    let sessionLabelOverride = "";
    if (concepts[topicId]) { label = concepts[topicId].label; sessionId = concepts[topicId].firstSession || "general"; }
    else if (parents[topicId]) { label = parents[topicId].label; sessionId = parents[topicId].firstSession || "general"; }
    else if (attemptLabels[topicId]) {
      // School chapter/subject recall: use the curriculum label and group the row
      // under its subject rather than the generic "Other / Brain Dumps".
      label = attemptLabels[topicId].label;
      if (attemptLabels[topicId].subjectLabel) sessionLabelOverride = attemptLabels[topicId].subjectLabel;
    }
    const sm = sessionMeta[sessionId];
    const sessionLabel = sessionLabelOverride || (sm ? `${sm.label} — ${sm.title}` : "Other / Brain Dumps");
    topics[topicId] = { label, sessionId, sessionLabel, cell };
  }

  return {
    student: {
      bookingId,
      name: p.name || p.email,
      tier: strat.tier,
      riskScore: strat.overallRiskScore,
      // Advisory participation/latency trends (Wave-F). Declining participation
      // nudges riskAdjusted up a little without disturbing the canonical tiers.
      participationSlope: partSlope,
      latencyTrend,
      avgLatencyMs,
      participationDeclining: partSlope <= -0.2,
      riskAdjusted: Math.max(0, Math.min(1, strat.overallRiskScore + (partSlope <= -0.2 ? 0.05 : 0))),
      topTrigger: trigger,
      prescribedAction: bestIntervention?.prescribedAction || null,
      struggleTopics: alerts.map((a) => a.topicId).slice(0, 8), // cap keeps the main doc small
      // Performance trend (F1/F2) + study streak (F19), null when there's no series.
      recentAvg: scoreSeries.length ? trend.recentAvg : null,
      trendPct: scoreSeries.length ? trend.deltaPct : null,
      trendDir: scoreSeries.length ? trend.direction : null,
      streakCurrent: streak.current,
      streakLongest: streak.longest,
      reviewDue,
      reviewOverdue,
      consistency: scoreSeries.length ? volatility.consistency : "unknown",
      effectiveMastery: effMastery,
      growthPct: scoreSeries.length >= 2 ? growth.deltaPct : null,
      bestScore: bestScore(scoreSeries),
      weeklyActiveDays,
    },
    topics,
  };
}

/**
 * Builds the Early Warning System cohort risk snapshot for a class.
 * `onProgress(done, total)` (optional) reports student-processing progress.
 */
export async function buildCohortRisk(classId, participants, subjects, onProgress) {
  const sessionOrder = (subjects || []).map((s) => s.id);
  const sessionMeta = deriveSessionMeta(subjects);
  const sessionQuestionsBySession = await loadSessionQuestions(sessionOrder);

  const cohort = {
    classId,
    name: classId,
    summary: { totalStudents: participants.length, tier1Count: 0, tier2Count: 0, tier3Count: 0, onTrackCount: 0, noDataCount: 0 },
    students: [],
    heatmap: {},
    generatedAt: new Date().toISOString(),
  };

  // Process students in parallel (bounded) — sequential was minutes at cohort scale.
  // One bad student doc must not abort the whole cohort, so failures degrade to a
  // minimal "on track / no data" entry.
  const results = await mapLimit(
    participants,
    CONCURRENCY,
    (p) => processStudent(p, sessionQuestionsBySession, classId, sessionOrder, sessionMeta).catch((err) => {
      console.warn(`[EWS] student ${p.id} failed:`, err?.message || err);
      return {
        // G5 — tag the degraded entry so the teacher view can show "no data" rather
        // than counting a failed-to-load student as genuinely on track.
        student: { bookingId: p.id, name: p.name || p.email, tier: "none", dataError: true, riskScore: 0, participationSlope: 0, latencyTrend: 0, avgLatencyMs: null, participationDeclining: false, riskAdjusted: 0, topTrigger: null, prescribedAction: null, struggleTopics: [], recentAvg: null, trendPct: null, trendDir: null, streakCurrent: 0, streakLongest: 0, reviewDue: 0, reviewOverdue: 0, consistency: "unknown", effectiveMastery: null, growthPct: null, bestScore: null, weeklyActiveDays: 0 },
        topics: {},
      };
    }),
    onProgress,
  );

  const allTopics = {};
  for (const { student, topics } of results) {
    if (student.dataError) cohort.summary.noDataCount++;
    else if (student.tier === "tier1_critical") cohort.summary.tier1Count++;
    else if (student.tier === "tier2_at_risk") cohort.summary.tier2Count++;
    else if (student.tier === "tier3_monitoring") cohort.summary.tier3Count++;
    else cohort.summary.onTrackCount++;
    cohort.students.push(student);

    for (const [topicId, t] of Object.entries(topics)) {
      if (!allTopics[topicId]) {
        allTopics[topicId] = { label: t.label, sessionId: t.sessionId, sessionLabel: t.sessionLabel, cells: {} };
      }
      allTopics[topicId].cells[student.bookingId] = t.cell;
    }
  }

  cohort.heatmap = allTopics;

  // ── Cohort aggregates (Wave C, computed at publish time) ──────────────────────
  // F30 — class percentile: anonymous rank of each student's recent ability.
  const abilityOf = (s) =>
    typeof s.recentAvg === "number" ? s.recentAvg : (typeof s.effectiveMastery === "number" ? s.effectiveMastery : null);
  const population = cohort.students.map(abilityOf).filter((x) => x != null);
  for (const s of cohort.students) {
    const v = abilityOf(s);
    s.percentile = v != null && population.length ? percentileRank(v, population) : null;
  }
  // F35 — top improvers (by since-start growth); names kept for the teacher view.
  cohort.improvers = [...cohort.students]
    .filter((s) => typeof s.growthPct === "number")
    .sort((a, b) => b.growthPct - a.growthPct)
    .slice(0, 5)
    .map((s) => ({ bookingId: s.bookingId, name: s.name, deltaPct: s.growthPct }));

  // F32/F33 — ANONYMOUS per-topic class averages (no student data) for the student
  // "you vs class" / "most find hard" comparison. Published to cohort_topic_stats.
  cohort.topicAverages = {};
  for (const [tid, t] of Object.entries(allTopics)) {
    const cells = Object.values(t.cells);
    const avg = cells.length ? cells.reduce((s, c) => s + (c.masteryEstimate ?? 0), 0) / cells.length : 0;
    cohort.topicAverages[tid] = { label: t.label, avg, n: cells.length };
  }

  // Ordered list of the sessions that actually have topics (in canonical order), so the
  // teacher dashboard can offer a per-session view of each ZERO2DEV session.
  const presentSessions = new Set(Object.values(allTopics).map((t) => t.sessionId));
  cohort.sessionOrder = [...sessionOrder, "general"].filter((sid) => presentSessions.has(sid));

  // Per-session class summary: average mastery + struggling-cell count across all students.
  const sessionSummary = {};
  for (const topic of Object.values(allTopics)) {
    const sid = topic.sessionId || "general";
    if (!sessionSummary[sid]) {
      sessionSummary[sid] = { sessionId: sid, label: topic.sessionLabel, avgMastery: 0, topicCount: 0, strugglingCount: 0, _sum: 0, _cells: 0 };
    }
    const s = sessionSummary[sid];
    s.topicCount++;
    for (const cell of Object.values(topic.cells)) {
      s._sum += cell.masteryEstimate ?? 0;
      s._cells++;
      if (cell.isStruggling) s.strugglingCount++;
    }
  }
  for (const s of Object.values(sessionSummary)) {
    s.avgMastery = s._cells ? s._sum / s._cells : 0;
    delete s._sum; delete s._cells;
  }
  cohort.sessionSummary = sessionSummary;

  // Group the heatmap by session so the publisher can write ONE doc per session.
  // A single all-students heatmap can exceed Firestore's 1 MB doc limit at cohort
  // scale; per-session docs stay well under it (and the teacher only reads theirs).
  const heatmapBySession = {};
  for (const [topicId, topic] of Object.entries(allTopics)) {
    const sid = topic.sessionId || "general";
    (heatmapBySession[sid] ||= {})[topicId] = topic;
  }
  cohort.heatmapBySession = heatmapBySession;

  return cohort;
}
