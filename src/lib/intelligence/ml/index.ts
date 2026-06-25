/**
 * ML integration spine — public barrel + orchestrator.
 *
 * Wires Module 104 (feature extraction) → 105 (ensemble client, with fallback) →
 * 106 (decision engine) into one call the UI can use:
 *
 *     const pred = await predictForLearner(learnerId, { brainMap, engagement });
 *     pred.masteryProbability, pred.decision.category, pred.decision.reasoning ...
 *
 * Everything downstream of `extractFeatureVector` is pure; only the client does
 * I/O, and it never throws (falls back locally). So `predictForLearner` is safe
 * to call from any component/effect without a try/catch.
 */

import { MlServingClient, mlClient } from './ml-client';
import { extractFeatureVector, featureVectorHash, FEATURE_SCHEMA_VERSION, type FeatureExtractionInput } from './feature-extractor';
import { decide, type DecisionThresholds } from './decision-engine';
import { ensembleToEwsTier } from './risk-tier';
import type { LearnerPrediction, PredictResponse, PredictionSource } from './types';
import { cached } from '../cache/data-cache';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface PredictForLearnerOptions extends FeatureExtractionInput {
  timeToAssessmentDays?: number;
  thresholds?: DecisionThresholds;
  /** Override the default singleton (e.g. in tests). */
  client?: MlServingClient;
  /** 'teacher' uses a longer cache TTL (45m). */
  audience?: 'student' | 'teacher';
}

function enrich(
  learnerId: string,
  response: PredictResponse,
  source: PredictionSource,
  client: MlServingClient,
  t0: number,
  opts: PredictForLearnerOptions,
): LearnerPrediction {
  const width = Math.max(0, response.confidence_upper - response.confidence_lower);
  const canonicalRisk = ensembleToEwsTier(response);
  return {
    learnerId,
    masteryProbability: response.mastery_probability,
    dropoutProbability: response.dropout_probability,
    forgettingDays: response.forgetting_days,
    attentionRisk: response.attention_risk,
    confidence: { lower: response.confidence_lower, upper: response.confidence_upper, width },
    lowConfidence: width >= client.lowConfidenceThreshold,
    source,
    latencyMs: Date.now() - t0,
    decision: decide(response, {
      thresholds: opts.thresholds,
      timeToAssessmentDays: opts.timeToAssessmentDays,
    }),
    canonicalRisk,
    generatedAt: new Date().toISOString(),
  };
}

/** One learner → full enriched prediction. Never throws. */
export async function predictForLearner(
  learnerId: string,
  opts: PredictForLearnerOptions = {},
): Promise<LearnerPrediction> {
  const features = extractFeatureVector(opts);
  const featureHash = featureVectorHash(features);
  const ttlMs = opts.audience === 'teacher' ? 45 * 60_000 : 15 * 60_000;
  const cacheKey = `ml:pred:${learnerId}:${featureHash}`;

  return cached(cacheKey, async () => {
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'student_predictions', learnerId));
        if (snap.exists()) {
          const d = snap.data();
          const exp = d.expiresAt?.toMillis?.() ?? d.expiresAt ?? 0;
          if (d.featureSchemaVersion != null && d.featureSchemaVersion !== FEATURE_SCHEMA_VERSION) {
            console.warn('[ml] student_predictions schema mismatch — recomputing', {
              learnerId,
              doc: d.featureSchemaVersion,
              client: FEATURE_SCHEMA_VERSION,
            });
          } else if (d.featureHash === featureHash && exp > Date.now() && d.prediction) {
            return d.prediction as LearnerPrediction;
          }
        }
      }
    } catch { /* memory-only fallback if rules/read fail */ }

    const client = opts.client ?? mlClient;
    const t0 = Date.now();
    const { response, source } = await client.predict({ learner_id: learnerId, features });
    return enrich(learnerId, response, source, client, t0, opts);
  }, { ttlMs, scope: 'memory', staleWhileRevalidate: true });
}

/** Many learners → enriched predictions, for the teacher heatmap (Module 107). */
export async function predictClass(
  learners: Array<{ learnerId: string; input: FeatureExtractionInput }>,
  opts: Omit<PredictForLearnerOptions, keyof FeatureExtractionInput> = {},
): Promise<LearnerPrediction[]> {
  return Promise.all(
    learners.map((l) => predictForLearner(l.learnerId, { ...l.input, ...opts, audience: 'teacher' })),
  );
}

export { MlServingClient, mlClient, ruleBasedPredict } from './ml-client';
export { extractFeatureVector, featureVectorHash } from './feature-extractor';
export { decide, categoryLabel, DEFAULT_THRESHOLDS, computeTopDrivers } from './decision-engine';
export { ensembleToEwsTier, tierLabel } from './risk-tier';
export type { CanonicalRisk, EwsTier } from './risk-tier';
export { FEATURE_SCHEMA_VERSION } from './feature-extractor';
export {
  ALL_FEATURES,
  MASTERY_FEATURES,
  TEMPORAL_FEATURES,
  BEHAVIORAL_FEATURES,
  COGNITIVE_FEATURES,
  emptyFeatureVector,
  normaliseFeatureVector,
} from './feature-keys';
export type { FeatureKey, FeatureVector } from './feature-keys';
export type {
  LearnerPrediction,
  Decision,
  DecisionCategory,
  PredictResponse,
  PredictRequest,
  AttentionRisk,
  PredictionSource,
} from './types';
export type { EngagementSignals, CognitiveSignals, FeatureExtractionInput } from './feature-extractor';
export {
  predictionToPlannerHints,
  decisionToActionStyle,
  studentTaskReason,
  classifyRecommendationOutcome,
  hintsToPlanParams,
  DEFAULT_HINTS,
} from './planner-hints';
export type { PlannerHints, ActionStyle, ActionType } from './planner-hints';
