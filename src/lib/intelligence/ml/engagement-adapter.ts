/**
 * Engagement → ML signal adapter (Module 104 input assembly, client side).
 *
 * Maps data the brain-map pipeline ALREADY loads — the resource-view rollup
 * (`student_resource_views/{bid}`) and graded plan-quiz attempts
 * (`student_plan_attempts/{bid}/attempts`) — into the Temporal + Behavioral +
 * (partial) Cognitive signals the feature extractor consumes. Without this the
 * predictor only ever sees the Mastery group; the other 20 features are zero.
 *
 * PURE & deterministic: no Firebase, no I/O. `now` is injectable for tests.
 * Returns PARTIALS — `extractFeatureVector`/`normaliseFeatureVector` zero-fill
 * and de-NaN every key we don't set, so omitting an unknown signal is safe (and
 * preferable to fabricating one).
 */

import { streakFromDates } from './class-metrics';
import { summariseEvents, participationSlope, type LearningEvent } from './event-metrics';
import type { EngagementSignals, CognitiveSignals } from './feature-extractor';

// ── Input shapes (loose; mirror the Firestore docs, all fields optional) ───────

/** `student_resource_views/{bookingId}` rollup (written by engagement-tracker.js). */
export interface EngagementRollup {
  dailyMs?: Record<string, number>; // { "YYYY-MM-DD"(local): activeMs }
  totalActiveMs?: number;
  viewCount?: number;
  lastViewAt?: string; // ISO
  byResource?: Record<string, { activeMs?: number; coverage?: number; opens?: number; lastAt?: string }>;
}

/** A graded plan-quiz attempt (student_plan_attempts/{bid}/attempts/*). */
export interface PlanAttempt {
  topicId?: string;
  score?: number; // 0..1
  correct?: number;
  total?: number;
  completedAt?: string; // ISO
  avgLatencyMs?: number;
  totalMs?: number;
  misconceptions?: number;
  recovered?: number;
}

/** A saved brain dump (student_dumps/{bid}/dumps/*) — recency only. */
export interface DumpRecord {
  generatedAt?: string; // ISO
}

export interface LearnerSignals {
  engagement: Partial<EngagementSignals>;
  cognitive: Partial<CognitiveSignals>;
  /** Normalized participation trend in [-1, 1] from the event stream (admin/EWS/ANPS, not a model key). */
  participationSlope: number;
}

