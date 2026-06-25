/**
 * MlInsightCard — surfaces one learner's ensemble prediction (Module 107).
 *
 * Shows: ability estimate (mastery probability) with confidence band, the
 * adaptive decision category + its reasoning, forgetting horizon, and attention
 * risk. Confidence-aware: a wide CI renders "Estimating…" instead of a hard
 * number (patent Module 103 — uncertainty-aware UI).
 *
 * Mobile-first (holds at 360px), WCAG 2.1 AA (semantic, ARIA, ≥44px targets),
 * Tailwind-only, navy #0F1419 / cyan #00D9FF per the design system. No PII.
 *
 * Props:
 *   prediction  LearnerPrediction | null
 *   loading     boolean
 *   onRefresh   () => void        (optional)
 *   compact     boolean           (optional — hides reasoning list)
 */
import { categoryLabel } from './decision-engine';

const CATEGORY_STYLES = {
  urgent_review: { dot: 'bg-red-500', text: 'text-red-300', ring: 'ring-red-500/40' },
  spaced_revision: { dot: 'bg-amber-400', text: 'text-amber-300', ring: 'ring-amber-400/40' },
  challenge_next: { dot: 'bg-cyan-400', text: 'text-cyan-300', ring: 'ring-cyan-400/40' },
  continuation: { dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'ring-emerald-400/40' },
};

const RISK_LABEL = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };

function pct(n) {
  return `${Math.round((n ?? 0) * 100)}%`;
}

export default function MlInsightCard({ prediction, loading = false, onRefresh, compact = false }) {
  const cat = prediction?.decision?.category ?? 'continuation';
  const style = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.continuation;

  return (
    <section
      aria-label="AI learning insight"
      aria-busy={loading ? 'true' : 'false'}
      className={`rounded-2xl bg-[#0F1419] text-gray-100 p-4 sm:p-5 ring-1 ${style.ring} shadow-lg w-full min-w-0`}
    >
      <header className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot} shrink-0`} aria-hidden="true" />
          <h3 className="font-bold text-sm sm:text-base truncate">AI insight</h3>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-xs text-cyan-300 hover:text-cyan-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF]"
            aria-label="Refresh insight"
          >
            ↻
          </button>
        )}
      </header>

      {loading && !prediction ? (
        <p className="mt-3 text-sm text-gray-400" role="status">
          Analysing your learning signals…
        </p>
      ) : !prediction ? (
        <p className="mt-3 text-sm text-gray-400">No insight yet.</p>
      ) : (
        <div className="mt-3 space-y-4">
          {/* Ability estimate + confidence band */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400">Ability estimate</span>
              {prediction.source === 'client-fallback' ? (
                /* A6 — make the degraded (circuit-open / offline) estimate visible rather
                   than a silent gray label, so users know it's a coarser number. */
                <span
                  className="text-xs text-amber-300 inline-flex items-center gap-1"
                  title="The AI service is unreachable — showing a coarser offline estimate."
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                  Offline estimate
                </span>
              ) : (
                <span className="text-xs text-gray-500">
                  {prediction.source === 'ensemble' ? 'Ensemble' : 'Heuristic'}
                </span>
              )}
            </div>
            {prediction.lowConfidence ? (
              <p className="mt-1 text-2xl font-bold text-cyan-300">
                Estimating…
                <span className="block text-xs font-normal text-gray-400 mt-0.5">
                  Around {pct(prediction.masteryProbability)} — more practice sharpens this.
                </span>
              </p>
            ) : (
              <p className="mt-1 text-3xl font-bold text-[#00D9FF] tabular-nums">
                {pct(prediction.masteryProbability)}
                <span className="ml-2 text-xs font-normal text-gray-400 align-middle">
                  ({pct(prediction.confidence.lower)}–{pct(prediction.confidence.upper)})
                </span>
              </p>
            )}
          </div>

          {/* Decision chip */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold ${style.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
              {categoryLabel(cat)}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-300">
              Attention: {RISK_LABEL[prediction.attentionRisk] ?? prediction.attentionRisk}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1.5 text-xs text-gray-300">
              Review in ~{Math.round(prediction.forgettingDays)}d
            </span>
          </div>

          {/* Reasoning (explainability) */}
          {!compact && prediction.decision.reasoning?.length > 0 && (
            <ul className="space-y-1.5 border-t border-white/10 pt-3">
              {prediction.decision.reasoning.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-300 break-words">
                  <span className="text-cyan-400 shrink-0" aria-hidden="true">
                    •
                  </span>
                  <span className="min-w-0">{r}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
