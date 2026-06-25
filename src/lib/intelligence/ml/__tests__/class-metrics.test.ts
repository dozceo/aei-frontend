import test from 'node:test';
import assert from 'node:assert/strict';
import { trendFromScores, percentileRank, summariseClass, tierFor, reviewDueCounts, summariseCohortLearning, scoreVolatility, effectiveMastery, spacingConsistency, priorityReason, studyMomentum, growthFromScores, difficultyTag, bestScore, weeklyConsistency, learningCurve, scoreAfterBreak, masteryDepth } from '../class-metrics';
import type { LearnerPrediction } from '../types';

function pred(over: Partial<LearnerPrediction> = {}): LearnerPrediction {
  return {
    learnerId: 'L',
    masteryProbability: 0.7,
    dropoutProbability: 0.2,
    forgettingDays: 9,
    attentionRisk: 'low',
    confidence: { lower: 0.6, upper: 0.8, width: 0.2 },
    lowConfidence: false,
    source: 'ensemble',
    latencyMs: 5,
    decision: { category: 'continuation', adkMode: 'PROGRESS_MODE', revisionUrgency: 'NONE', attentionRisk: 'low', reasoning: [] },
    generatedAt: new Date().toISOString(),
    ...over,
  };
}

test('trendFromScores: improving series', () => {
  const t = trendFromScores([0.4, 0.5, 0.7, 0.8]);
  assert.equal(t.direction, 'improving');
  assert.ok(t.deltaPct > 0);
  assert.ok(t.recentAvg > 0.5 && t.recentAvg < 0.7);
  assert.equal(t.sampleSize, 4);
});

test('trendFromScores: declining and flat', () => {
  assert.equal(trendFromScores([0.9, 0.8, 0.6, 0.5]).direction, 'declining');
  assert.equal(trendFromScores([0.7, 0.71, 0.69, 0.7]).direction, 'flat');
});

test('trendFromScores: empty and single', () => {
  assert.deepEqual(trendFromScores([]).direction, 'flat');
  assert.equal(trendFromScores([]).sampleSize, 0);
  assert.equal(trendFromScores([0.5]).direction, 'flat');
});

test('percentileRank', () => {
  assert.equal(percentileRank(0.5, []), 0.5);
  const p = percentileRank(0.8, [0.2, 0.5, 0.8, 0.9]);
  assert.ok(p > 0 && p <= 1);
  assert.equal(percentileRank(1.0, [0, 0.5]), 1);
  assert.equal(percentileRank(0, [0.5, 1]), 0);
});

test('tierFor: urgent decision => critical regardless of attention', () => {
  assert.equal(tierFor(pred({ attentionRisk: 'low', decision: { category: 'urgent_review', adkMode: 'INTERVENTION_REQUIRED', revisionUrgency: 'URGENT', attentionRisk: 'low', reasoning: [] } })), 'critical');
});

test('tierFor: high attention => critical; spaced => at_risk', () => {
  assert.equal(tierFor(pred({ attentionRisk: 'high' })), 'critical');
  assert.equal(tierFor(pred({ attentionRisk: 'low', decision: { category: 'spaced_revision', adkMode: 'SHORT_REVISION_MODE', revisionUrgency: 'SCHEDULED', attentionRisk: 'low', reasoning: [] } })), 'at_risk');
  assert.equal(tierFor(pred()), 'on_track');
});

test('summariseClass: counts, average, sorted anonymous at-risk', () => {
  const s = summariseClass([
    pred({ learnerId: 'a', masteryProbability: 0.9, attentionRisk: 'low' }),
    pred({ learnerId: 'b', masteryProbability: 0.3, attentionRisk: 'high', dropoutProbability: 0.8 }),
    pred({ learnerId: 'c', masteryProbability: 0.5, attentionRisk: 'moderate', dropoutProbability: 0.4 }),
  ]);
  assert.equal(s.total, 3);
  assert.equal(s.tierCounts.critical, 1);
  assert.equal(s.tierCounts.at_risk, 1);
  assert.equal(s.tierCounts.on_track, 1);
  assert.ok(Math.abs(s.averageMastery - 0.5667) < 0.01);
  assert.equal(s.atRisk[0].learnerId, 'b'); // critical first
  assert.equal(s.atRisk.length, 2);
  assert.ok(!('studentName' in s.atRisk[0])); // anonymity: no name field
});

import { streakFromDates } from '../class-metrics';

test('streakFromDates: consecutive days ending today', () => {
  const now = new Date('2026-06-14T10:00:00.000Z');
  const s = streakFromDates(['2026-06-12T09:00:00Z', '2026-06-13T20:00:00Z', '2026-06-14T08:00:00Z'], now);
  assert.equal(s.current, 3);
  assert.equal(s.studiedToday, true);
  assert.equal(s.longest, 3);
});

test('streakFromDates: not studied today but yesterday keeps streak', () => {
  const now = new Date('2026-06-14T10:00:00.000Z');
  const s = streakFromDates(['2026-06-12T09:00:00Z', '2026-06-13T20:00:00Z'], now);
  assert.equal(s.current, 2);
  assert.equal(s.studiedToday, false);
});