export interface ToLearnerSignalsInput {
  summary?: EngagementRollup | null;
  attempts?: PlanAttempt[];
  dumps?: DumpRecord[];
  events?: LearningEvent[]; // student_events stream (feature-usage telemetry)
  now?: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const parseTime = (iso?: string | null): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/** Local calendar day key (matches engagement-tracker.js `localDateStr`). */
function localDayKey(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

/**
 * Integer day difference (today − key). Both "YYYY-MM-DD" strings are read as UTC
 * midnight, so the diff is tz-independent and exact. Bad input → Infinity (out of
 * every window).
 */
function dayDiff(key: string, todayKey: string): number {
  const a = Date.parse(`${key}T00:00:00Z`);
  const b = Date.parse(`${todayKey}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.round((b - a) / DAY_MS);
}

// ── Temporal (8) ────────────────────────────────────────────────────────────────

function temporal(
  summary: EngagementRollup | null | undefined,
  attempts: PlanAttempt[],
  dumps: DumpRecord[],
  now: Date,
): Partial<EngagementSignals> {
  const nowMs = now.getTime();
  const todayKey = localDayKey(now);
  const daily = summary?.dailyMs && typeof summary.dailyMs === 'object' ? summary.dailyMs : {};

  // Active calendar days, from the rollup's daily buckets plus attempt/dump days.
  const activeDayKeys = new Set<string>();
  for (const [k, ms] of Object.entries(daily)) {
    if (isNum(ms) && ms > 0) activeDayKeys.add(k);
  }
  for (const a of attempts) {
    const t = parseTime(a.completedAt);
    if (t != null) activeDayKeys.add(localDayKey(new Date(t)));
  }
  for (const d of dumps) {
    const t = parseTime(d.generatedAt);
    if (t != null) activeDayKeys.add(localDayKey(new Date(t)));
  }

  const out: Partial<EngagementSignals> = {};

  // Days since the most recent interaction of any kind.
  const lastTimes: number[] = [];
  const lv = parseTime(summary?.lastViewAt);
  if (lv != null) lastTimes.push(lv);
  for (const a of attempts) {
    const t = parseTime(a.completedAt);
    if (t != null) lastTimes.push(t);
  }
  for (const d of dumps) {
    const t = parseTime(d.generatedAt);
    if (t != null) lastTimes.push(t);
  }
  if (lastTimes.length) {
    out.daysSinceLastInteraction = Math.max(0, (nowMs - Math.max(...lastTimes)) / DAY_MS);
  }

  // Distinct active days in the trailing 7 / 30 day windows (inclusive of today).
  const within = (n: number): number => {
    let count = 0;
    for (const k of activeDayKeys) {
      const diff = dayDiff(k, todayKey);
      if (diff >= 0 && diff < n) count += 1;
    }
    return count;
  };
  if (activeDayKeys.size) {
    out.sessionFrequency7d = within(7);
    out.sessionFrequency30d = within(30);
  }

  // Average session duration (min) = total active time / number of views.
  if (isNum(summary?.totalActiveMs) && isNum(summary?.viewCount) && (summary?.viewCount ?? 0) > 0) {
    out.avgSessionDurationMin = summary!.totalActiveMs! / summary!.viewCount! / 60_000;
  }

  // Study time per day (min) = sum of last-7d active ms / 7.
  let ms7 = 0;
  let haveDaily = false;
  for (const [k, ms] of Object.entries(daily)) {
    if (!isNum(ms)) continue;
    haveDaily = true;
    if (dayDiff(k, todayKey) < 7 && dayDiff(k, todayKey) >= 0) ms7 += ms;
  }
  if (haveDaily) out.studyTimePerDayMin = ms7 / 7 / 60_000;

  // Study streak (reuse class-metrics; date-only keys pass through its UTC bucketing).
  if (activeDayKeys.size) {
    out.streakDays = streakFromDates([...activeDayKeys], now).current;
  }

  // Mean gap between consecutive active days, in hours.
  if (activeDayKeys.size >= 2) {
    const sortedMs = [...activeDayKeys]
      .map((k) => Date.parse(`${k}T00:00:00Z`))
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < sortedMs.length; i++) gaps.push((sortedMs[i] - sortedMs[i - 1]) / 3_600_000);
    if (gaps.length) out.interSessionIntervalAvgH = mean(gaps);
  }

  return out;
}

// ── Behavioral (12) ──────────────────────────────────────────────────────────────

function behavioral(
  summary: EngagementRollup | null | undefined,
  attempts: PlanAttempt[],
): Partial<EngagementSignals> {
  const out: Partial<EngagementSignals> = {};
  const byResource = summary?.byResource && typeof summary.byResource === 'object' ? summary.byResource : {};
  const resources = Object.values(byResource);

  // Completion: mean correct/total over attempts; fallback mean resource coverage.
  const ratios = attempts
    .filter((a) => isNum(a.total) && (a.total as number) > 0 && isNum(a.correct))
    .map((a) => clamp01((a.correct as number) / (a.total as number)));
  if (ratios.length) {
    const completion = clamp01(mean(ratios));
    out.completionRate = completion;
    out.dropoffRate = clamp01(1 - completion);
  } else if (resources.length) {
    const covs = resources.map((r) => (isNum(r.coverage) ? clamp01(r.coverage) : 0));
    const completion = clamp01(mean(covs));
    out.completionRate = completion;
    out.dropoffRate = clamp01(1 - completion);
  }
  // (no attempts/resources → omit; extractor defaults completion_rate to 1, dropoff 0)

  // Quiz retry rate: share of attempted topics tried more than once.
  if (attempts.length) {
    const perTopic = new Map<string, number>();
    for (const a of attempts) {
      if (!a.topicId) continue;
      perTopic.set(a.topicId, (perTopic.get(a.topicId) ?? 0) + 1);
    }
    if (perTopic.size) {
      const retried = [...perTopic.values()].filter((c) => c > 1).length;
      out.quizRetryRate = clamp01(retried / perTopic.size);
    }
  }

  // Revision rate: share of resources opened more than once.
  if (resources.length) {
    const revisited = resources.filter((r) => isNum(r.opens) && (r.opens as number) > 1).length;
    out.revisionRate = clamp01(revisited / resources.length);
    out.resourceAccessRate = resources.length; // count of distinct resources accessed
  }

  // Slip-vs-misconception follow-up signals.
  const sumMisc = attempts.reduce((s, a) => s + (isNum(a.misconceptions) ? a.misconceptions : 0), 0);
  const sumRec = attempts.reduce((s, a) => s + (isNum(a.recovered) ? a.recovered : 0), 0);
  if (sumMisc + sumRec > 0) {
    out.selfAssessmentAccuracy = clamp01(sumRec / (sumMisc + sumRec));
    out.errorCorrectionRate = clamp01(sumRec / Math.max(sumMisc, 1));
  }

  // peer_interaction_count, social_study_behavior: no peer feature exists → omit
  // (stay 0; do not fabricate). chat_frequency / hint_usage_rate /
  // feedback_response_rate are now fed from the event stream — see eventBased().

  return out;
}

// ── Event-based (feature-usage telemetry → previously-empty model slots) ─────────

/**
 * Map the `student_events` stream (tab_open / guide_open / clarify_answered, plus
 * the existing quiz_* events) into the behavioral + cognitive slots the model
 * already expects but that carried no signal before (validation A4). Honest,
 * bounded proxies — opening an interactive guide is help-seeking, switching tabs
 * is task-switching, answering the reflection is responding to feedback.
 */
function eventBased(events: LearningEvent[]): { engagement: Partial<EngagementSignals>; cognitive: Partial<CognitiveSignals>; participationSlope: number } {
  const eng: Partial<EngagementSignals> = {};
  const cog: Partial<CognitiveSignals> = {};
  if (!Array.isArray(events) || events.length === 0) return { engagement: eng, cognitive: cog, participationSlope: 0 };

  const s = summariseEvents(events);
  const activeDays = Math.max(1, Object.keys(s.dailyCounts).length);

  // Help-seeking via interactive study guides → hint_usage_rate (opens per active day).
  if (s.guideOpens > 0) eng.hintUsageRate = clamp01(s.guideOpens / activeDays);
  // Q&A / Questions-tab usage → chat_frequency (queries per active day).
  if (s.queryOpens > 0) eng.chatFrequency = s.queryOpens / activeDays;
  // Responding to the slip-vs-misconception reflection → feedback_response_rate.
  if (s.quizCompleted > 0) eng.feedbackResponseRate = clamp01(s.clarifyAnswered / s.quizCompleted);
  // Breadth of navigation across the app surface → task_switching_rate (~8 tabs).
  if (s.distinctTabs > 0) cog.taskSwitchingRate = clamp01(s.distinctTabs / 8);

  return { engagement: eng, cognitive: cog, participationSlope: participationSlope(s.dailyCounts) };
}

// ── Cognitive (partial — merged with the energy check-in by the caller) ──────────

function cognitive(attempts: PlanAttempt[], avgSessionDurationMin?: number): Partial<CognitiveSignals> {
  const out: Partial<CognitiveSignals> = {};
  const lats = attempts.filter((a) => isNum(a.avgLatencyMs) && (a.avgLatencyMs as number) > 0).map((a) => a.avgLatencyMs as number);
  if (lats.length) out.responseLatencySec = mean(lats) / 1000;
  if (isNum(avgSessionDurationMin)) out.attentionSpanEstimationMin = avgSessionDurationMin;
  // cognitive_overload_index / focus_time_ratio / stress_proxy come from the
  // energy check-in (set in StudentMind); don't fabricate them here.
  return out;
}

// ── Public ───────────────────────────────────────────────────────────────────────

/**
 * Assemble the Temporal + Behavioral + (partial) Cognitive signals from the
 * already-loaded engagement rollup and plan-quiz attempts. Pure; safe on empty
 * input (returns sparse partials with no NaN).
 */
export function toLearnerSignals(input: ToLearnerSignalsInput = {}): LearnerSignals {
  const { summary = null, attempts = [], dumps = [], events = [], now = new Date() } = input;
  const safeAttempts = Array.isArray(attempts) ? attempts : [];
  const safeDumps = Array.isArray(dumps) ? dumps : [];
  const safeEvents = Array.isArray(events) ? events : [];

  const ev = eventBased(safeEvents);
  const engagement = {
    ...temporal(summary, safeAttempts, safeDumps, now),
    ...behavioral(summary, safeAttempts),
    ...ev.engagement, // event-derived slots (hint/chat/feedback) — previously 0
  };
  return {
    engagement,
    cognitive: { ...cognitive(safeAttempts, engagement.avgSessionDurationMin), ...ev.cognitive },
    participationSlope: ev.participationSlope,
  };
}

export default toLearnerSignals;
