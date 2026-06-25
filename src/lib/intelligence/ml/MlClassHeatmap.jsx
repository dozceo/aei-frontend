/**
 * MlClassHeatmap - teacher class view (patent Module 107): risk-tier summary +
 * an anonymous per-learner heatmap grid driven by ensemble predictions.
 *
 * Anonymous: cells are keyed by learnerId but labelled by an index, never a name
 * (DPDP). Mobile-first (wraps at 360px), WCAG-AA (semantic, ARIA, >=44px taps),
 * Tailwind-only, navy/cyan. Tapping a cell raises onSelect(learnerId).
 *
 * Props: predictions: LearnerPrediction[], summary: ClassSummary|null,
 *        loading: bool, labelFor?: (learnerId, index) => string, onSelect?: fn
 */
import { tierFor } from './class-metrics';
import { categoryLabel } from './decision-engine';

const TIER_CELL = {
  critical: 'bg-red-500/80 hover:bg-red-500 text-white',
  at_risk: 'bg-amber-400/80 hover:bg-amber-400 text-black',
  on_track: 'bg-emerald-400/70 hover:bg-emerald-400 text-black',
};
const TIER_LABEL = { critical: 'Critical', at_risk: 'At risk', on_track: 'On track' };

function StatPill({ value, label, tone }) {
  return (
    <div className="rounded-xl px-3 py-2 text-center min-w-0 bg-white/5">
      <div className={`text-lg font-bold leading-none ${tone}`}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-1 truncate">{label}</div>
    </div>
  );
}

export default function MlClassHeatmap({ predictions = [], summary = null, loading = false, labelFor, onSelect }) {
  return (
    <section aria-label="Class risk heatmap" aria-busy={loading ? 'true' : 'false'} className="rounded-2xl bg-[#0F1419] text-gray-100 p-4 sm:p-5 ring-1 ring-white/10 w-full min-w-0">
      <header className="flex items-center justify-between gap-2 mb-3 min-w-0">
        <h3 className="font-bold text-sm sm:text-base truncate">Class intelligence</h3>
        <span className="text-xs text-gray-500 shrink-0">{loading ? 'Updating…' : `${predictions.length} learners`}</span>
      </header>

      {summary && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatPill value={summary.tierCounts.critical} label="Critical" tone="text-red-400" />
          <StatPill value={summary.tierCounts.at_risk} label="At risk" tone="text-amber-300" />
          <StatPill value={`${Math.round(summary.averageMastery * 100)}%`} label="Avg mastery" tone="text-[#00D9FF]" />
        </div>
      )}

      {predictions.length === 0 ? (
        <p className="text-sm text-gray-400">{loading ? 'Scoring the class…' : 'No learner data yet.'}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Learners by risk">
            {predictions.map((p, i) => {
              const tier = tierFor(p);
              const name = labelFor ? labelFor(p.learnerId, i) : `#${i + 1}`;
              return (
                <button
                  key={p.learnerId}
                  type="button"
                  role="listitem"
                  onClick={() => onSelect?.(p.learnerId)}
                  title={`${name}: ${TIER_LABEL[tier]} · mastery ${Math.round(p.masteryProbability * 100)}% · ${categoryLabel(p.decision.category)}`}
                  aria-label={`${name}, ${TIER_LABEL[tier]}, mastery ${Math.round(p.masteryProbability * 100)} percent`}
                  className={`min-h-[44px] min-w-[44px] rounded-lg text-[11px] font-bold flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D9FF] ${TIER_CELL[tier]}`}
                >
                  {Math.round(p.masteryProbability * 100)}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-400">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />Critical</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />At risk</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" />On track</span>
          </div>
        </>
      )}
    </section>
  );
}