test('streakFromDates: gap breaks current but longest remembered; empty => 0', () => {
  const now = new Date('2026-06-14T10:00:00.000Z');
  const s = streakFromDates(['2026-06-05T09:00:00Z', '2026-06-06T09:00:00Z', '2026-06-07T09:00:00Z'], now);
  assert.equal(s.current, 0); // last activity 7 days ago
  assert.equal(s.longest, 3);
  assert.deepEqual(streakFromDates([], now), { current: 0, longest: 0, studiedToday: false });
});

test('streakFromDates: never throws on null/undefined/garbage input', () => {
  assert.deepEqual(streakFromDates(undefined as never), { current: 0, longest: 0, studiedToday: false });
  assert.deepEqual(streakFromDates(null as never), { current: 0, longest: 0, studiedToday: false });
  assert.equal(streakFromDates(['not-a-date']).current, 0);
});

test('streakFromDates: dedupes multiple sessions same day', () => {
  const now = new Date('2026-06-14T23:00:00.000Z');
  const s = streakFromDates(['2026-06-14T01:00:00Z', '2026-06-14T09:00:00Z', '2026-06-14T22:00:00Z'], now);
  assert.equal(s.current, 1);
});

test('reviewDueCounts: counts due and strongly-faded overdue', () => {
  const intervals = [
    { isDue: true, currentRetention: 0.65 }, // due, not overdue
    { isDue: true, currentRetention: 0.3 }, // due + overdue
    { isDue: false, currentRetention: 0.9 }, // not due
    { isDue: true, currentRetention: 0.49 }, // due + overdue (< 0.5)
  ];
  const c = reviewDueCounts(intervals);
  assert.equal(c.due, 3);
  assert.equal(c.overdue, 2);
});

test('reviewDueCounts: empty/garbage safe', () => {
  assert.deepEqual(reviewDueCounts([]), { due: 0, overdue: 0 });
  assert.deepEqual(reviewDueCounts(undefined as never), { due: 0, overdue: 0 });
  const c = reviewDueCounts([{ isDue: true }]); // missing retention → treated as 1 (not overdue)
  assert.equal(c.due, 1);
  assert.equal(c.overdue, 0);
});

test('summariseCohortLearning: aggregates trend/streak/due across students', () => {
  const cl = summariseCohortLearning([
    { recentAvg: 0.8, trendDir: 'improving', streakCurrent: 3, reviewDue: 2, reviewOverdue: 1 },
    { recentAvg: 0.4, trendDir: 'declining', streakCurrent: 0, reviewDue: 5, reviewOverdue: 2 },
    { recentAvg: null, trendDir: 'flat', streakCurrent: 1, reviewDue: 0, reviewOverdue: 0 },
  ]);
  assert.equal(cl.count, 3);
  assert.ok(Math.abs(cl.avgRecent - 0.6) < 1e-9); // mean of 0.8 & 0.4 (null skipped)
  assert.equal(cl.improving, 1);
  assert.equal(cl.declining, 1);
  assert.equal(cl.flat, 1);
  assert.ok(Math.abs(cl.avgStreak - 4 / 3) < 1e-9);
  assert.equal(cl.activeStreaks, 2);
  assert.equal(cl.totalDue, 7);
  assert.equal(cl.totalOverdue, 3);
});

test('summariseCohortLearning: empty safe', () => {
  const cl = summariseCohortLearning([]);
  assert.equal(cl.count, 0);
  assert.equal(cl.avgRecent, null);
  assert.equal(cl.avgStreak, 0);
  assert.equal(cl.consistent, 0);
});

test('summariseCohortLearning: counts consistency buckets', () => {
  const cl = summariseCohortLearning([
    { consistency: 'consistent' }, { consistency: 'consistent' }, { consistency: 'variable' }, { consistency: 'erratic' },
  ]);
  assert.equal(cl.consistent, 2);
  assert.equal(cl.variable, 1);
  assert.equal(cl.erratic, 1);
});

test('growthFromScores: earliest vs latest', () => {
  const g = growthFromScores([0.4, 0.45, 0.5, 0.55, 0.6, 0.8]);
  assert.ok(g.deltaPct > 0);
  assert.ok(g.current > g.baseline);
  assert.equal(growthFromScores([0.5]).deltaPct, 0);
  assert.equal(growthFromScores([]).sampleSize, 0);
});

test('studyMomentum: surging / dipping / steady / unknown', () => {
  assert.equal(studyMomentum([0.4, 0.42, 0.45, 0.9]).state, 'surging');
  assert.equal(studyMomentum([0.9, 0.88, 0.85, 0.4]).state, 'dipping');
  assert.equal(studyMomentum([0.6, 0.61, 0.6, 0.6]).state, 'steady');
  assert.equal(studyMomentum([0.7]).state, 'unknown');
  assert.equal(studyMomentum([]).state, 'unknown');
});

