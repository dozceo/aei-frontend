import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MoatMetricsCard from '../MoatMetricsCard.jsx';

// Pure presentational component → server-render to HTML (no extra test deps).
describe('MoatMetricsCard', () => {
  it('renders the heading and em-dashes for missing metrics', () => {
    const html = renderToStaticMarkup(<MoatMetricsCard />);
    expect(html).toContain('Moat metrics');
    expect(html).toContain('—');
  });

  it('formats provided metrics', () => {
    const html = renderToStaticMarkup(
      <MoatMetricsCard metrics={{ masteryGainPct: 12, dau: 84, avertedRiskRate: 37 }} />,
    );
    expect(html).toContain('+12%');
    expect(html).toContain('84');
    expect(html).toContain('37%');
  });
});
