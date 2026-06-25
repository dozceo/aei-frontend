/**
 * Canonical risk tier mapping — ML ensemble is primary (Consolidation 1.2).
 * EWS tiers derive from the same dropout/mastery scores across student/teacher/parent.
 */
import type { PredictResponse, AttentionRisk } from './types';

export type EwsTier = 'tier1_critical' | 'tier2_at_risk' | 'tier3_monitoring' | 'none';

export interface CanonicalRisk {
  tier: EwsTier;
  overallRiskScore: number;
  dropoutProbability: number;
  masteryProbability: number;
  attentionRisk: AttentionRisk;
}

/** Map ensemble outputs → EWS tier (shared by all surfaces). */
export function ensembleToEwsTier(prediction: Pick<PredictResponse, 'mastery_probability' | 'dropout_probability' | 'attention_risk'>): CanonicalRisk {
  const mastery = prediction.mastery_probability ?? 0.5;
  const dropout = prediction.dropout_probability ?? 0;
  const inactivityProxy = Math.min((1 - mastery) * 0.5 + (prediction.attention_risk === 'critical' ? 0.3 : prediction.attention_risk === 'high' ? 0.2 : 0), 1);
  const overallRiskScore = (1 - mastery) * 0.4 + dropout * 0.4 + inactivityProxy * 0.2;

  let tier: EwsTier = 'none';
  if (overallRiskScore >= 0.5) tier = 'tier1_critical';
  else if (overallRiskScore >= 0.3) tier = 'tier2_at_risk';
  else if (overallRiskScore >= 0.15) tier = 'tier3_monitoring';

  return {
    tier,
    overallRiskScore,
    dropoutProbability: dropout,
    masteryProbability: mastery,
    attentionRisk: prediction.attention_risk,
  };
}

export function tierLabel(tier: EwsTier): string {
  switch (tier) {
    case 'tier1_critical': return 'Critical';
    case 'tier2_at_risk': return 'At risk';
    case 'tier3_monitoring': return 'Monitoring';
    default: return 'On track';
  }
}
