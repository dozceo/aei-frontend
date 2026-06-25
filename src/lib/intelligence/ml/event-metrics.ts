/**
 * Pure aggregation over the learning event stream (Module 101 event bus, Wave E).
 * Deterministic, no I/O — unit-testable. Consumed by the per-session features
 * (F18 quiz completion, F22 time-of-day, …).
 */

export interface LearningEvent {
  type?: string;
  ts?: string; // ISO
  payload?: { tabId?: string; [k: string]: unknown };
}

export interface EventSummary {
  quizStarted: number;
  quizCompleted: number;
  completionRate: number | null; // completed / started (F18); null when none started
  hourHistogram: number[]; // 24 buckets of local-hour activity (F22)
  peakHour: number | null; // hour 0..23 with the most events
  total: number;
  // Feature-usage signals (Interactive Learning + Pilot/Brain), Wave-F telemetry.
  guideOpens: number; // interactive-guide opens (help-seeking)
  tabOpens: number; // dashboard tab switches
  queryOpens: number; // Q&A / Questions tab opens (chat proxy)
  clarifyAnswered: number; // slip-vs-misconception reflections completed
  distinctTabs: number; // distinct tabs visited (breadth)
  dailyCounts: Record<string, number>; // YYYY-MM-DD (local) → event count
}

/** Local calendar day key (matches engagement-adapter's localDayKey). */
function dayKey(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function summariseEvents(events: LearningEvent[]): EventSummary {
  const list = events ?? [];
  let started = 0;
  let completed = 0;
  let guideOpens = 0;
  let tabOpens = 0;
  let queryOpens = 0;
  let clarifyAnswered = 0;
  const hist = new Array(24).fill(0);
  const tabSet = new Set<string>();
  const dailyCounts: Record<string, number> = {};
  for (const e of list) {
    switch (e?.type) {
      case 'quiz_started': started += 1; break;
      case 'quiz_completed': completed += 1; break;
      case 'guide_open': guideOpens += 1; break;
      case 'clarify_answered': clarifyAnswered += 1; break;
      case 'tab_open': {
        tabOpens += 1;
        const tabId = e?.payload?.tabId;
        if (typeof tabId === 'string') {
          tabSet.add(tabId);
          if (tabId === 'query') queryOpens += 1;
        }
        break;
      }
      default: break;
    }
    if (e?.ts) {
      const d = new Date(e.ts);
      if (!Number.isNaN(d.getTime())) {
        hist[d.getHours()] += 1;
        const k = dayKey(d);
        dailyCounts[k] = (dailyCounts[k] ?? 0) + 1;
      }
    }
  }
  const anyHour = hist.some((x) => x > 0);
  return {
    quizStarted: started,
    quizCompleted: completed,
    completionRate: started > 0 ? Math.min(1, completed / started) : null,
    hourHistogram: hist,
    peakHour: anyHour ? hist.indexOf(Math.max(...hist)) : null,
    total: list.length,
    guideOpens,
    tabOpens,
    queryOpens,
    clarifyAnswered,
    distinctTabs: tabSet.size,
    dailyCounts,
  };
}

/**
 * Participation slope — a normalized first-half→second-half trend over a series
 * of per-day activity counts, in [-1, 1] (negative = declining participation).
 * Accepts a daily-count map (YYYY-MM-DD → n, sorted by date) or a raw series.
 * Mirrors the trendFromScores pattern but works on raw counts (not 0..1 scores).
 */
export function participationSlope(input: Record<string, number> | number[]): number {
  const series = Array.isArray(input)
    ? input.filter((n) => Number.isFinite(n))
    : Object.keys(input)
        .sort()
        .map((k) => input[k])
        .filter((n) => Number.isFinite(n));
  if (series.length < 2) return 0;
  const mid = Math.floor(series.length / 2);
  const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const first = mean(series.slice(0, mid || 1));
  const second = mean(series.slice(mid));
  const denom = first + second;
  if (denom <= 0) return 0;
  const slope = (second - first) / denom; // ∈ [-1, 1]
  return slope < -1 ? -1 : slope > 1 ? 1 : slope;
}
