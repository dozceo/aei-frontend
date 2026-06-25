/**
 * Module 104 — Feature Engineering Engine (client side).
 *
 * Assembles the 40-feature snake_case vector the ensemble expects, from data the
 * dashboard already has: the brain-map (mastery / retention / CI / trajectory per
 * topic) and lightweight engagement/behavioral signals.
 *
 * Design: PURE function. It takes plain inputs and returns a FeatureVector — no
 * Firebase, no I/O. That keeps it unit-testable and avoids the browser-unsafe
 * firebase-admin shapes the brain-map types file warns about. Callers gather the
 * inputs (from useSelfBrainMap / engagement-tracker / participant doc) and pass
 * them in.
 *
 * Every output key is finite; ratios guard against divide-by-zero. Unknown
 * signals default to 0 (the same thing the server would do, but explicit).
 */

import { normaliseFeatureVector, ALL_FEATURES, type FeatureVector } from './feature-keys';
import type { BrainMapData, BrainMapNode } from '../brainmap/types';

/** Bump when feature vector layout changes — must match server FEATURE_SCHEMA_VERSION. */
export const FEATURE_SCHEMA_VERSION = 1;

/** Behavioral / temporal signals not derivable from the brain-map alone. */
export interface EngagementSignals {
  daysSinceLastInteraction?: number;
  sessionFrequency7d?: number;
  sessionFrequency30d?: number;
  avgSessionDurationMin?: number;
  studyTimePerDayMin?: number;
  peakStudyHour?: number; // 0..23
  streakDays?: number;
  interSessionIntervalAvgH?: number;

  chatFrequency?: number; // chatbot queries / session
  quizRetryRate?: number; // 0..1
  hintUsageRate?: number; // 0..1
  completionRate?: number; // 0..1
  dropoffRate?: number; // 0..1
  revisionRate?: number; // 0..1
  selfAssessmentAccuracy?: number; // 0..1
  peerInteractionCount?: number;
  resourceAccessRate?: number;
  errorCorrectionRate?: number; // 0..1
  feedbackResponseRate?: number; // 0..1
  socialStudyBehavior?: number;
}

/** Cognitive-load signals captured per session (Category D instrumentation). */
export interface CognitiveSignals {
  attentionSpanEstimationMin?: number;
  taskSwitchingRate?: number;
  multitaskingIndicator?: number;
  cognitiveOverloadIndex?: number; // 0..1
  focusTimeRatio?: number; // 0..1
  distractionEventRate?: number;
  responseLatencySec?: number;
  errorRecoverySpeed?: number;
  persistenceScore?: number; // 0..1
  stressProxy?: number; // 0..1
}

export interface FeatureExtractionInput {
  brainMap?: BrainMapData | null;
  /** Cohort/class percentile 0..1 (from the Wave-4 aggregation job), if known. */
  masteryPercentile?: number;
  engagement?: EngagementSignals;
  cognitive?: CognitiveSignals;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const num = (n: number | undefined, fallback = 0): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : fallback;

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return mean(xs.map((x) => (x - m) ** 2));
}

/** Pull the per-topic mastery (0..1) from a brain-map node. */
function nodeMastery(n: BrainMapNode): number {
  // masteryLevel is the primary 0..1 signal; metadata.masteryPercent is 0..100.
  if (Number.isFinite(n.masteryLevel)) return clamp01(n.masteryLevel);
  return clamp01(num(n.metadata?.masteryPercent) / 100);
}

/**
 * Compute the Group-A (mastery-derived) features from the brain-map nodes.
 * Returns the 10 mastery features as a partial vector.
 */
