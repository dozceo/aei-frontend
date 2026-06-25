/**
 * Module 104 — Feature contract (single source of truth).
 *
 * The deployed ensemble (https://web-production-19e90.up.railway.app) consumes a
 * 40-feature dict whose keys MUST match `ALL_FEATURES` in the server's
 * `ml/pipeline/feature_extraction.py` (`StudentFeatureVector`). Any key we send
 * that the server does not recognise is ignored; any key the server expects that
 * we omit defaults to 0.0 — silently degrading the prediction. So these names are
 * a hard contract: change them only to track the server, never casually.
 *
 * Patent IN202641045082 A1, Module 104 / Feature Enumeration (40 features, 4 groups).
 */

export const MASTERY_FEATURES = [
  'concept_mastery_mean',
  'mastery_variance',
  'mastery_trend',
  'ci_width',
  'topic_count',
  'struggling_topic_count',
  'mastery_percentile',
  'recent_score_avg',
  'score_improvement',
  'mastery_velocity',
] as const;

export const TEMPORAL_FEATURES = [
  'days_since_last_interaction',
  'session_frequency_7d',
  'session_frequency_30d',
  'avg_session_duration',
  'study_time_per_day',
  'peak_study_hour',
  'streak_days',
  'inter_session_interval_avg',
] as const;

export const BEHAVIORAL_FEATURES = [
  'chat_frequency',
  'quiz_retry_rate',
  'hint_usage_rate',
  'completion_rate',
  'dropoff_rate',
  'revision_rate',
  'self_assessment_accuracy',
  'peer_interaction_count',
  'resource_access_rate',
  'error_correction_rate',
  'feedback_response_rate',
  'social_study_behavior',
] as const;

export const COGNITIVE_FEATURES = [
  'attention_span_estimation',
  'task_switching_rate',
  'multitasking_indicator',
  'cognitive_overload_index',
  'focus_time_ratio',
  'distraction_event_rate',
  'response_latency',
  'error_recovery_speed',
  'persistence_score',
  'stress_proxy',
] as const;

/** All 40 feature keys, in canonical order. */
export const ALL_FEATURES = [
  ...MASTERY_FEATURES,
  ...TEMPORAL_FEATURES,
  ...BEHAVIORAL_FEATURES,
  ...COGNITIVE_FEATURES,
] as const;

export type FeatureKey = (typeof ALL_FEATURES)[number];

/** A complete 40-feature vector. Every key present, numeric. */
export type FeatureVector = Record<FeatureKey, number>;

/** Compile-time guarantee that the contract is exactly 40 features. */
type _AssertForty = FeatureVector extends Record<FeatureKey, number>
  ? typeof ALL_FEATURES['length'] extends 40
    ? true
    : ['ERROR: ALL_FEATURES must be exactly 40 keys']
  : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void (true as _AssertForty);

/**
 * A zero-filled vector. Use as the base, then overwrite known features — this
 * guarantees we always send all 40 keys (no accidental silent 0.0 defaults on
 * the server we did not intend).
 */
export function emptyFeatureVector(): FeatureVector {
  const v = {} as FeatureVector;
  for (const k of ALL_FEATURES) v[k] = 0;
  return v;
}

/**
 * Coerce an arbitrary partial map into a full, finite FeatureVector. Non-finite
 * values (NaN / Infinity — a common bug in ratio features when denominators are
 * zero) are clamped to 0 so the model never receives garbage.
 */
export function normaliseFeatureVector(partial: Partial<Record<FeatureKey, number>>): FeatureVector {
  const v = emptyFeatureVector();
  for (const k of ALL_FEATURES) {
    const raw = partial[k];
    v[k] = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  }
  return v;
}
