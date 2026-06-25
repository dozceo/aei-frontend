/**
 * EWS logic for student engagement (attention state).
 */

/**
 * Computes attentionState from resource views, quiz attempts, and brain dumps.
 */
export function computeAttentionState(summary, attempts, dumps) {
  // sessionFrequency = distinct active days in last 14 d (from dailyMs + attempt/dump dates)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  const activeDays = new Set();
  
  if (summary?.dailyMs) {
    for (const [dateStr, ms] of Object.entries(summary.dailyMs)) {
      if (ms > 0 && (now - new Date(dateStr).getTime()) <= 14 * dayMs) {
        activeDays.add(dateStr);
      }
    }
  }
  
  for (const a of attempts) {
    if (a.completedAt && (now - new Date(a.completedAt).getTime()) <= 14 * dayMs) {
      activeDays.add(a.completedAt.slice(0, 10));
    }
  }
  
  for (const d of dumps) {
    if (d.generatedAt && (now - new Date(d.generatedAt).getTime()) <= 14 * dayMs) {
      activeDays.add(d.generatedAt.slice(0, 10));
    }
  }
  
  const sessionFrequency = activeDays.size;
  
  // engagementTrend = compare dailyMs minutes last 7 d vs prior 7 d
  let current7dMs = 0;
  let prior7dMs = 0;
  
  if (summary?.dailyMs) {
    for (const [dateStr, ms] of Object.entries(summary.dailyMs)) {
      const diffMs = now - new Date(dateStr).getTime();
      if (diffMs <= 7 * dayMs) current7dMs += ms;
      else if (diffMs <= 14 * dayMs) prior7dMs += ms;
    }
  }
  
  let engagementTrend = 'stable';
  if (prior7dMs > 0) {
    const ratio = current7dMs / prior7dMs;
    if (ratio > 1.25) engagementTrend = 'improving';
    else if (ratio < 0.75) engagementTrend = 'declining';
  } else if (current7dMs > 0) {
    engagementTrend = 'improving'; // Going from 0 to something
  }
  
  // dropoutProbability heuristic: 
  // 1. Inactivity (days since last active) -> heavily weighted
  // 2. Declining trend -> moderately weighted
  // 3. Near-zero recent minutes -> moderately weighted
  
  let daysInactive = 14; // Default cap
  let lastActiveTs = 0;
  
  if (summary?.lastViewAt) lastActiveTs = Math.max(lastActiveTs, new Date(summary.lastViewAt).getTime());
  for (const a of attempts) if (a.completedAt) lastActiveTs = Math.max(lastActiveTs, new Date(a.completedAt).getTime());
  for (const d of dumps) if (d.generatedAt) lastActiveTs = Math.max(lastActiveTs, new Date(d.generatedAt).getTime());
  
  if (lastActiveTs > 0) {
    daysInactive = (now - lastActiveTs) / dayMs;
  }
  
  let dropoutProb = 0;
  
  // Weight 1: Inactivity (up to 0.4)
  const inactivityFactor = Math.min(14, daysInactive) / 14; 
  dropoutProb += inactivityFactor * 0.4;
  
  // Weight 2: Trend (up to 0.2)
  if (engagementTrend === 'declining') dropoutProb += 0.2;
  else if (engagementTrend === 'stable') dropoutProb += 0.1;
  
  // Weight 3: Low absolute minutes in last 7 days (up to 0.2)
  // Assuming 60 mins/week is a baseline "okay" engagement
  const current7dMins = current7dMs / 60000;
  if (current7dMins < 10) dropoutProb += 0.2;
  else if (current7dMins < 30) dropoutProb += 0.1;
  
  dropoutProb = Math.min(0.8, dropoutProb); // Cap at 0.8
  
  let riskClass = 'low';
  if (dropoutProb > 0.6) riskClass = 'high';
  else if (dropoutProb > 0.3) riskClass = 'medium';

  return {
    riskClass,
    dropoutProbability: dropoutProb,
    lastActiveAt: lastActiveTs > 0 ? new Date(lastActiveTs).toISOString() : null,
    sessionFrequency,
    engagementTrend
  };
}
