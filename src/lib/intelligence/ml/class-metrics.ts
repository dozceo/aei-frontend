/**
 * Pure aggregation helpers for cohort/class views (patent Module 107 teacher
 * writeback) and the Wave-1 performance-trend features (F1, F2, F8).
 *
 * All pure & deterministic so they are unit-testable with no React/Firestore.
 */

import type { LearnerPrediction, AttentionRisk } from './types';

// ── Performance trend (F1 recent avg, F2 improvement, F8 rolling series) ──────

export type TrendDirection = 'improving' | 'declining' | 'flat';

export interface TrendSummary {
  recentAvg: number; // 0..1 mean of the window
  deltaPct: number; // signed % change first->last half of the window
  direction: TrendDirection;
  points: number[]; // the (clamped) series, for a sparkline
  sampleSize: number;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Summarise a score series (each 0..1). `flatBand` is the +/- fraction within
 * which a change is "flat". Empty/one-point series => flat, delta 0.
 */
export function trendFromScores(scores: number[], flatBand = 0.03): TrendSummary {
  const points = scores.filter((s) => Number.isFinite(s)).map(clamp01);
  if (points.length === 0) {
    return { recentAvg: 0, deltaPct: 0, direction: 'flat', points: [], sampleSize: 0 };
  }
  const recentAvg = mean(points);
  if (points.length === 1) {
    return { recentAvg, deltaPct: 0, direction: 'flat', points, sampleSize: 1 };
  }
  const mid = Math.floor(points.length / 2);
  const firstHalf = mean(points.slice(0, mid || 1));
  const secondHalf = mean(points.slice(mid));
  const delta = secondHalf - firstHalf;
  const deltaPct = firstHalf > 0 ? (delta / firstHalf) * 100 : delta * 100;
  const direction: TrendDirection =
    Math.abs(delta) <= flatBand ? 'flat' : delta > 0 ? 'improving' : 'declining';
  return { recentAvg, deltaPct, direction, points, sampleSize: points.length };
}

/** Percentile rank (0..1) of `value` within `population` (inclusive, anonymous). */
export function percentileRank(value: number, population: number[]): number {
  const xs = population.filter((x) => Number.isFinite(x));
  if (xs.length === 0) return 0.5;
  const below = xs.filter((x) => x < value).length;
  const equal = xs.filter((x) => x === value).length;
  return clamp01((below + 0.5 * equal) / xs.length);
}

// ── Class summary (teacher heatmap / risk stratification) ─────────────────────

export type RiskTier = 'critical' | 'at_risk' | 'on_track';

export interface ClassSummary {
  total: number;
  averageMastery: number; // 0..1
  tierCounts: Record<RiskTier, number>;
  /** Anonymous: learnerId only, sorted most-urgent first. No names. */
  atRisk: Array<{ learnerId: string; tier: RiskTier; masteryProbability: number; dropoutProbability: number }>;
}

const RISK_TO_TIER: Record<AttentionRisk, RiskTier> = {
  critical: 'critical',
  high: 'critical',
  moderate: 'at_risk',
  low: 'on_track',
};

/** Map one prediction to a coarse class tier (combines attention + decision). */
export function tierFor(p: LearnerPrediction): RiskTier {
  if (p.decision.category === 'urgent_review') return 'critical';
  const base = RISK_TO_TIER[p.attentionRisk];
  if (base === 'on_track' && p.decision.category === 'spaced_revision') return 'at_risk';
  return base;
}

const TIER_ORDER: Record<RiskTier, number> = { critical: 0, at_risk: 1, on_track: 2 };

export function summariseClass(predictions: LearnerPrediction[]): ClassSummary {
  const tierCounts: Record<RiskTier, number> = { critical: 0, at_risk: 0, on_track: 0 };
  const atRisk: ClassSummary['atRisk'] = [];
  for (const p of predictions) {
    const tier = tierFor(p);
    tierCounts[tier] += 1;
    if (tier !== 'on_track') {
      atRisk.push({
        learnerId: p.learnerId,
        tier,
        masteryProbability: p.masteryProbability,
        dropoutProbability: p.dropoutProbability,
      });
    }
  }
  atRisk.sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || b.dropoutProbability - a.dropoutProbability,
  );
  return {
    total: predictions.length,
    averageMastery: mean(predictions.map((p) => p.masteryProbability)),
    tierCounts,
    atRisk,
  };
}

