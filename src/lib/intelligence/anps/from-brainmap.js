/**
 * from-brainmap — bridge a student's self brain map (useSelfBrainMap `data`) into the
 * ANPS planner. Extracted from StudentMind's PlannerView so the Dashboard "next step"
 * and the PLAN tab compute identical priorities from one place (no drift).
 *
 * Only assessed nodes feed the planner: a node counts once it has a mastery level AND a
 * lastAssessedAt timestamp. Nodes carrying a real revision urgency become review signals.
 *
 * Phase 3: optional `mlPrediction` feeds planner hints into runANPS so the daily plan
 * adapts to dropout/forgetting/attention signals — not just brain-map mastery.
 */
import { runANPS } from './anps-engine';
import { predictionToPlannerHints, hintsToPlanParams } from '../ml/planner-hints.ts';

/**
 * @param {object} data brain-map graph from useSelfBrainMap ({ nodes, ... })
 * @param {{ planner?: object, participationSlope?: number, mlPrediction?: object }} [opts]
 * @returns ANPS result ({ prioritizedConcepts, spacingIntervals, dailyPlan, ... }) or null
 */
export function brainMapToAnps(data, { planner, participationSlope, mlPrediction } = {}) {
  if (!data?.nodes?.length) return null;
  const tm = {};
  const ru = {};
  for (const n of data.nodes) {
    if (n.masteryLevel > 0 && n.metadata?.lastAssessedAt) {
      tm[n.id] = {
        topicId: n.id,
        mastery: n.masteryLevel,
        retentionStrength: n.retentionStrength || n.masteryLevel * 0.8,
        lastAssessedAt: n.metadata.lastAssessedAt,
        attempts: n.metadata.attempts || 1,
      };
      if (n.metadata.urgency && n.metadata.urgency !== 'none') {
        ru[n.id] = {
          topicId: n.id, urgency: n.metadata.urgency,
          estimatedForgetDate: new Date().toISOString(),
          daysSinceLastRevision: n.metadata.daysSinceLastRevision || 0,
        };
      }
    }
  }
  if (!Object.keys(tm).length) return null;

  const plannerHints = mlPrediction ? predictionToPlannerHints(mlPrediction) : null;
  const hintParams = hintsToPlanParams(plannerHints);

  return runANPS(tm, ru, {
    planParams: { ...(planner || {}), ...hintParams },
    participationSlope,
    mlPrediction: mlPrediction || null,
    mlDecision: mlPrediction?.decision ?? null,
    plannerHints,
  });
}

/** id → label lookup from the brain-map nodes (falls back to the id). */
export function nodeLabeler(data) {
  const m = {};
  for (const n of data?.nodes || []) m[n.id] = n.label;
  return (id) => m[id] || id;
}
