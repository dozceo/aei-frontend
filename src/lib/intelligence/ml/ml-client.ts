/**
 * Module 105 client — talks to the deployed SANKALP-AEI ML Serving API.
 *
 * Production concerns handled here, not by callers:
 *   - timeout (AbortController)        — never hang the UI past `timeoutMs`
 *   - circuit breaker                  — stop hammering a down API; fail fast
 *   - bounded retry w/ backoff         — survive transient 5xx / network blips
 *   - structured JSON logs             — DEBUG/INFO/WARN/ERROR, one line each
 *   - client-side rule-based fallback  — degrade gracefully when the API is out
 *
 * The fallback mirrors the server's own rule-based path so the app keeps working
 * (with `source: 'client-fallback'`) and the user sees a slightly-less-precise
 * number rather than an error.
 */

import { ALL_FEATURES, type FeatureVector } from './feature-keys';
import type {
  PredictRequest,
  PredictResponse,
  HealthResponse,
  FeedbackRequest,
  FeedbackResponse,
  PredictionSource,
  MlClientOptions,
  AttentionRisk,
} from './types';

const DEFAULT_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ML_SERVICE_URL) ||
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_ML_API_URL) ||
  'https://ml-training-production-a139.up.railway.app';

type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function log(level: Level, event: string, data: Record<string, unknown> = {}): void {
  // Single-line JSON — greppable, ingestible. No PII: only learner ids + metrics.
  try {
    // eslint-disable-next-line no-console
    console[level === 'DEBUG' ? 'debug' : level === 'INFO' ? 'info' : level === 'WARN' ? 'warn' : 'error'](
      JSON.stringify({ ts: new Date().toISOString(), level, scope: 'ml-client', event, ...data }),
    );
  } catch {
    /* logging must never throw */
  }
}

interface CircuitState {
  failures: number;
  openedAt: number | null;
}

