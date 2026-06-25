/**
 * Module 106 - Adaptive Decision Engine.
 *
 * Turns a raw prediction into one of the patent's four intervention categories,
 * plus the ADK mode + revision urgency the existing UI already understands, plus
 * human-readable reasoning[] (patent advantage #2: explainability - never show a
 * risk number without its "why").
 *
 *   Urgent Review   - high risk, low mastery, rapid forgetting -> teacher alert
 *   Spaced Revision - moderate; schedule spaced repetition
 *   Challenge-Next  - high mastery, healthy signals -> advance
 *   Continuation    - on track, no intervention
 *
 * Pure & deterministic. Thresholds are centralised so they can be tuned/tested.
 */

import type { PredictResponse, Decision, DecisionCategory, ADKMode, RevisionUrgency } from './types';

export interface DecisionThresholds {
  highMastery: number;
  continuationMastery: number;
  lowMastery: number;
  highDropout: number;
  moderateDropout: number;
  rapidForgettingDays: number;
}

export const DEFAULT_THRESHOLDS: DecisionThresholds = {
  highMastery: 0.8,
  continuationMastery: 0.65,
  lowMastery: 0.45,
  highDropout: 0.6,
  moderateDropout: 0.35,
  rapidForgettingDays: 3,
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function decide(
  prediction: PredictResponse,
  opts: { thresholds?: DecisionThresholds; timeToAssessmentDays?: number } = {},
): Decision {
  const t = opts.thresholds ?? DEFAULT_THRESHOLDS;
  const mastery = prediction.mastery_probability;
  const dropout = prediction.dropout_probability;
  const forgetDays = prediction.forgetting_days;
  const attention_risk = prediction.attention_risk;

  const reasoning: string[] = [];
  const examNear = typeof opts.timeToAssessmentDays === 'number' && opts.timeToAssessmentDays <= 7;
  const forgettingSoon = forgetDays <= t.rapidForgettingDays;
  const critical = attention_risk === 'critical' || attention_risk === 'high';
  const healthy = dropout < t.moderateDropout && !forgettingSoon && !critical;

  let category: DecisionCategory;

  if ((dropout >= t.highDropout && mastery <= t.lowMastery) || (critical && forgettingSoon)) {
    category = 'urgent_review';
    reasoning.push(`Dropout risk ${pct(dropout)} with mastery only ${pct(mastery)}.`);
    if (forgettingSoon) reasoning.push(`Likely to forget within ${forgetDays} day(s) - review now.`);
    if (critical) reasoning.push(`Attention risk is ${attention_risk}.`);
    if (examNear) reasoning.push(`Assessment in ${opts.timeToAssessmentDays} day(s) raises the stakes.`);
  } else if (mastery >= t.highMastery && healthy) {
    category = 'challenge_next';
    reasoning.push(`Mastery ${pct(mastery)} with low dropout risk ${pct(dropout)} - ready for harder content.`);
  } else if (mastery >= t.continuationMastery && healthy) {
    category = 'continuation';
    reasoning.push(`On track: mastery ${pct(mastery)}, dropout risk ${pct(dropout)}, retention steady.`);
  } else {
    category = 'spaced_revision';
    if (forgettingSoon) reasoning.push(`Retention fades in ~${forgetDays} day(s); schedule a spaced review.`);
    if (dropout >= t.moderateDropout) reasoning.push(`Moderate dropout risk ${pct(dropout)}.`);
    if (mastery < t.continuationMastery) reasoning.push(`Mastery ${pct(mastery)} - consolidate before advancing.`);
    if (reasoning.length === 0) reasoning.push(`Mastery ${pct(mastery)} - a spaced review will lock it in.`);
  }

  return {
    category,
    adkMode: toAdkMode(category),
    revisionUrgency: toRevisionUrgency(category),
    attentionRisk: attention_risk,
    reasoning,
  };
}

function toAdkMode(c: DecisionCategory): ADKMode {
  switch (c) {
    case 'urgent_review':
      return 'INTERVENTION_REQUIRED';
    case 'spaced_revision':
      return 'SHORT_REVISION_MODE';
    case 'challenge_next':
      return 'ASSESSMENT_MODE';
    case 'continuation':
      return 'PROGRESS_MODE';
  }
}

function toRevisionUrgency(c: DecisionCategory): RevisionUrgency {
  switch (c) {
    case 'urgent_review':
      return 'URGENT';
    case 'spaced_revision':
      return 'SCHEDULED';
    default:
      return 'NONE';
  }
}

export function categoryLabel(c: DecisionCategory): string {
  return {
    urgent_review: 'Review now',
    spaced_revision: 'Revise soon',
    challenge_next: 'Level up',
    continuation: 'On track',
  }[c];
}

/** Top-N deterministic feature drivers for explainable flags (M2). */
export function computeTopDrivers(
  prediction: PredictResponse,
  features: Partial<Record<string, number>> = {},
  n = 3,
): string[] {
  const drivers: Array<{ score: number; text: string }> = [];
  const mastery = prediction.mastery_probability;
  const dropout = prediction.dropout_probability;
  const days = features.days_since_last_interaction ?? 0;
  const streak = features.streak_days ?? 0;
  const dropoff = features.dropoff_rate ?? 0;
  const recent = features.recent_score_avg ?? mastery;

  if (dropout >= 0.35) drivers.push({ score: dropout, text: `Dropout risk ${pct(dropout)}` });
  if (mastery < 0.5) drivers.push({ score: 1 - mastery, text: `Mastery ${pct(mastery)}` });
  if (days >= 5) drivers.push({ score: Math.min(days / 14, 1), text: `No study loop in ${Math.round(days)}d` });
  if (dropoff >= 0.3) drivers.push({ score: dropoff, text: `Session drop-off ${pct(dropoff)}` });
  if (recent < mastery - 0.1) drivers.push({ score: mastery - recent, text: `Accuracy ↓${pct(mastery - recent)} (14d)` });
  if (streak === 0 && days > 2) drivers.push({ score: 0.4, text: 'Loop streak broken' });

  drivers.sort((a, b) => b.score - a.score);
  return drivers.slice(0, n).map((d) => d.text);
}
