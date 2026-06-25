/**
 * Tests for the engagement → ML signal adapter. Pure; fixed `now` for
 * deterministic day-window math. Noon-UTC `now` keeps day keys stable across the
 * test machine's timezone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { toLearnerSignals } from '../engagement-adapter';
import { extractFeatureVector } from '../feature-extractor';

const NOW = new Date('2026-06-14T12:00:00.000Z');
const DAY_MS = 86_400_000;

function localDayKey(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
const keyMinus = (n: number): string => localDayKey(new Date(NOW.getTime() - n * DAY_MS));
const approx = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

function sampleSummary() {
  return {
    dailyMs: {
      [keyMinus(0)]: 30 * 60_000,
      [keyMinus(1)]: 20 * 60_000,
      [keyMinus(2)]: 10 * 60_000,
      [keyMinus(10)]: 15 * 60_000,
      [keyMinus(40)]: 50 * 60_000,
    },
    totalActiveMs: 125 * 60_000,
    viewCount: 5,
    lastViewAt: NOW.toISOString(),
    byResource: {
      r1: { activeMs: 60 * 60_000, coverage: 0.8, opens: 2 },
      r2: { activeMs: 30 * 60_000, coverage: 0.5, opens: 1 },
    },
  };
}

function sampleAttempts() {
  return [
    { topicId: 't1', score: 0.8, correct: 4, total: 5, completedAt: `${keyMinus(1)}T12:00:00`, avgLatencyMs: 20_000, misconceptions: 1, recovered: 0 },
    { topicId: 't1', score: 0.6, correct: 3, total: 5, completedAt: `${keyMinus(0)}T12:00:00`, avgLatencyMs: 30_000, misconceptions: 0, recovered: 1 },
    { topicId: 't2', score: 1.0, correct: 5, total: 5, completedAt: `${keyMinus(2)}T12:00:00`, avgLatencyMs: 10_000 },
  ];
}

// ── Temporal ─────────────────────────────────────────────────────────────────

test('temporal signals: windows, duration, streak, staleness', () => {
  const { engagement: e } = toLearnerSignals({ summary: sampleSummary(), attempts: sampleAttempts(), now: NOW });
  assert.equal(e.sessionFrequency7d, 3); // days 0,1,2 (10 & 40 excluded)
  assert.equal(e.sessionFrequency30d, 4); // + day 10
  assert.equal(e.streakDays, 3); // 0,1,2 consecutive, gap at 3
  assert.ok(approx(e.avgSessionDurationMin!, 25)); // 125min / 5 views
  assert.ok(approx(e.studyTimePerDayMin!, 60 / 7)); // (30+20+10)min / 7
  assert.ok(e.daysSinceLastInteraction! < 0.001); // lastViewAt == now
  assert.ok(e.interSessionIntervalAvgH! > 0);
});

// ── Behavioral ───────────────────────────────────────────────────────────────

test('behavioral signals: completion, retry, revision, correction', () => {
  const { engagement: e } = toLearnerSignals({ summary: sampleSummary(), attempts: sampleAttempts(), now: NOW });
  assert.ok(approx(e.completionRate!, 0.8)); // mean(0.8, 0.6, 1.0)
  assert.ok(approx(e.dropoffRate!, 0.2));
  assert.equal(e.quizRetryRate, 0.5); // t1 retried of {t1,t2}
  assert.equal(e.revisionRate, 0.5); // r1 opens>1 of {r1,r2}
  assert.equal(e.resourceAccessRate, 2);
  assert.ok(approx(e.selfAssessmentAccuracy!, 0.5)); // rec1 / (rec1+misc1)
  assert.ok(approx(e.errorCorrectionRate!, 1)); // rec1 / max(misc1,1)
});

test('completion falls back to resource coverage when no graded attempts', () => {
  const { engagement: e } = toLearnerSignals({ summary: sampleSummary(), attempts: [], now: NOW });
  assert.ok(approx(e.completionRate!, 0.65)); // mean(0.8, 0.5)
  assert.equal(e.quizRetryRate, undefined); // no attempts → omitted
});

// ── Cognitive (partial) ──────────────────────────────────────────────────────

test('cognitive: response latency from attempts, attention span from duration', () => {
  const { cognitive: c } = toLearnerSignals({ summary: sampleSummary(), attempts: sampleAttempts(), now: NOW });
  assert.ok(approx(c.responseLatencySec!, 20)); // mean(20,30,10)k ms / 1000
  assert.ok(approx(c.attentionSpanEstimationMin!, 25));
  assert.equal(c.stressProxy, undefined); // left to the energy check-in
});

// ── Safety on empty input ─────────────────────────────────────────────────────

test('empty input → sparse, finite, no NaN; completion omitted (defaults to 1)', () => {
  const { engagement: e, cognitive: c } = toLearnerSignals();
  assert.equal(e.completionRate, undefined);
  assert.equal(e.sessionFrequency7d, undefined);
  assert.ok(Object.values(e).every((x) => Number.isFinite(x)));
  assert.ok(Object.values(c).every((x) => Number.isFinite(x)));
});

test('tolerates undefined/garbage fields without throwing', () => {
  const { engagement: e } = toLearnerSignals({
    summary: { dailyMs: { bad: NaN, [keyMinus(0)]: 5 * 60_000 }, viewCount: 0, totalActiveMs: 100 } as never,
    attempts: [{ topicId: 't1', total: 0, correct: 0 }] as never,
    now: NOW,
  });
  assert.ok(Object.values(e).every((x) => Number.isFinite(x)));
  assert.equal(e.avgSessionDurationMin, undefined); // viewCount 0 → no ÷0
});

// ── Integration with the feature extractor ────────────────────────────────────

test('signals flow through extractFeatureVector into the 40-key vector', () => {
  const signals = toLearnerSignals({ summary: sampleSummary(), attempts: sampleAttempts(), now: NOW });
  const v = extractFeatureVector({ engagement: signals.engagement, cognitive: signals.cognitive });
  assert.equal(Object.keys(v).length, 40);
  assert.ok(Object.values(v).every((x) => Number.isFinite(x)));
  assert.equal(v.session_frequency_7d, 3);
  assert.ok(approx(v.completion_rate, 0.8));
  assert.ok(approx(v.response_latency, 20));
  assert.ok(v.days_since_last_interaction < 0.001);
});

// ── Event-derived slots (Wave-F: feature-usage telemetry → empty model slots) ──

test('eventBased fills previously-zero slots from the event stream', () => {
  const events = [
    { type: 'guide_open', ts: '2026-06-14T09:00:00' },
    { type: 'guide_open', ts: '2026-06-14T09:05:00' },
    { type: 'tab_open', ts: '2026-06-14T09:10:00', payload: { tabId: 'learn' } },
    { type: 'tab_open', ts: '2026-06-14T09:11:00', payload: { tabId: 'query' } },
    { type: 'quiz_completed', ts: '2026-06-14T09:20:00' },
    { type: 'clarify_answered', ts: '2026-06-14T09:21:00' },
  ];
  const { engagement: e, cognitive: c, participationSlope } = toLearnerSignals({ events, now: NOW });
  assert.ok((e.hintUsageRate ?? 0) > 0);       // guide opens
  assert.ok((e.chatFrequency ?? 0) > 0);       // query-tab opens
  assert.equal(e.feedbackResponseRate, 1);     // 1 clarify / 1 quiz
  assert.ok((c.taskSwitchingRate ?? 0) > 0);   // 2 distinct tabs / 8
  assert.equal(typeof participationSlope, 'number');
});

test('no events → event-derived slots stay omitted (model sees 0)', () => {
  const { engagement: e, cognitive: c, participationSlope } = toLearnerSignals({ summary: sampleSummary(), attempts: sampleAttempts(), now: NOW });
  assert.equal(e.hintUsageRate, undefined);
  assert.equal(e.chatFrequency, undefined);
  assert.equal(e.feedbackResponseRate, undefined);
  assert.equal(c.taskSwitchingRate, undefined);
  assert.equal(participationSlope, 0);
});
