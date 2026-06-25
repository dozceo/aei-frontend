/**
 * ML spine tests. Pure modules + the client with an injected fetch mock — no
 * network, no React. Run via esbuild bundle + node --test (see run-tests.mjs).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { ALL_FEATURES, emptyFeatureVector, normaliseFeatureVector } from '../feature-keys';
import { extractFeatureVector } from '../feature-extractor';
import { decide } from '../decision-engine';
import { ruleBasedPredict, MlServingClient } from '../ml-client';
import { predictForLearner } from '../index';
import type { PredictResponse } from '../types';

const okResponse = (over: Partial<PredictResponse> = {}): PredictResponse => ({
  learner_id: 'L1',
  mastery_probability: 0.7,
  forgetting_days: 9,
  attention_risk: 'low',
  dropout_probability: 0.2,
  confidence_lower: 0.64,
  confidence_upper: 0.76,
  models_loaded: true,
  prediction_latency_ms: 12,
  ...over,
});

function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init ?? {})) as unknown as typeof fetch;
}

const jsonRes = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// ── Contract ─────────────────────────────────────────────────────────────────

test('ALL_FEATURES is exactly 40 unique keys', () => {
  assert.equal(ALL_FEATURES.length, 40);
  assert.equal(new Set(ALL_FEATURES).size, 40);
});

test('emptyFeatureVector has all 40 keys at 0; normalise de-NaNs', () => {
  const v = emptyFeatureVector();
  assert.equal(Object.keys(v).length, 40);
  assert.ok(Object.values(v).every((x) => x === 0));
  const n = normaliseFeatureVector({ concept_mastery_mean: 0.5, ci_width: NaN, mastery_trend: Infinity });
  assert.equal(n.concept_mastery_mean, 0.5);
  assert.equal(n.ci_width, 0);
  assert.equal(n.mastery_trend, 0);
  assert.equal(Object.keys(n).length, 40);
});

// ── Feature extractor ─────────────────────────────────────────────────────────

test('extractFeatureVector returns 40 finite keys and reads brain-map stats', () => {
  const brainMap = {
    learnerId: 'L1',
    generatedAt: new Date().toISOString(),
    nodes: [
      { id: 't1', label: 'Fractions', masteryLevel: 0.3, retentionStrength: 0.4, size: 1, color: '#000',
        metadata: { masteryPercent: 30, retentionPercent: 40, attempts: 2, urgency: 'high', isStruggling: true, isMastered: false, recentScores: [0.2, 0.3], trajectorySlope: 0.05 } },
      { id: 't2', label: 'Ratios', masteryLevel: 0.85, retentionStrength: 0.8, size: 1, color: '#000',
        metadata: { masteryPercent: 85, retentionPercent: 80, attempts: 4, urgency: 'none', isStruggling: false, isMastered: true, recentScores: [0.8, 0.9], trajectorySlope: 0.02 }, uncertainty: 0.1 },
    ],
    edges: [],
    stats: { totalTopics: 2, masteredTopics: 1, learningTopics: 0, strugglingTopics: 1, averageMastery: 0.575, averageRetention: 0.6, criticalTopics: [], strongestTopics: [] },
  } as unknown as Parameters<typeof extractFeatureVector>[0]['brainMap'];

  const v = extractFeatureVector({ brainMap, engagement: { daysSinceLastInteraction: 4, completionRate: 0.9 } });
  assert.equal(Object.keys(v).length, 40);
  assert.ok(Object.values(v).every((x) => Number.isFinite(x)));
  assert.equal(v.concept_mastery_mean, 0.575); // from stats.averageMastery
  assert.equal(v.topic_count, 2);
  assert.equal(v.struggling_topic_count, 1);
  assert.equal(v.days_since_last_interaction, 4);
  assert.equal(v.completion_rate, 0.9);
});

test('extractFeatureVector tolerates empty input (all zero-ish, completion defaults 1)', () => {
  const v = extractFeatureVector({});
  assert.equal(Object.keys(v).length, 40);
  assert.equal(v.concept_mastery_mean, 0);
  assert.equal(v.completion_rate, 1);
  assert.equal(v.mastery_percentile, 0.5);
});

// ── Rule-based prediction ─────────────────────────────────────────────────────

test('ruleBasedPredict produces bounded, valid output', () => {
  const r = ruleBasedPredict({ learner_id: 'L1', features: normaliseFeatureVector({ concept_mastery_mean: 0.2, days_since_last_interaction: 20, dropoff_rate: 0.5 }) });
  assert.ok(r.mastery_probability >= 0 && r.mastery_probability <= 1);
  assert.ok(r.dropout_probability >= 0 && r.dropout_probability <= 1);
  assert.ok(r.forgetting_days >= 0);
  assert.ok(['low', 'moderate', 'high', 'critical'].includes(r.attention_risk));
  assert.equal(r.models_loaded, false);
});

// ── Decision engine ───────────────────────────────────────────────────────────

test('decide → urgent_review on low mastery + high dropout', () => {
  const d = decide(okResponse({ mastery_probability: 0.3, dropout_probability: 0.7, forgetting_days: 2, attention_risk: 'high' }));
  assert.equal(d.category, 'urgent_review');
  assert.equal(d.adkMode, 'INTERVENTION_REQUIRED');
  assert.equal(d.revisionUrgency, 'URGENT');
  assert.ok(d.reasoning.length > 0);
});

test('decide → challenge_next on high mastery + low dropout', () => {
  const d = decide(okResponse({ mastery_probability: 0.9, dropout_probability: 0.1, forgetting_days: 14 }));
  assert.equal(d.category, 'challenge_next');
});

test('decide → spaced_revision on moderate signals', () => {
  const d = decide(okResponse({ mastery_probability: 0.6, dropout_probability: 0.4, forgetting_days: 6 }));
  assert.equal(d.category, 'spaced_revision');
  assert.equal(d.revisionUrgency, 'SCHEDULED');
});

test('decide → continuation when on track', () => {
  const d = decide(okResponse({ mastery_probability: 0.78, dropout_probability: 0.15, forgetting_days: 12, attention_risk: 'low' }));
  assert.equal(d.category, 'continuation');
});

// ── Client: success / fallback / circuit breaker ───────────────────────────────

test('client.predict returns source=ensemble on models_loaded', async () => {
  const client = new MlServingClient({ fetchImpl: mockFetch(() => jsonRes(okResponse())), retries: 0 });
  const { response, source } = await client.predict({ learner_id: 'L1', features: emptyFeatureVector() });
  assert.equal(source, 'ensemble');
  assert.equal(response.mastery_probability, 0.7);
});

test('client.predict falls back (no throw) on 500, tagged client-fallback', async () => {
  const client = new MlServingClient({ fetchImpl: mockFetch(() => jsonRes({ detail: 'boom' }, 500)), retries: 0 });
  const { source } = await client.predict({ learner_id: 'L1', features: emptyFeatureVector() });
  assert.equal(source, 'client-fallback');
});

test('client.predict does NOT retry 4xx (validation)', async () => {
  let calls = 0;
  const client = new MlServingClient({
    retries: 3,
    fetchImpl: mockFetch(() => {
      calls++;
      return jsonRes({ detail: 'bad' }, 422);
    }),
  });
  const { source } = await client.predict({ learner_id: 'L1', features: emptyFeatureVector() });
  assert.equal(source, 'client-fallback');
  assert.equal(calls, 1); // one attempt, no retries on 4xx
});

test('circuit breaker opens after threshold and short-circuits', async () => {
  let calls = 0;
  const client = new MlServingClient({
    retries: 0,
    failureThreshold: 2,
    cooldownMs: 10_000,
    fetchImpl: mockFetch(() => {
      calls++;
      return jsonRes({ detail: 'down' }, 503);
    }),
  });
  await client.predict({ learner_id: 'L1', features: emptyFeatureVector() }); // fail 1
  await client.predict({ learner_id: 'L1', features: emptyFeatureVector() }); // fail 2 → opens
  const before = calls;
  await client.predict({ learner_id: 'L1', features: emptyFeatureVector() }); // short-circuit, no fetch
  assert.equal(calls, before, 'no network call once circuit is open');
});

test('client times out and falls back', async () => {
  const client = new MlServingClient({
    timeoutMs: 50,
    retries: 0,
    fetchImpl: mockFetch(
      (_u, init) =>
        new Promise((resolve, reject) => {
          const sig = init.signal as AbortSignal | undefined;
          sig?.addEventListener('abort', () => reject(new Error('aborted')));
          setTimeout(() => resolve(jsonRes(okResponse())), 500); // slower than timeout
        }),
    ),
  });
  const { source } = await client.predict({ learner_id: 'L1', features: emptyFeatureVector() });
  assert.equal(source, 'client-fallback');
});

// ── End-to-end orchestrator ────────────────────────────────────────────────────

test('predictForLearner returns enriched LearnerPrediction with decision', async () => {
  const client = new MlServingClient({
    retries: 0,
    fetchImpl: mockFetch(() => jsonRes(okResponse({ mastery_probability: 0.9, dropout_probability: 0.1, forgetting_days: 14 }))),
  });
  const pred = await predictForLearner('L1', { client, brainMap: null });
  assert.equal(pred.learnerId, 'L1');
  assert.equal(pred.source, 'ensemble');
  assert.equal(pred.decision.category, 'challenge_next');
  assert.ok(pred.confidence.width >= 0);
  assert.ok(typeof pred.latencyMs === 'number');
});
