/**
 * Phase 3 — planner-hints unit tests.
 * Run: node --test dashboard-src/src/ml/__tests__/planner-hints.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  predictionToPlannerHints,
  decisionToActionStyle,
  studentTaskReason,
  classifyRecommendationOutcome,
  hintsToPlanParams,
} from '../planner-hints.ts';

function pred(over = {}) {
  return {
    learnerId: 'L1',
    masteryProbability: 0.42,
    dropoutProbability: 0.56,
    forgettingDays: 3.5,
    attentionRisk: 'moderate',
    confidence: { lower: 0.31, upper: 0.52, width: 0.21 },
    lowConfidence: false,
    source: 'ensemble',
    latencyMs: 5,
    decision: {
      category: 'spaced_revision',
      adkMode: 'SHORT_REVISION_MODE',
      revisionUrgency: 'SCHEDULED',
      attentionRisk: 'moderate',
      reasoning: ['Retention fades in ~3 day(s); schedule a spaced review.'],
    },
    generatedAt: new Date().toISOString(),
    ...over,
  };
}

test('predictionToPlannerHints: null when no prediction', () => {
  assert.equal(predictionToPlannerHints(null), null);
});

test('forgettingDays <= 3 boosts reviewBias', () => {
  const h = predictionToPlannerHints(pred({ forgettingDays: 2 }));
  assert.ok(h.reviewBias >= 0.35);
  assert.equal(h.preferReview, true);
});

test('high dropout reduces task budget and requires quick win', () => {
  const h = predictionToPlannerHints(pred({ dropoutProbability: 0.65 }));
  assert.ok(h.urgencyBoost >= 0.4);
  assert.equal(h.requireQuickWin, true);
  assert.equal(h.maxNewTopics, 0);
  assert.ok(h.dailyBudgetMinutes <= 35);
});

test('critical attention caps difficulty to easy', () => {
  const h = predictionToPlannerHints(pred({ attentionRisk: 'critical' }));
  assert.equal(h.difficultyCap, 'easy');
  assert.ok(h.newTopicPenalty >= 0.5);
});

test('hintsToPlanParams merges into ANPS planParams shape', () => {
  const h = predictionToPlannerHints(pred());
  const p = hintsToPlanParams(h);
  assert.equal(typeof p.maxNewTopicsPerDay, 'number');
  assert.equal(typeof p.dailyBudgetMinutes, 'number');
  assert.equal(p.mlRequireQuickWin, h.requireQuickWin);
});

test('decisionToActionStyle: urgent_review → retrieval_practice', () => {
  const style = decisionToActionStyle({ category: 'urgent_review' }, predictionToPlannerHints(pred()));
  assert.equal(style.actionType, 'retrieval_practice');
  assert.equal(style.tone, 'supportive');
});

test('studentTaskReason avoids raw dropout percentage', () => {
  const reason = studentTaskReason('review', predictionToPlannerHints(pred()), pred().decision, 'Motion');
  assert.ok(!reason.includes('56%'));
  assert.ok(reason.includes('Motion') || reason.includes('forgetting') || reason.includes('Retention'));
});

test('classifyRecommendationOutcome thresholds', () => {
  assert.equal(classifyRecommendationOutcome(0.4, 0.6), 'helped');
  assert.equal(classifyRecommendationOutcome(0.7, 0.5), 'not_helped');
  assert.equal(classifyRecommendationOutcome(0.5, 0.55), 'neutral');
  assert.equal(classifyRecommendationOutcome(null, 0.8), 'neutral');
});
