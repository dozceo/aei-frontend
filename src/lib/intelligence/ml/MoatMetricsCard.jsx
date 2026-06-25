/** Moat metrics tile — observable North Star + loop KPIs (Phase M). */
export default function MoatMetricsCard({ metrics = {} }) {
  const {
    masteryGainPct = null,
    dau = null,
    avertedRiskRate = null,
    teacherActionRate = null,
    selfResolvedPct = null,
  } = metrics;

  const items = [
    { label: 'Mastery gain (30d)', value: masteryGainPct != null ? `+${masteryGainPct}%` : '—', accent: true },
    { label: 'Daily active learners', value: dau ?? '—', accent: true },
    { label: 'Averted-risk rate', value: avertedRiskRate != null ? `${avertedRiskRate}%` : '—' },
    { label: 'Teacher action on flags', value: teacherActionRate != null ? `${teacherActionRate}%` : '—' },
    { label: 'Dips self-resolved', value: selfResolvedPct != null ? `${selfResolvedPct}%` : '—' },
  ];

  return (
    <div className="neu-card p-4 sm:p-5">
      <h3 className="font-serif-brand font-bold text-lg mb-3">Moat metrics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
        {items.map((it, idx) => (
          <div key={it.label} className="neu-inset rounded-xl p-3 min-w-0" style={{ '--i': idx }}>
            <div className="text-[10px] font-mono-brand uppercase tracking-widest text-gray-500 truncate">{it.label}</div>
            <div className={`nums text-xl font-serif-brand font-bold mt-1 ${it.accent ? 'text-[var(--color-sage-deep)]' : ''}`}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
