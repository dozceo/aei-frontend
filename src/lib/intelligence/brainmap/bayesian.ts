/**
 * Brain Map™ Core Logic — VENDORED verbatim from aei-brainmap/engine/bayesian.ts
 * (the only change from the original is the import path: "../types" → "./types").
 *
 * Enforces the Brain Map™ Architectural Laws:
 * 1. Never use point estimates for mastery.
 * 2. Always compute and pass along the confidence interval width (CI).
 * 3. Detect early sequence struggle.
 */

import type { TopicMastery, BayesianTopicMastery } from "./types";

/**
 * Computes the Bayesian posterior for a topic's mastery using a Beta(α, β) distribution.
 */
export function updateBayesianMastery(
  current: TopicMastery,
  performanceScore: number, // 0.0 to 1.0
  timestamp: string,
  context?: { latencyFactor?: number; evidenceWeight?: number }
): BayesianTopicMastery {
  // 1. Extract prior Beta parameters. Default to the JEFFREYS prior α=β=0.5
  //    (not the uniform 1,1): with a weak prior a couple of clean correct
  //    answers can legitimately reach high mastery, instead of being dragged
  //    toward 0.5 forever — which made every node look perpetually "learning".
  const priorAlpha = current.posteriorAlpha ?? 0.5;
  const priorBeta = current.posteriorBeta ?? 0.5;

  // 2. Bayesian Update (Continuous successes/failures based on score)
  let successes = performanceScore;
  let failures = 1.0 - performanceScore;

  // Discount correct-leaning evidence when latencyFactor > 0
  if (context?.latencyFactor && successes > 0.5) {
    const penalty = successes * (context.latencyFactor * 0.5); // Up to 50% discount
    successes -= penalty;
    failures += penalty;
  }

  // Evidence weight scales how much this single observation counts. A confident
  // binary MCQ ≈ 1 full observation; an ungraded / integrity-flagged answer
  // contributes a fraction so it can't inflate (or unfairly tank) the brain.
  const evidenceWeight = clamp01to3(context?.evidenceWeight ?? 1.0);
  successes *= evidenceWeight;
  failures *= evidenceWeight;

  const posteriorAlpha = priorAlpha + successes;
  const posteriorBeta = priorBeta + failures;

  // 3. Compute Distribution Statistics
  const total = posteriorAlpha + posteriorBeta;
  const mean = posteriorAlpha / total;
  const variance = (posteriorAlpha * posteriorBeta) / (Math.pow(total, 2) * (total + 1));
  const stdDev = Math.sqrt(variance);

  // 4. Compute 95% Credible Interval (Normal Approximation for Beta)
  const zScore = 1.96;
  const ciLower = Math.max(0, mean - zScore * stdDev);
  const ciUpper = Math.min(1, mean + zScore * stdDev);
  const uncertainty = ciUpper - ciLower;

  // 5. Update Trajectory & Recent Scores
  const recentScores = [...(current.recentScores ?? []), performanceScore].slice(-5); // Keep last 5
  const trajectorySlope = computeLinearSlope(recentScores);

  // 6. Struggle Detection
  const struggleFlags = [...(current.struggleFlags ?? [])];

  // Flag: Declining mastery chain
  if (trajectorySlope < -0.1 && !struggleFlags.includes("declining_trajectory")) {
    struggleFlags.push("declining_trajectory");
  } else if (trajectorySlope >= 0) {
    const idx = struggleFlags.indexOf("declining_trajectory");
    if (idx > -1) struggleFlags.splice(idx, 1);
  }

  // Flag: Widening uncertainty (if uncertainty > 0.4, it's highly uncertain)
  if (uncertainty > 0.4 && !struggleFlags.includes("high_uncertainty")) {
    struggleFlags.push("high_uncertainty");
  } else if (uncertainty <= 0.4) {
    const idx = struggleFlags.indexOf("high_uncertainty");
    if (idx > -1) struggleFlags.splice(idx, 1);
  }

  // Flag: Repeated failure
  const recentFailures = recentScores.filter((s) => s < 0.5).length;
  if (recentFailures >= 3 && !struggleFlags.includes("repeated_failure")) {
    struggleFlags.push("repeated_failure");
  } else if (recentFailures < 3) {
    const idx = struggleFlags.indexOf("repeated_failure");
    if (idx > -1) struggleFlags.splice(idx, 1);
  }

  // Memory durability grows with each rep (the spacing effect): more times a
  // concept is exercised, the more durable the trace. Engagement (resource
  // reading) adds to this later; decayMastery() erodes it over elapsed time.
  const retentionStrength = Math.min(
    1,
    (current.retentionStrength ?? 0) + 0.12 * evidenceWeight,
  );

  return {
    topicId: current.topicId,
    mastery: mean,
    retentionStrength,
    lastAssessedAt: timestamp,
    attempts: current.attempts + 1,
    posteriorAlpha,
    posteriorBeta,
    posteriorVariance: variance,
    ciLower,
    ciUpper,
    uncertainty,
    trajectorySlope,
    struggleFlags,
    forgettingStrength: current.forgettingStrength ?? 1.0,
    recentScores,
  };
}

