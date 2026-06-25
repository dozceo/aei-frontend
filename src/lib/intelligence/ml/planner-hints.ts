/**
 * planner-hints — translate raw ML predictions into safe, bounded planner signals.
 *
 * Raw dropout probabilities never drive UX directly; this module converts them into
 * hints that runANPS / the student planner can consume. Pure & deterministic.
 */

import type { LearnerPrediction, Decision, DecisionCategory, AttentionRisk } from './types';

/** Bounded planner knobs derived from one ML prediction. */
export interface PlannerHints {
  urgencyBoost: number;
  reviewBias: number;
  newTopicPenalty: number;
  sessionLengthMin: number;
  requireQuickWin: boolean;
  difficultyCap: 'easy' | 'medium' | 'normal';
  interventionLevel: number;
  preferReview: boolean;
  maxNewTopics: number;
  maxReviewTopics: number;
  dailyBudgetMinutes: number;
  /** Student-friendly summary for plan banner (no scary dropout %). */
  planSummary: string;
}

export type ActionType = 'retrieval_practice' | 'spaced_review' | 'quick_win' | 'challenge' | 'diagnostic' | 'confidence_check';

export interface ActionStyle {
  actionType: ActionType;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  tone: 'supportive' | 'normal' | 'stretch';
}

const DEFAULT_HINTS: PlannerHints = {
  urgencyBoost: 0,
  reviewBias: 0,
  newTopicPenalty: 0,
  sessionLengthMin: 15,
  requireQuickWin: false,
  difficultyCap: 'normal',
  interventionLevel: 0,
  preferReview: false,
  maxNewTopics: 2,
  maxReviewTopics: 5,
  dailyBudgetMinutes: 60,
  planSummary: '',
};

/** Convert an enriched prediction → bounded planner hints. Returns null when no prediction. */
export function predictionToPlannerHints(prediction: LearnerPrediction | null | undefined): PlannerHints | null {
  if (!prediction) return null;

  const dropout = prediction.dropoutProbability ?? 0;
  const forgetting = prediction.forgettingDays ?? 99;
  const attention = prediction.attentionRisk ?? 'low';
  const mastery = prediction.masteryProbability ?? 0.5;
  const ciWide = prediction.lowConfidence || (prediction.confidence?.width ?? 0) > 0.35;
  const category = prediction.decision?.category ?? 'continuation';

  const reviewBias = forgetting <= 3 ? 0.35 : forgetting <= 7 ? 0.15 : 0;
  const urgencyBoost = dropout >= 0.6 ? 0.4 : dropout >= 0.35 ? 0.2 : 0;
  const newTopicPenalty = (dropout >= 0.6 || attention === 'critical') ? 0.5
    : (attention === 'high' || ciWide) ? 0.25 : 0;
  const requireQuickWin = dropout >= 0.6 || attention === 'high' || attention === 'critical';
  const difficultyCap: PlannerHints['difficultyCap'] =
    attention === 'critical' ? 'easy' : attention === 'high' ? 'medium' : 'normal';
  const sessionLengthMin = dropout >= 0.6 ? 10 : attention === 'high' ? 12 : 15;
  const preferReview = category === 'spaced_revision' || category === 'urgent_review' || forgetting <= 3;
  const interventionLevel = category === 'urgent_review' ? 0.9
    : category === 'spaced_revision' ? 0.5
    : category === 'challenge_next' ? 0.1 : 0;

  let maxNewTopics = 2;
  let maxReviewTopics = 5;
  let dailyBudgetMinutes = 60;
  if (dropout >= 0.6) { maxNewTopics = 0; maxReviewTopics = 4; dailyBudgetMinutes = 35; }
  else if (dropout >= 0.35 || attention === 'high') { maxNewTopics = 1; maxReviewTopics = 5; dailyBudgetMinutes = 45; }
  if (category === 'challenge_next' && mastery >= 0.8 && dropout < 0.35) maxNewTopics = 3;

  const planSummary = buildPlanSummary(category, forgetting, attention, requireQuickWin);

  return {
    urgencyBoost,
    reviewBias,
    newTopicPenalty,
    sessionLengthMin,
    requireQuickWin,
    difficultyCap,
    interventionLevel,
    preferReview,
    maxNewTopics,
    maxReviewTopics,
    dailyBudgetMinutes,
    planSummary,
  };
}