test('priorityReason: picks the dominant factor', () => {
  assert.equal(priorityReason({ masteryGap: 0.9, forgettingRisk: 0.2, recentExposureDecay: 0.9 }), 'Still shaky');
  assert.equal(priorityReason({ masteryGap: 0.2, forgettingRisk: 0.9, recentExposureDecay: 0.9 }), 'Fading from memory');
  assert.equal(priorityReason({ masteryGap: 0.1, forgettingRisk: 0.1, recentExposureDecay: 0.05 }), 'Not seen recently');
  assert.equal(priorityReason({ urgencySignal: 1, masteryGap: 0.1, recentExposureDecay: 1 }), 'Marked urgent');
  assert.equal(typeof priorityReason(), 'string'); // empty safe
});

test('spacingConsistency: on-time rate + label', () => {
  assert.deepEqual(spacingConsistency(0, 0), { rate: 1, label: 'On-track' });
  assert.equal(spacingConsistency(5, 1).rate, 0.8);
  assert.equal(spacingConsistency(5, 1).label, 'On-track');
  assert.equal(spacingConsistency(2, 1).label, 'Slipping');
  assert.equal(spacingConsistency(4, 3).label, 'Behind');
  assert.equal(spacingConsistency(3, 10).rate, 0); // overdue clamped to due
});

test('scoreAfterBreak: post-gap performance vs overall', () => {
  const D = 86_400_000;
  const t0 = Date.parse('2026-06-01T00:00:00Z');
  // 3 close attempts ~0.5, then one after a 5-day break at 0.9.
  const r = scoreAfterBreak([
    { score: 0.5, t: t0 },
    { score: 0.5, t: t0 + D },
    { score: 0.5, t: t0 + 2 * D },
    { score: 0.9, t: t0 + 7 * D },
  ]);
  assert.ok(r && r.n === 1 && r.afterAvg === 0.9 && r.deltaPct > 0);
  assert.equal(scoreAfterBreak([{ score: 0.5, t: t0 }]), null); // too few
  assert.equal(scoreAfterBreak([{ score: 0.5, t: t0 }, { score: 0.6, t: t0 + D }, { score: 0.6, t: t0 + 2 * D }]), null); // no break
});

test('learningCurve: slope → tone', () => {
  assert.equal(learningCurve(0.2).tone, 'up');
  assert.equal(learningCurve(-0.2).tone, 'down');
  assert.equal(learningCurve(0).tone, 'flat');
  assert.equal(learningCurve(NaN).tone, 'flat');
});

test('weeklyConsistency: active days / window + label', () => {
  assert.equal(weeklyConsistency(7).rate, 1);
  assert.equal(weeklyConsistency(5).label, 'Very consistent'); // 5/7 ≈ 0.71
  assert.equal(weeklyConsistency(3).label, 'Building habit'); // 3/7 ≈ 0.43
  assert.equal(weeklyConsistency(1).label, 'Sporadic');
  assert.equal(weeklyConsistency(99).rate, 1); // clamps to window
});

test('bestScore: max or null', () => {
  assert.equal(bestScore([0.3, 0.9, 0.5]), 0.9);
  assert.equal(bestScore([]), null);
  assert.equal(bestScore([2, 0.4]), 1); // clamps
});

test('difficultyTag: from retention-adjusted mastery', () => {
  assert.equal(difficultyTag(0.9, 0.95).tag, 'mastered');
  assert.equal(difficultyTag(0.7, 0.8).tag, 'comfortable'); // eff 0.56
  assert.equal(difficultyTag(0.5, 0.7).tag, 'learning'); // eff 0.35
  assert.equal(difficultyTag(0.3, 0.5).tag, 'hard'); // eff 0.15
  assert.equal(difficultyTag(0.85).tag, 'mastered'); // retention defaults to 1
});

test('effectiveMastery: mastery × retention, clamped', () => {
  assert.ok(Math.abs(effectiveMastery(0.8, 0.5) - 0.4) < 1e-9);
  assert.equal(effectiveMastery(1, 1), 1);
  assert.equal(effectiveMastery(0.9, 0), 0);
  assert.equal(effectiveMastery(2, 2), 1); // clamps
  assert.equal(effectiveMastery(-1, 0.5), 0);
});

test('masteryDepth: recall/apply/analyse from signals', () => {
  const d = masteryDepth({ mastery: 0.8, retention: 0.6, attempts: 2 });
  assert.equal(d.recall, 0.6);
  assert.equal(d.apply, 0.8);
  assert.ok(Math.abs(d.analyse - 0.8 * 0.5) < 1e-9); // attempts 2/4 = 0.5
  const e = masteryDepth({ mastery: 1, retention: 1, attempts: 10 });
  assert.equal(e.analyse, 1); // capped
  const z = masteryDepth();
  assert.deepEqual(z, { recall: 0, apply: 0, analyse: 0 });
});

test('scoreVolatility: classifies consistency from spread', () => {
  assert.equal(scoreVolatility([0.7, 0.72, 0.69, 0.71]).consistency, 'consistent');
  assert.equal(scoreVolatility([0.2, 0.95, 0.3, 0.9]).consistency, 'erratic');
  assert.equal(scoreVolatility([0.8]).consistency, 'unknown');
  assert.equal(scoreVolatility([]).consistency, 'unknown');
  assert.ok(scoreVolatility([0.5, 0.5, 0.5]).stdDev === 0);
});
