/**
 * Shared wire + domain types for the ML serving integration.
 * Mirrors the deployed API's OpenAPI schema (SANKALP-AEI ML Serving API v1.0.0).
 */

import type { FeatureVector } from './feature-keys';

// ── Wire: request/response shapes (exactly as the API defines them) ──────────

export interface PredictRequest {
  learner_id: string;
  /** 40-feature snake_case dict. Missing keys default to 0.0 server-side. */
  features: FeatureVector;
}

export type AttentionRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface PredictResponse {
  learner_id: string;
  mastery_probability: number; // 0..1
  forgetting_days: number; // >= 0
  attention_risk: AttentionRisk;
  dropout_probability: number; // 0..1
  confidence_lower: number; // 0..1  (Bayesian 95% CI lower)
  confidence_upper: number; // 0..1  (Bayesian 95% CI upper)
  models_loaded: boolean; // true = ensemble, false = server rule-based
  prediction_latency_ms: number; // server-side inference time
}

export interface HealthResponse {
  status: string;
  models_loaded: boolean;
  model_dir: string;
  ensemble_weights: Record<string, number>;
  timestamp: string;
}

export interface FeedbackRequest {
  learner_id: string;
  actual_outcome: string;
  prediction_id?: string | null;
  predicted_outcome?: string | null;
  model_version?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FeedbackResponse {
  status: string;
  feedback_id: string;
  stored_at: string;
  store_path: string;
}

// ── Domain: enriched prediction returned to the app ─────────────────────────

/** Where a prediction came from — drives the "estimating…" / confidence UI. */
export type PredictionSource =
  | 'ensemble' // server ensemble (.pkl loaded)
  | 'server-rules' // server responded but its own rule-based fallback
  | 'client-fallback'; // API unreachable → our local heuristic

/** Module 106 — adaptive decision categories (patent). */
export type DecisionCategory =
  | 'urgent_review'
  | 'spaced_revision'
  | 'challenge_next'
  | 'continuation';

/** ADK mode mirrors aei-brainmap intelligence-types.ts for UI parity. */
export type ADKMode =
  | 'SHORT_REVISION_MODE'
  | 'DEEP_TEACHING'
  | 'ASSESSMENT_MODE'
  | 'PROGRESS_MODE'
  | 'INTERVENTION_REQUIRED';

export type RevisionUrgency = 'NONE' | 'SCHEDULED' | 'URGENT';

export interface Decision {
  category: DecisionCategory;
  adkMode: ADKMode;
  revisionUrgency: RevisionUrgency;
  attentionRisk: AttentionRisk;
  /** Human-readable explanations (patent advantage #2 — explainability). */
  reasoning: string[];
}

/** The full result the app consumes: prediction + provenance + decision. */
export interface LearnerPrediction {
  learnerId: string;
  masteryProbability: number;
  dropoutProbability: number;
  forgettingDays: number;
  attentionRisk: AttentionRisk;
  confidence: { lower: number; upper: number; width: number };
  /** ci width is wide => show "estimating…" rather than a hard number. */
  lowConfidence: boolean;
  source: PredictionSource;
  latencyMs: number; // round-trip as measured client-side
  decision: Decision;
  /** Canonical EWS tier derived from ensemble (Consolidation 1.2). */
  canonicalRisk?: import('./risk-tier').CanonicalRisk;
  generatedAt: string; // ISO
}

export interface MlClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
  /** Trip the circuit after this many consecutive failures. */
  failureThreshold?: number;
  /** Keep the circuit open this long before a half-open probe. */
  cooldownMs?: number;
  retries?: number;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** ci width above this marks the estimate low-confidence. */
  lowConfidenceWidth?: number;
}
