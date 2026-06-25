/**
 * Phase 3 — ANPS engine ML integration tests.
 * Run: node --test dashboard-src/src/anps/__tests__/anps-ml.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { runANPS, prioritizeConcepts } from '../anps-engine.js';
import { predictionToPlannerHints } from '../../ml/planner-hints.ts';

const tm = {
  weak: { topicId: 'weak', mastery: 0.2, retentionStrength: 0.3, lastAssessedAt: new Date(Date.now() - 7 * 86400000).toISOString(), attempts: 2 },
  strong: { topicId: 'strong', mastery: 0.85, retentionStrength: 0.9, lastAssessedAt: new Date().toISOString(), attempts: 5 },
};
const ru = {};

const mlPrediction = {
  masteryProbability: 0.35,
  dropoutProbability: 0.62,
  forgettingDays: 2,
  attentionRisk: 'high',
  lowConfidence: false,
  decision: { category: 'spaced_revision', reasoning: [] },
};

test('ML hints boost weak-topic priority vs baseline', () => {
  const base = prioritizeConcepts(tm, ru);
  const hints = predictionToPlannerHints(mlPrediction);
  const ml = prioritizeConcepts(tm, ru, {}, hints, mlPrediction);
  const baseWeak = base.find((c) => c.topicId === 'weak').priorityScore;
  const mlWeak = ml.find((c) => c.topicId === 'weak').priorityScore;
  assert.ok(mlWeak >= baseWeak);
});

test('high dropout plan has fewer new topics and may include quick win', () => {
  const hints = predictionToPlannerHints(mlPrediction);
  const result = runANPS(tm, ru, {
    plannerHints: hints,
    mlPrediction,
    planParams: {
      maxNewTopicsPerDay: hints.maxNewTopics,
      maxReviewTopicsPerDay: hints.maxReviewTopics,
      dailyBudgetMinutes: hints.dailyBudgetMinutes,
      mlRequireQuickWin: hints.requireQuickWin,
      mlDifficultyCap: hints.difficultyCap,
      mlSessionLengthMin: hints.sessionLengthMin,
      mlAdjusted: true,
    },
  });
  assert.equal(result.mlAdjusted, true);
  const newTasks = result.dailyPlan.tasks.filter((t) => t.taskType === 'new_learning' || t.taskType === 'challenge');
  assert.ok(newTasks.length <= 1);
  const hasQuickWin = result.dailyPlan.tasks.some((t) => t.easyWin || t.actionType === 'quick_win');
  assert.ok(hasQuickWin || result.dailyPlan.tasks.length <= 3);
});

test('runANPS without ML unchanged shape (backward compat)', () => {
  const result = runANPS(tm, ru, {});
  assert.ok(Array.isArray(result.prioritizedConcepts));
  assert.ok(result.dailyPlan.date);
  assert.equal(result.mlAdjusted, false);
});
