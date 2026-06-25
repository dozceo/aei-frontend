import { describe, it, expect } from 'vitest';
import { computeTopDrivers } from '../decision-engine';

// esbuild strips types without type-checking, so minimal prediction stubs are fine.
const pred = (mastery: number, dropout: number) =>
  ({ mastery_probability: mastery, dropout_probability: dropout } as any);

describe('computeTopDrivers (M2 explainability)', () => {
  it('returns at most n drivers, highest-scoring first', () => {
    const drivers = computeTopDrivers(
      pred(0.3, 0.8),
      { days_since_last_interaction: 10, dropoff_rate: 0.5, recent_score_avg: 0.1, streak_days: 0 },
      3,
    );
    expect(drivers.length).toBeLessThanOrEqual(3);
    expect(drivers[0]).toMatch(/Dropout risk/);
  });

  it('surfaces a no-study-loop driver when days are stale', () => {
    const drivers = computeTopDrivers(pred(0.4, 0.1), { days_since_last_interaction: 9 }, 3);
    expect(drivers.some((d) => /No study loop in 9d/.test(d))).toBe(true);
  });

  it('returns no drivers for a healthy learner', () => {
    const drivers = computeTopDrivers(pred(0.9, 0.05), { days_since_last_interaction: 0, streak_days: 5 }, 3);
    expect(drivers.length).toBe(0);
  });
});