// ── Review due / overdue (F13, F15) ───────────────────────────────────────────

export interface ReviewCounts {
  due: number; // topics whose retention has dropped below the review threshold
  overdue: number; // due AND strongly faded (retention < overdueRetention)
}

/**
 * Count due / overdue topics from spacing intervals (e.g. the ANPS engine's
 * `computeAllReviewIntervals`). Pure: a topic is "due" when `isDue`, and "overdue"
 * when additionally its `currentRetention` has fallen below `overdueRetention`.
 */
export function reviewDueCounts(
  intervals: Array<{ isDue?: boolean; currentRetention?: number }>,
  overdueRetention = 0.5,
): ReviewCounts {
  let due = 0;
  let overdue = 0;
  for (const i of intervals ?? []) {
    if (i?.isDue) {
      due += 1;
      if ((typeof i.currentRetention === 'number' ? i.currentRetention : 1) < overdueRetention) overdue += 1;
    }
  }
  return { due, overdue };
}

// ── Ability growth since baseline (F31) ───────────────────────────────────────

export interface Growth {
  baseline: number; // mean of the earliest ~20% of scores
  current: number; // mean of the latest ~20%
  deltaPct: number; // signed % change baseline → current
  sampleSize: number;
}

/**
 * Total growth "since you started" (F31): earliest scores vs latest scores across
 * the full chronological series. Distinct from F2 (recent improvement rate).
 */
export function growthFromScores(scores: number[]): Growth {
  const xs = (scores ?? []).filter((s) => Number.isFinite(s)).map(clamp01);
  if (xs.length < 2) return { baseline: xs[0] ?? 0, current: xs[0] ?? 0, deltaPct: 0, sampleSize: xs.length };
  const n = Math.max(1, Math.round(xs.length * 0.2));
  const baseline = mean(xs.slice(0, n));
  const current = mean(xs.slice(-n));
  const deltaPct = baseline > 0 ? ((current - baseline) / baseline) * 100 : (current - baseline) * 100;
  return { baseline, current, deltaPct, sampleSize: xs.length };
}

// ── Study momentum (F43) — latest vs EWMA baseline ────────────────────────────

export type MomentumState = 'surging' | 'steady' | 'dipping' | 'unknown';

export interface Momentum {
  ewma: number; // EWMA over the whole series
  latest: number;
  delta: number; // latest − EWMA of everything before it
  state: MomentumState;
  label: string;
}

/**
 * Study momentum (F43): compare the latest score to the EWMA of the prior scores.
 * Surging when meaningfully above trend, dipping when below. <2 samples → unknown.
 */
export function studyMomentum(scores: number[], alpha = 0.4): Momentum {
  const xs = (scores ?? []).filter((s) => Number.isFinite(s)).map(clamp01);
  if (xs.length < 2) {
    return { ewma: xs[0] ?? 0, latest: xs[xs.length - 1] ?? 0, delta: 0, state: 'unknown', label: 'Building momentum' };
  }
  let ewma = xs[0];
  for (let i = 1; i < xs.length; i++) ewma = alpha * xs[i] + (1 - alpha) * ewma;
  let base = xs[0];
  for (let i = 1; i < xs.length - 1; i++) base = alpha * xs[i] + (1 - alpha) * base;
  const latest = xs[xs.length - 1];
  const delta = latest - base;
  const state: MomentumState = delta >= 0.08 ? 'surging' : delta <= -0.08 ? 'dipping' : 'steady';
  const label = state === 'surging' ? 'On a roll' : state === 'dipping' ? 'Slowing down' : 'Holding steady';
  return { ewma, latest, delta, state, label };
}

// ── Recency-weighted priority reason (F45) ────────────────────────────────────