/** Map a decision category → default action style for a plan task. */
export function decisionToActionStyle(
  decision: Decision | null | undefined,
  hints: PlannerHints | null,
): ActionStyle {
  const cap = hints?.difficultyCap ?? 'normal';
  const difficulty = cap === 'normal' ? 'medium' : cap;
  const mins = hints?.sessionLengthMin ?? 15;
  const cat = decision?.category ?? 'continuation';

  switch (cat) {
    case 'urgent_review':
      return { actionType: 'retrieval_practice', difficulty, estimatedMinutes: mins, tone: 'supportive' };
    case 'spaced_revision':
      return { actionType: 'spaced_review', difficulty, estimatedMinutes: mins, tone: 'supportive' };
    case 'challenge_next':
      return { actionType: 'challenge', difficulty: cap === 'easy' ? 'medium' : 'hard', estimatedMinutes: Math.max(mins, 12), tone: 'stretch' };
    default:
      if (hints?.requireQuickWin) {
        return { actionType: 'quick_win', difficulty: 'easy', estimatedMinutes: Math.min(mins, 10), tone: 'supportive' };
      }
      return { actionType: 'retrieval_practice', difficulty, estimatedMinutes: mins, tone: 'normal' };
  }
}

/** Student-friendly reason for one plan task (no raw dropout %). */
export function studentTaskReason(
  taskType: string,
  hints: PlannerHints | null,
  decision: Decision | null | undefined,
  topicLabel?: string,
  opts: { easyWin?: boolean } = {},
): string {
  const label = topicLabel ? `"${topicLabel}"` : 'this topic';
  if (opts.easyWin || taskType === 'practice') {
    return `A quick win on ${label} — small steps rebuild momentum when things feel heavy.`;
  }
  if (taskType === 'review') {
    if (hints?.reviewBias && hints.reviewBias >= 0.3) {
      return `Forgetting risk is high — a short review of ${label} now saves relearning later.`;
    }
    return `Retention is fading on ${label}; a quick refresh keeps it fresh.`;
  }
  if (taskType === 'challenge') {
    return `You're doing well — try a stretch task on ${label}.`;
  }
  if (decision?.category === 'urgent_review') {
    return `${label} needs attention before it slips — start with a focused review.`;
  }
  if (hints?.requireQuickWin) {
    return `This is a manageable task on ${label} — built for today when focus is limited.`;
  }
  if (decision?.reasoning?.[0]) {
    // Strip technical percentages from decision reasoning for students.
    return decision.reasoning[0].replace(/Dropout risk \d+%/gi, 'Recent signals suggest extra support')
      .replace(/mastery only \d+%/gi, 'mastery needs a boost');
  }
  return `Priority focus on ${label} based on your brain map.`;
}

// Fix: studentTaskReason references `task` incorrectly - should use taskType param only
function buildPlanSummary(
  category: DecisionCategory,
  forgettingDays: number,
  attention: AttentionRisk,
  quickWin: boolean,
): string {
  if (category === 'urgent_review') return 'Today\'s plan leans toward urgent review — short, focused tasks.';
  if (category === 'spaced_revision' && forgettingDays <= 3) {
    return 'Your plan prioritises spaced review before anything new fades.';
  }
  if (quickWin || attention === 'high' || attention === 'critical') {
    return 'Tasks are shorter today — built for focus and quick wins.';
  }
  if (category === 'challenge_next') return 'You\'re ready for a stretch — one challenge task is included.';
  return '';
}

/** Classify whether a recommendation helped after an attempt. */
export function classifyRecommendationOutcome(
  beforeScore: number | null | undefined,
  afterScore: number | null | undefined,
): 'helped' | 'not_helped' | 'neutral' {
  if (typeof beforeScore !== 'number' || typeof afterScore !== 'number') return 'neutral';
  const delta = afterScore - beforeScore;
  if (delta >= 0.15) return 'helped';
  if (delta <= -0.10) return 'not_helped';
  return 'neutral';
}

/** Merge planner hints into ANPS planParams (backward-compatible). */
export function hintsToPlanParams(hints: PlannerHints | null): Record<string, unknown> {
  if (!hints) return {};
  return {
    maxNewTopicsPerDay: hints.maxNewTopics,
    maxReviewTopicsPerDay: hints.maxReviewTopics,
    dailyBudgetMinutes: hints.dailyBudgetMinutes,
    mlSessionLengthMin: hints.sessionLengthMin,
    mlDifficultyCap: hints.difficultyCap,
    mlRequireQuickWin: hints.requireQuickWin,
    mlPreferReview: hints.preferReview,
  };
}

export { DEFAULT_HINTS };
