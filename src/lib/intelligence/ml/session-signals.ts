/**
 * Per-session cognitive/behavioral signals (Wave E) from quiz interaction timing.
 * Pure + deterministic — fed by PlanQuiz's per-question timing (latency, answer
 * changes, fast-wrong). Powers F26 (cognitive-load chip) and F37 (guessing).
 */

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

export type LoadLevel = 'low' | 'moderate' | 'high';

export interface SessionMetrics {
  avgLatencyMs?: number; // mean time-to-answer per question
  accuracy?: number; // 0..1 correct fraction
  changeRate?: number; // answer re-selections per question (indecision)
  fastWrongRate?: number; // fraction of questions answered fast AND wrong
}

/** F26 — cognitive load from slow responses, low accuracy, and indecision. */
export function cognitiveLoad(m: SessionMetrics = {}): { score: number; level: LoadLevel; label: string } {
  const lat = Math.min(1, Math.max(0, m.avgLatencyMs ?? 0) / 45_000); // 45s ⇒ very slow
  const score = clamp01(0.45 * lat + 0.4 * (1 - (m.accuracy ?? 1)) + 0.15 * Math.min(1, m.changeRate ?? 0));
  const level: LoadLevel = score >= 0.6 ? 'high' : score >= 0.35 ? 'moderate' : 'low';
  const label = level === 'high' ? 'High load' : level === 'moderate' ? 'Moderate load' : 'Light load';
  return { score, level, label };
}

/** F37 — guessing when many answers come fast AND wrong. */
export function isGuessing(m: SessionMetrics = {}): boolean {
  return (m.fastWrongRate ?? 0) >= 0.4;
}