export interface PriorityFactors {
  masteryGap?: number; // 0..1
  forgettingRisk?: number; // 0..1
  recentExposureDecay?: number; // 0..1 (high = seen recently)
  urgencySignal?: number; // 0..1
}

/**
 * Pick the dominant reason a concept is high-priority (F45 explainability). The
 * recency term is inverted: low recent exposure → "Not seen recently".
 */
export function priorityReason(c: PriorityFactors = {}): string {
  const stale = 1 - (typeof c.recentExposureDecay === 'number' ? c.recentExposureDecay : 0);
  const candidates: Array<[number, string]> = [
    [c.masteryGap ?? 0, 'Still shaky'],
    [c.forgettingRisk ?? 0, 'Fading from memory'],
    [stale, 'Not seen recently'],
    [c.urgencySignal ?? 0, 'Marked urgent'],
  ];
  candidates.sort((a, b) => b[0] - a[0]);
  return candidates[0][1];
}

// ── Spacing consistency / on-time reviews (F12) ───────────────────────────────

export interface SpacingConsistency {
  rate: number; // 0..1 — share of due reviews caught before badly fading
  label: string;
}

/**
 * Spacing consistency (F12): of the topics that came due, how many were caught
 * on-time (not yet strongly overdue). No due topics → perfect (1).
 */
export function spacingConsistency(due: number, overdue: number): SpacingConsistency {
  const d = Math.max(0, due || 0);
  const o = Math.max(0, Math.min(d, overdue || 0));
  const rate = d > 0 ? (d - o) / d : 1;
  const label = rate >= 0.8 ? 'On-track' : rate >= 0.5 ? 'Slipping' : 'Behind';
  return { rate, label };
}

// ── Score after a break (F7) ──────────────────────────────────────────────────

/**
 * Score-after-break insight (F7): compares scores on attempts that follow a gap
 * of >= `gapDays` to the overall average. Needs >=3 attempts and >=1 post-break
 * attempt, else null.
 */
export function scoreAfterBreak(
  entries: Array<{ score: number; t: number }>,
  gapDays = 3,
): { afterAvg: number; overallAvg: number; deltaPct: number; n: number } | null {
  const xs = (entries ?? [])
    .filter((e) => Number.isFinite(e.score) && Number.isFinite(e.t))
    .sort((a, b) => a.t - b.t);
  if (xs.length < 3) return null;
  const overallAvg = mean(xs.map((e) => clamp01(e.score)));
  const after: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    if (xs[i].t - xs[i - 1].t >= gapDays * 86_400_000) after.push(clamp01(xs[i].score));
  }
  if (!after.length) return null;
  const afterAvg = mean(after);
  const deltaPct = overallAvg > 0 ? ((afterAvg - overallAvg) / overallAvg) * 100 : 0;
  return { afterAvg, overallAvg, deltaPct, n: after.length };
}

// ── Learning curve steepness (F4) ─────────────────────────────────────────────

export type CurveTone = 'up' | 'flat' | 'down';

/** Learning-curve steepness (F4) from a mastery trajectory slope. */
export function learningCurve(slope: number): { label: string; tone: CurveTone } {
  const s = Number.isFinite(slope) ? slope : 0;
  if (s >= 0.05) return { label: 'Rising fast', tone: 'up' };
  if (s <= -0.05) return { label: 'Slipping', tone: 'down' };
  return { label: 'Steady', tone: 'flat' };
}

// ── Weekly consistency (F21) ──────────────────────────────────────────────────

/** Weekly consistency (F21): active days in the window / window size, + label. */
export function weeklyConsistency(activeDays: number, windowDays = 7): { rate: number; label: string } {
  const d = Math.max(0, Math.min(windowDays, activeDays || 0));
  const rate = windowDays > 0 ? d / windowDays : 0;
  const label = rate >= 0.7 ? 'Very consistent' : rate >= 0.4 ? 'Building habit' : 'Sporadic';
  return { rate, label };
}

// ── Best score (F6) ───────────────────────────────────────────────────────────