export class MlServingClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly retries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly lowConfidenceWidth: number;
  private circuit: CircuitState = { failures: 0, openedAt: null };

  constructor(opts: MlClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? 4000;
    this.failureThreshold = opts.failureThreshold ?? 4;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
    this.retries = opts.retries ?? 1;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch?.bind(globalThis);
    this.lowConfidenceWidth = opts.lowConfidenceWidth ?? 0.35;
    if (!this.fetchImpl) {
      throw new Error('MlServingClient: no fetch implementation available (pass opts.fetchImpl).');
    }
  }

  get lowConfidenceThreshold(): number {
    return this.lowConfidenceWidth;
  }

  // ── Circuit breaker ───────────────────────────────────────────────────────

  /** True while the breaker is open and still cooling down. */
  private circuitOpen(): boolean {
    if (this.circuit.openedAt == null) return false;
    if (Date.now() - this.circuit.openedAt >= this.cooldownMs) {
      // half-open: allow one probe through
      log('INFO', 'circuit_half_open', {});
      this.circuit.openedAt = null;
      this.circuit.failures = 0;
      return false;
    }
    return true;
  }

  private recordSuccess(): void {
    if (this.circuit.failures > 0 || this.circuit.openedAt != null) {
      log('INFO', 'circuit_reset', {});
    }
    this.circuit = { failures: 0, openedAt: null };
  }

  private recordFailure(): void {
    this.circuit.failures += 1;
    if (this.circuit.failures >= this.failureThreshold && this.circuit.openedAt == null) {
      this.circuit.openedAt = Date.now();
      log('WARN', 'circuit_open', { failures: this.circuit.failures, cooldownMs: this.cooldownMs });
    }
  }

  // ── Low-level fetch with timeout + bounded retry ────────────────────────────

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const t0 = Date.now();
      try {
        const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
          ...init,
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
        });
        clearTimeout(timer);
        if (!res.ok) {
          // 4xx (e.g. 422 validation) is our bug, not a transient fault: do not retry.
          if (res.status >= 400 && res.status < 500) {
            const body = await res.text().catch(() => '');
            throw new HttpError(res.status, `${res.status} ${res.statusText}: ${body.slice(0, 300)}`, false);
          }
          throw new HttpError(res.status, `${res.status} ${res.statusText}`, true);
        }
        log('DEBUG', 'request_ok', { path, ms: Date.now() - t0, attempt });
        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        const retriable = !(err instanceof HttpError) || err.retriable;
        log('WARN', 'request_failed', {
          path,
          attempt,
          retriable,
          ms: Date.now() - t0,
          error: err instanceof Error ? err.message : String(err),
        });
        if (!retriable || attempt === this.retries) break;
        await sleep(150 * 2 ** attempt); // 150ms, 300ms, ...
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('ml request failed');
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health', { method: 'GET' });
  }

  /**
   * Predict for one learner. Never throws: on any failure (circuit open, timeout,
   * 5xx, network) it returns a deterministic client-side rule-based prediction and
   * tags `source: 'client-fallback'`.
   */
  async predict(req: PredictRequest): Promise<{ response: PredictResponse; source: PredictionSource }> {
    if (this.circuitOpen()) {
      log('INFO', 'predict_short_circuit', { learner_id: req.learner_id });
      return { response: ruleBasedPredict(req), source: 'client-fallback' };
    }
    try {
      const response = await this.request<PredictResponse>('/api/predict', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      this.recordSuccess();
      return { response, source: response.models_loaded ? 'ensemble' : 'server-rules' };
    } catch (err) {
      this.recordFailure();
      log('ERROR', 'predict_fallback', {
        learner_id: req.learner_id,
        error: err instanceof Error ? err.message : String(err),
      });
      return { response: ruleBasedPredict(req), source: 'client-fallback' };
    }
  }

  /**
   * Batch predict — built for the teacher heatmap (Module 107). Chunks to <=100
   * per the API limit. Per-learner fallback so one bad row can't sink the class.
   */
  async predictBatch(
    reqs: PredictRequest[],
  ): Promise<Array<{ response: PredictResponse; source: PredictionSource }>> {
    const out: Array<{ response: PredictResponse; source: PredictionSource }> = [];
    for (let i = 0; i < reqs.length; i += 100) {
      const chunk = reqs.slice(i, i + 100);
      if (this.circuitOpen()) {
        for (const r of chunk) out.push({ response: ruleBasedPredict(r), source: 'client-fallback' });
        continue;
      }
      try {
        const responses = await this.request<PredictResponse[]>('/api/predict/batch', {
          method: 'POST',
          body: JSON.stringify(chunk),
        });
        this.recordSuccess();
        responses.forEach((response) =>
          out.push({ response, source: response.models_loaded ? 'ensemble' : 'server-rules' }),
        );
      } catch (err) {
        this.recordFailure();
        log('ERROR', 'predict_batch_fallback', {
          size: chunk.length,
          error: err instanceof Error ? err.message : String(err),
        });
        for (const r of chunk) out.push({ response: ruleBasedPredict(r), source: 'client-fallback' });
      }
    }
    return out;
  }

  /** Close the loop (patent Claims 14, 24). Best-effort; never blocks the UI. */
  async sendFeedback(req: FeedbackRequest): Promise<FeedbackResponse | null> {
    try {
      const res = await this.request<FeedbackResponse>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(req),
      });
      log('INFO', 'feedback_sent', { learner_id: req.learner_id, feedback_id: res.feedback_id });
      return res;
    } catch (err) {
      log('WARN', 'feedback_failed', {
        learner_id: req.learner_id,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly retriable: boolean,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Versioned coefficients for the client-side fallback (A7). These intentionally MIRROR
 * the server's documented rule-based path so client- and server-side dips behave the
 * same; bump `FALLBACK_WEIGHTS_VERSION` whenever the server rules change. A drift test
 * (fallback within ±0.1 of a fixture ensemble output) belongs alongside these once a
 * test runner is wired into dashboard-src — there is none today.
 */
export const FALLBACK_WEIGHTS_VERSION = 1;
export const FALLBACK_WEIGHTS = {
  mastery: { masteryMean: 0.6, recentAvg: 0.25, trend: 0.15 },
  dropout: { lowMastery: 0.4, staleness: 0.25, dropoff: 0.2, incomplete: 0.15 },
  stalenessDays: 30,
  forgetting: { base: 2, masteryDays: 18, stalenessPenalty: 0.5 },
  attention: { dropout: 0.7, overload: 0.3 },
  confidence: { base: 0.05, evidenceWidth: 0.3, ciWidth: 0.5, evidenceScale: 20 },
} as const;

/**
 * Client-side rule-based prediction — mirrors the server's documented fallback so
 * the app behaves consistently whether the dip is server- or client-side. Pure &
 * deterministic for testability.
 */
export function ruleBasedPredict(req: PredictRequest): PredictResponse {
  const f: FeatureVector = ensureAllKeys(req.features);
  const W = FALLBACK_WEIGHTS;

  // Mastery: blend the engine's own mastery mean with recency + trend signals.
  const mastery = clamp01(
    W.mastery.masteryMean * f.concept_mastery_mean + W.mastery.recentAvg * f.recent_score_avg + W.mastery.trend * (0.5 + f.mastery_trend),
  );

  // Dropout risk: low mastery, staleness, high dropoff, low completion all push up.
  const staleness = Math.min(f.days_since_last_interaction / W.stalenessDays, 1);
  const dropout = clamp01(
    W.dropout.lowMastery * (1 - mastery) + W.dropout.staleness * staleness + W.dropout.dropoff * f.dropoff_rate + W.dropout.incomplete * (1 - f.completion_rate),
  );

  // Forgetting horizon: stronger mastery + recent revision => more days of grace.
  const forgettingDays = Math.max(0, Math.round(W.forgetting.base + W.forgetting.masteryDays * mastery - W.forgetting.stalenessPenalty * f.days_since_last_interaction));

  // Attention risk from dropout + cognitive overload.
  const attentionScore = clamp01(W.attention.dropout * dropout + W.attention.overload * f.cognitive_overload_index);
  const attention_risk: AttentionRisk =
    attentionScore >= 0.75 ? 'critical' : attentionScore >= 0.55 ? 'high' : attentionScore >= 0.35 ? 'moderate' : 'low';

  // Confidence band widens when we have little signal (few topics / interactions).
  const evidence = Math.min((f.topic_count + f.session_frequency_30d) / W.confidence.evidenceScale, 1);
  const halfWidth = W.confidence.base + W.confidence.evidenceWidth * (1 - evidence) + W.confidence.ciWidth * f.ci_width;
  return {
    learner_id: req.learner_id,
    mastery_probability: mastery,
    dropout_probability: dropout,
    forgetting_days: forgettingDays,
    attention_risk,
    confidence_lower: clamp01(mastery - halfWidth),
    confidence_upper: clamp01(mastery + halfWidth),
    models_loaded: false,
    prediction_latency_ms: 0,
  };
}

/** Guarantee all 40 keys exist (defensive — extractor already does this). */
function ensureAllKeys(features: Partial<FeatureVector>): FeatureVector {
  const v = {} as FeatureVector;
  for (const k of ALL_FEATURES) {
    const raw = features[k];
    v[k] = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
  }
  return v;
}

/** Default singleton — most callers just import this. */
export const mlClient = new MlServingClient();
