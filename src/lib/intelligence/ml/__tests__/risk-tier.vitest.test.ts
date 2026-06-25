import { describe, it, expect } from 'vitest';
import { ensembleToEwsTier, tierLabel } from '../risk-tier';

const p = (mastery: number, dropout: number, attention: string) =>
  ({ mastery_probability: mastery, dropout_probability: dropout, attention_risk: attention } as any);

describe('ensembleToEwsTier (canonical risk, 1.2)', () => {
  it('high dropout + low mastery → tier1_critical', () => {
    const r = ensembleToEwsTier(p(0.1, 0.9, 'critical'));
    expect(r.tier).toBe('tier1_critical');
    expect(r.overallRiskScore).toBeGreaterThanOrEqual(0.5);
  });

  it('mid risk → tier2_at_risk', () => {
    expect(ensembleToEwsTier(p(0.6, 0.3, 'medium')).tier).toBe('tier2_at_risk');
  });

  it('healthy learner → none', () => {
    expect(ensembleToEwsTier(p(0.9, 0.05, 'low')).tier).toBe('none');
  });

  it('defaults mastery to 0.5 when missing', () => {
    const r = ensembleToEwsTier({ dropout_probability: 0, attention_risk: 'low' } as any);
    expect(r.masteryProbability).toBe(0.5);
  });

  it('tierLabel maps every tier', () => {
    expect(tierLabel('tier1_critical')).toBe('Critical');
    expect(tierLabel('none')).toBe('On track');
  });
});