/** Best (max) score in a series, 0..1, or null when empty (F6 gold badge). */
export function bestScore(scores: number[]): number | null {
  const xs = (scores ?? []).filter((s) => Number.isFinite(s)).map(clamp01);
  return xs.length ? Math.max(...xs) : null;
}

// ── Forgetting-adjusted (effective) mastery (F42) ─────────────────────────────

/**
 * Forgetting-adjusted mastery (F42): what a learner can recall *now* = raw mastery
 * scaled by current retention (Bayesian × Ebbinghaus). Both inputs 0..1; result 0..1.
 */
export function effectiveMastery(mastery: number, retention: number): number {
  return clamp01(clamp01(mastery) * clamp01(retention));
}

export type DifficultyTag = 'mastered' | 'comfortable' | 'learning' | 'hard';

/**
 * Difficulty tag (F10): how hard a topic currently is for the learner, from
 * retention-adjusted mastery (FSRS-style — higher effective mastery = easier).
 * Pass retention = 1 to label from raw mastery (e.g. class-topic averages).
 */
export function difficultyTag(mastery: number, retention = 1): { tag: DifficultyTag; label: string } {
  const eff = effectiveMastery(mastery, retention);
  if (eff >= 0.75) return { tag: 'mastered', label: 'Mastered' };
  if (eff >= 0.5) return { tag: 'comfortable', label: 'Comfortable' };
  if (eff >= 0.3) return { tag: 'learning', label: 'Learning' };
  return { tag: 'hard', label: 'Hard' };
}

// ── Mastery depth (F40-lite) — Recall / Apply / Analyse from existing signals ──

/**
 * Mastery-depth 3-bar (F40, signal-derived — not Gemini Bloom's tagging):
 *  • Recall  = retention (can you still recall it)
 *  • Apply   = mastery (can you use it)
 *  • Analyse = mastery tempered by repeated successful practice (deep mastery)
 * All 0..1. A faithful Bloom's-tagged version (per-question levels) is deferred.
 */
export function masteryDepth(m: { mastery?: number; retention?: number; attempts?: number } = {}): {
  recall: number;
  apply: number;
  analyse: number;
} {
  const fin = (n: number | undefined): number => (typeof n === 'number' && Number.isFinite(n) ? n : 0);
  const mastery = clamp01(fin(m.mastery));
  const retention = clamp01(fin(m.retention));
  const attempts = Math.max(0, fin(m.attempts));
  return { recall: retention, apply: mastery, analyse: clamp01(mastery * Math.min(1, attempts / 4)) };
}

// ── Score volatility / consistency (F3) ───────────────────────────────────────

export type Consistency = 'consistent' | 'variable' | 'erratic' | 'unknown';

export interface VolatilitySummary {
  stdDev: number; // population standard deviation of the (clamped) scores
  consistency: Consistency;
  label: string;
}

/**
 * Classify how consistent a score series is (F3). Scores are 0..1; thresholds on
 * the standard deviation map to a human label. <2 samples → 'unknown'.
 */
export function scoreVolatility(scores: number[]): VolatilitySummary {
  const xs = (scores ?? []).filter((s) => Number.isFinite(s)).map(clamp01);
  if (xs.length < 2) return { stdDev: 0, consistency: 'unknown', label: 'Not enough data' };
  const m = mean(xs);
  const sd = Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
  const consistency: Consistency = sd <= 0.12 ? 'consistent' : sd <= 0.22 ? 'variable' : 'erratic';
  const label = consistency === 'consistent' ? 'Consistent' : consistency === 'variable' ? 'Variable' : 'Up & down';
  return { stdDev: sd, consistency, label };
}

// ── Cohort learning summary (admin view of F1/F2/F19/F13/F15) ─────────────────

export interface CohortLearningRow {
  recentAvg?: number | null;
  trendDir?: 'improving' | 'declining' | 'flat' | null;
  streakCurrent?: number;
  reviewDue?: number;
  reviewOverdue?: number;
  consistency?: Consistency;
  growthPct?: number | null;
}