/** Clamp an evidence weight into a sane [0, 3] band. */
function clamp01to3(w: number): number {
  if (!Number.isFinite(w) || w < 0) return 0;
  return Math.min(3, w);
}

/* ─── Forgetting curve ───────────────────────────────────────────────────── */

const REVISION_RESIDUAL = 0.45; // mastery you keep even long after last touch
const BASE_HALF_LIFE_DAYS = 12; // half-life of a single-rep memory
const DUE_THRESHOLD = 0.7; // recencyFactor below this → "revise me"

/**
 * Apply time-based forgetting to a mastery state, *relative to `asOfISO`*.
 *
 * The raw Bayesian `mastery` is left intact (it's the all-time estimate). We
 * derive how the concept reads TODAY:
 *   recencyFactor = RESIDUAL + (1-RESIDUAL)·e^(−days / halfLife)   ∈ [RESIDUAL, 1]
 *   effectiveMastery = mastery · recencyFactor
 * halfLife grows with attempts (spacing) and retentionStrength (engagement), so
 * well-practised / well-read concepts cool slowly. At days≈0 the factor is 1, so
 * a freshly-assessed node reads at full mastery — it only cools as time passes.
 */
export function decayMastery(
  state: TopicMastery,
  asOfISO: string = new Date().toISOString(),
): TopicMastery {
  const mastery = state.mastery ?? 0;
  const last = Date.parse(state.lastAssessedAt || "");
  const asOf = Date.parse(asOfISO) || Date.now();
  if (Number.isNaN(last)) {
    // Never assessed in time → no decay signal; pass through unchanged.
    return { ...state, effectiveMastery: mastery, effectiveRetention: state.retentionStrength ?? 0 };
  }

  const days = Math.max(0, (asOf - last) / 86_400_000);
  const attempts = Math.max(1, state.attempts ?? 1);
  const retention = state.retentionStrength ?? 0;
  const halfLife = BASE_HALF_LIFE_DAYS * (1 + 0.5 * (attempts - 1)) * (1 + retention);

  const recall = Math.exp(-days / halfLife); // 1 → 0 as time passes
  const recencyFactor = REVISION_RESIDUAL + (1 - REVISION_RESIDUAL) * recall;
  const effectiveMastery = mastery * recencyFactor;
  const effectiveRetention = retention * recall;

  return {
    ...state,
    effectiveMastery,
    effectiveRetention,
    daysSinceLastRevision: Math.round(days),
    // Only meaningful nodes (some mastery, some history) deserve a revise pulse.
    dueForRevision: mastery > 0.3 && recencyFactor < DUE_THRESHOLD,
  };
}

/**
 * Computes the slope of a simple linear regression over an array of values.
 */
function computeLinearSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    const y = values[i] as number;
    sumY += y;
    sumXY += i * y;
    sumXX += i * i;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}