function masteryFeatures(bm: BrainMapData | null | undefined, percentile?: number): Partial<FeatureVector> {
  const nodes = bm?.nodes ?? [];
  const masteries = nodes.map(nodeMastery);
  const stats = bm?.stats;

  // mastery trend: average per-node trajectory slope, normalised to ~[-0.5,0.5].
  const slopes = nodes.map((n) => num(n.metadata?.trajectorySlope));
  const trendRaw = mean(slopes);
  const masteryTrend = Math.max(-0.5, Math.min(0.5, trendRaw));

  // CI width: average node uncertainty (0..1) if present.
  const ciWidths = nodes.map((n) => num(n.uncertainty)).filter((x) => x > 0);
  const ciWidth = ciWidths.length ? mean(ciWidths) : 0;

  // recent scores across the map (sparkline arrays), flattened.
  const recentScores = nodes.flatMap((n) => (n.metadata?.recentScores ?? []).map((s) => clamp01(s)));
  const recentAvg = mean(recentScores);

  // score improvement: last - first of the flattened recent series (rough proxy).
  const improvement =
    recentScores.length >= 2 ? clamp01(0.5 + (recentScores[recentScores.length - 1] - recentScores[0])) : 0.5;

  const strugglingCount = num(stats?.strugglingTopics, nodes.filter((n) => nodeMastery(n) < 0.4).length);

  return {
    concept_mastery_mean: clamp01(num(stats?.averageMastery, mean(masteries))),
    mastery_variance: variance(masteries),
    mastery_trend: masteryTrend,
    ci_width: clamp01(ciWidth),
    topic_count: num(stats?.totalTopics, nodes.length),
    struggling_topic_count: strugglingCount,
    mastery_percentile: clamp01(num(percentile, 0.5)),
    recent_score_avg: recentAvg,
    score_improvement: improvement,
    // velocity ~ trend scaled to a per-window rate (kept in a small positive-ish band).
    mastery_velocity: Math.max(-1, Math.min(1, trendRaw * 4)),
  };
}

function temporalFeatures(e: EngagementSignals = {}): Partial<FeatureVector> {
  return {
    days_since_last_interaction: Math.max(0, num(e.daysSinceLastInteraction)),
    session_frequency_7d: Math.max(0, num(e.sessionFrequency7d)),
    session_frequency_30d: Math.max(0, num(e.sessionFrequency30d)),
    avg_session_duration: Math.max(0, num(e.avgSessionDurationMin)),
    study_time_per_day: Math.max(0, num(e.studyTimePerDayMin)),
    peak_study_hour: Math.max(0, Math.min(23, Math.round(num(e.peakStudyHour)))),
    streak_days: Math.max(0, Math.round(num(e.streakDays))),
    inter_session_interval_avg: Math.max(0, num(e.interSessionIntervalAvgH)),
  };
}

function behavioralFeatures(e: EngagementSignals = {}): Partial<FeatureVector> {
  return {
    chat_frequency: Math.max(0, num(e.chatFrequency)),
    quiz_retry_rate: clamp01(num(e.quizRetryRate)),
    hint_usage_rate: clamp01(num(e.hintUsageRate)),
    completion_rate: clamp01(num(e.completionRate, 1)),
    dropoff_rate: clamp01(num(e.dropoffRate)),
    revision_rate: clamp01(num(e.revisionRate)),
    self_assessment_accuracy: clamp01(num(e.selfAssessmentAccuracy)),
    peer_interaction_count: Math.max(0, num(e.peerInteractionCount)),
    resource_access_rate: Math.max(0, num(e.resourceAccessRate)),
    error_correction_rate: clamp01(num(e.errorCorrectionRate)),
    feedback_response_rate: clamp01(num(e.feedbackResponseRate)),
    social_study_behavior: Math.max(0, num(e.socialStudyBehavior)),
  };
}

function cognitiveFeatures(c: CognitiveSignals = {}): Partial<FeatureVector> {
  return {
    attention_span_estimation: Math.max(0, num(c.attentionSpanEstimationMin)),
    task_switching_rate: Math.max(0, num(c.taskSwitchingRate)),
    multitasking_indicator: Math.max(0, num(c.multitaskingIndicator)),
    cognitive_overload_index: clamp01(num(c.cognitiveOverloadIndex)),
    focus_time_ratio: clamp01(num(c.focusTimeRatio, 1)),
    distraction_event_rate: Math.max(0, num(c.distractionEventRate)),
    response_latency: Math.max(0, num(c.responseLatencySec)),
    error_recovery_speed: Math.max(0, num(c.errorRecoverySpeed)),
    persistence_score: clamp01(num(c.persistenceScore)),
    stress_proxy: clamp01(num(c.stressProxy)),
  };
}

/**
 * Build the full, normalised 40-feature vector. Always returns all 40 keys with
 * finite values, so it is safe to POST directly to /api/predict.
 */
export function extractFeatureVector(input: FeatureExtractionInput): FeatureVector {
  return normaliseFeatureVector({
    ...masteryFeatures(input.brainMap, input.masteryPercentile),
    ...temporalFeatures(input.engagement),
    ...behavioralFeatures(input.engagement),
    ...cognitiveFeatures(input.cognitive),
  });
}

/** Stable hash of the 40-vector for ML prediction cache keys. */
export function featureVectorHash(features: FeatureVector): string {
  const s = ALL_FEATURES.map((k) => features[k]).join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