export interface CohortLearning {
  count: number;
  avgRecent: number | null; // F1 — mean of per-student recent averages (0..1)
  improving: number; // F2
  declining: number;
  flat: number;
  avgStreak: number; // F19
  activeStreaks: number; // students with a live streak
  totalDue: number; // F13
  totalOverdue: number; // F15
  consistent: number; // F3
  variable: number;
  erratic: number;
  avgGrowth: number | null; // F31 — mean growth % across students who have a baseline
}

/**
 * Aggregate per-student learning signals (already computed in the cohort snapshot)
 * into class/cohort totals for the admin view. Pure; tolerant of missing fields.
 */
export function summariseCohortLearning(students: CohortLearningRow[]): CohortLearning {
  const rows = students ?? [];
  let recentSum = 0;
  let recentN = 0;
  let improving = 0;
  let declining = 0;
  let flat = 0;
  let streakSum = 0;
  let active = 0;
  let due = 0;
  let overdue = 0;
  let consistent = 0;
  let variable = 0;
  let erratic = 0;
  let growthSum = 0;
  let growthN = 0;
  for (const s of rows) {
    if (typeof s?.recentAvg === 'number' && Number.isFinite(s.recentAvg)) {
      recentSum += s.recentAvg;
      recentN += 1;
    }
    if (s?.trendDir === 'improving') improving += 1;
    else if (s?.trendDir === 'declining') declining += 1;
    else if (s?.trendDir === 'flat') flat += 1;
    const sc = typeof s?.streakCurrent === 'number' ? s.streakCurrent : 0;
    streakSum += sc;
    if (sc > 0) active += 1;
    due += typeof s?.reviewDue === 'number' ? s.reviewDue : 0;
    overdue += typeof s?.reviewOverdue === 'number' ? s.reviewOverdue : 0;
    if (s?.consistency === 'consistent') consistent += 1;
    else if (s?.consistency === 'variable') variable += 1;
    else if (s?.consistency === 'erratic') erratic += 1;
    if (typeof s?.growthPct === 'number' && Number.isFinite(s.growthPct)) {
      growthSum += s.growthPct;
      growthN += 1;
    }
  }
  return {
    count: rows.length,
    avgRecent: recentN ? recentSum / recentN : null,
    improving,
    declining,
    flat,
    avgStreak: rows.length ? streakSum / rows.length : 0,
    activeStreaks: active,
    totalDue: due,
    totalOverdue: overdue,
    consistent,
    variable,
    erratic,
    avgGrowth: growthN ? growthSum / growthN : null,
  };
}

// ── Study streak (F19) ────────────────────────────────────────────────────────

export interface StreakInfo {
  current: number; // consecutive days up to today (or yesterday if not yet today)
  longest: number;
  studiedToday: boolean;
}

const dayKey = (d: Date): string => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
const shiftKey = (key: string, deltaDays: number): string =>
  dayKey(new Date(new Date(`${key}T00:00:00.000Z`).getTime() + deltaDays * 86_400_000));

/**
 * Compute a study streak from a set of activity timestamps (ISO strings). Days
 * are bucketed in UTC so the result is deterministic and testable. The current
 * streak counts back from today, or from yesterday if there is no activity today
 * yet (so a streak isn't "lost" mid-day).
 */
export function streakFromDates(isoDates: string[], now: Date = new Date()): StreakInfo {
  const days = new Set<string>();
  // Defensive: never throw on null/undefined/non-array input (would blank the
  // Brain tab if a caller ever passes a non-iterable).
  for (const iso of Array.isArray(isoDates) ? isoDates : []) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) days.add(dayKey(d));
  }
  if (days.size === 0) return { current: 0, longest: 0, studiedToday: false };

  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (shiftKey(sorted[i - 1], 1) === sorted[i]) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const todayKey = dayKey(now);
  const studiedToday = days.has(todayKey);
  let cursor: string | null = studiedToday
    ? todayKey
    : days.has(shiftKey(todayKey, -1))
      ? shiftKey(todayKey, -1)
      : null;
  let current = 0;
  while (cursor && days.has(cursor)) {
    current += 1;
    cursor = shiftKey(cursor, -1);
  }

  return { current, longest: Math.max(longest, current), studiedToday };
}
