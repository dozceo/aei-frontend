/**
 * ANPS engine — pure computation, no I/O.
 * Ported from ANPS+DUMP/services/anps/ (TypeScript → plain JS, types stripped).
 */

// ── Prioritizer ────────────────────────────────────────────────────────────

const W = {
  masteryGap:               0.35,
  urgency:                  0.25,
  prerequisiteCriticality:  0.15,
  forgettingRisk:           0.15,
  recentExposure:           0.10,
};

const URGENCY_NORMALIZATION_DAYS = 30;

function urgencyLabelToSignal(u) {
  return { critical: 1.0, high: 0.75, medium: 0.4, low: 0.1 }[u] ?? 0.1;
}

function recentExposureDecay(lastAssessedAt, horizon = URGENCY_NORMALIZATION_DAYS) {
  const ageDays = (Date.now() - new Date(lastAssessedAt).getTime()) / 86_400_000;
  return Math.max(0, 1 - ageDays / horizon);
}

export function prioritizeConcepts(topicMasteryMap, revisionUrgencyMap, prerequisiteDepths = {}, mlHints = null, mlPrediction = null) {
  const depthValues = Object.values(prerequisiteDepths);
  const maxDepth = depthValues.length ? Math.max(...depthValues, 1) : 1;

  const concepts = Object.keys(topicMasteryMap).map((topicId) => {
    const mastery = topicMasteryMap[topicId];
    const urgency = revisionUrgencyMap[topicId];
    const masteryGap = 1 - mastery.mastery;
    const urgencySignal = urgency ? urgencyLabelToSignal(urgency.urgency) : 0.2;
    const prerequisiteCriticality = (prerequisiteDepths[topicId] ?? 0) / maxDepth;
    const forgettingRisk = 1 - mastery.retentionStrength;
    const recentExposure = recentExposureDecay(mastery.lastAssessedAt);
    let priorityScore =
      W.masteryGap * masteryGap +
      W.urgency * urgencySignal +
      W.prerequisiteCriticality * prerequisiteCriticality +
      W.forgettingRisk * forgettingRisk -
      W.recentExposure * recentExposure;

    // Phase 3 — ML-informed re-ranking (no-op when hints absent).
    if (mlHints && mlPrediction) {
      if (mlHints.reviewBias > 0) priorityScore += mlHints.reviewBias * forgettingRisk * 0.4;
      if (mlHints.urgencyBoost > 0) priorityScore += mlHints.urgencyBoost * masteryGap * 0.35;
      if (mlHints.newTopicPenalty > 0 && masteryGap < 0.25) {
        priorityScore -= mlHints.newTopicPenalty * 0.2;
      }
      if (mlPrediction.forgettingDays <= 3 && forgettingRisk > 0.3) {
        priorityScore += 0.12;
      }
    }

    return {
      topicId,
      priorityScore: Math.min(1, Math.max(0, priorityScore)),
      masteryGap,
      urgencySignal,
      forgettingRisk,
      recentExposureDecay: recentExposure,
    };
  });

  concepts.sort((a, b) => b.priorityScore - a.priorityScore);
  return concepts;
}

// ── Spacing ────────────────────────────────────────────────────────────────

const RETENTION_THRESHOLD = 0.7;
const BASE_STABILITY_DAYS = 10;
const ATTEMPT_FACTOR = 0.1;

function computeStability(mastery, attempts, difficulty = 1.0) {
  const d = Math.min(2.0, Math.max(0.5, difficulty));
  return (BASE_STABILITY_DAYS * mastery * (1 + attempts * ATTEMPT_FACTOR)) / d;
}

function estimateRetention(lastAssessedAt, stabilityDays) {
  const ageDays = (Date.now() - new Date(lastAssessedAt).getTime()) / 86_400_000;
  if (stabilityDays <= 0) return 0;
  return Math.exp(-ageDays / stabilityDays);
}

function computeNextReviewInterval(tm, difficulty = 1.0) {
  const S = computeStability(tm.mastery, tm.attempts, difficulty);
  const currentRetention = estimateRetention(tm.lastAssessedAt, S);
  const optimalIntervalDays = S > 0 ? -S * Math.log(RETENTION_THRESHOLD) : 1;
  const ageDays = (Date.now() - new Date(tm.lastAssessedAt).getTime()) / 86_400_000;
  const daysUntilNextReview = Math.max(1, Math.ceil(optimalIntervalDays - ageDays));
  const reviewDate = new Date(Date.now() + daysUntilNextReview * 86_400_000).toISOString();
  return {
    topicId: tm.topicId,
    daysUntilNextReview,
    reviewDate,
    currentRetention,
    isDue: currentRetention < RETENTION_THRESHOLD,
  };
}

export function computeAllReviewIntervals(topicMasteryMap, difficultyMap = {}) {
  const intervals = Object.values(topicMasteryMap).map((tm) =>
    computeNextReviewInterval(tm, difficultyMap[tm.topicId] ?? 1.0),
  );
  intervals.sort((a, b) => {
    if (a.isDue !== b.isDue) return a.isDue ? -1 : 1;
    return a.daysUntilNextReview - b.daysUntilNextReview;
  });
  return intervals;
}

// ── Generator ──────────────────────────────────────────────────────────────

const DEFAULT_PARAMS = {
  dailyBudgetMinutes: 60,
  maxNewTopicsPerDay: 2,
  maxReviewTopicsPerDay: 5,
};

const TASK_DURATIONS = { review: 8, new_learning: 15, challenge: 12, practice: 10 };

/** Cap task type by ML difficulty hint. */
function capTaskType(taskType, cap) {
  if (!cap || cap === 'normal') return taskType;
  if (cap === 'easy') return taskType === 'challenge' ? 'practice' : (taskType === 'new_learning' ? 'review' : taskType);
  if (cap === 'medium' && taskType === 'challenge') return 'new_learning';
  return taskType;
}

function taskDuration(taskType, p) {
  const base = TASK_DURATIONS[taskType] || 10;
  const mlMin = typeof p.mlSessionLengthMin === 'number' ? p.mlSessionLengthMin : null;
  if (mlMin && (taskType === 'review' || taskType === 'practice')) return Math.min(base, mlMin);
  if (mlMin && taskType === 'new_learning') return Math.max(mlMin, Math.min(base, mlMin + 3));
  return base;
}

export function generateDailyPlan(date, dueIntervals, prioritized, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const mlCap = p.mlDifficultyCap || 'normal';
  const tasks = [];
  let minutesUsed = 0;

  for (const interval of dueIntervals.filter((i) => i.isDue).slice(0, p.maxReviewTopicsPerDay)) {
    const dur = taskDuration('review', p);
    if (minutesUsed + dur > p.dailyBudgetMinutes) break;
    tasks.push({
      topicId: interval.topicId,
      taskType: 'review',
      durationMinutes: dur,
      rationale: `Retention ${(interval.currentRetention * 100).toFixed(0)}% — due`,
      reason: p.mlPreferReview ? 'Spaced review — retention is fading on this topic.' : undefined,
      priority: 1 - interval.currentRetention,
      source: p.mlAdjusted ? 'ml_planner' : 'anps',
      actionType: 'spaced_review',
      mlAdjusted: !!p.mlAdjusted,
    });
    minutesUsed += dur;
  }

  const seen = new Set(tasks.map((t) => t.topicId));
  let newCount = 0;
  for (const concept of prioritized) {
    if (newCount >= p.maxNewTopicsPerDay) break;
    if (seen.has(concept.topicId)) continue;
    let taskType = concept.masteryGap < 0.1 ? 'challenge' : 'new_learning';
    taskType = capTaskType(taskType, mlCap);
    const dur = taskDuration(taskType, p);
    if (minutesUsed + dur > p.dailyBudgetMinutes) break;
    tasks.push({
      topicId: concept.topicId,
      taskType,
      durationMinutes: dur,
      rationale: `Priority ${concept.priorityScore.toFixed(2)} — gap ${(concept.masteryGap * 100).toFixed(0)}%`,
      reason: p.mlAdjusted ? 'Chosen because mastery is still building here.' : undefined,
      priority: concept.priorityScore,
      source: p.mlAdjusted ? 'ml_planner' : 'anps',
      actionType: taskType === 'challenge' ? 'challenge' : 'retrieval_practice',
      mlAdjusted: !!p.mlAdjusted,
    });
    minutesUsed += dur;
    newCount++;
    seen.add(concept.topicId);
  }

  // Re-engagement nudge: participation declining OR ML quick-win signal.
  const slope = typeof p.participationSlope === 'number' ? p.participationSlope : 0;
  const needQuickWin = p.mlRequireQuickWin || slope <= -0.15;
  if (needQuickWin && prioritized.length) {
    const easy = [...prioritized].sort((a, b) => a.masteryGap - b.masteryGap)[0];
    const dur = taskDuration('practice', p);
    if (easy && !seen.has(easy.topicId) && minutesUsed + dur <= p.dailyBudgetMinutes) {
      tasks.push({
        topicId: easy.topicId,
        taskType: 'practice',
        durationMinutes: dur,
        rationale: p.mlRequireQuickWin
          ? 'Quick win — today\'s plan stays manageable'
          : 'Easy win to rebuild momentum — your activity dipped recently',
        reason: 'A quick win to rebuild momentum when focus is limited.',
        priority: 1,
        easyWin: true,
        source: 'ml_planner',
        actionType: 'quick_win',
        mlAdjusted: !!p.mlAdjusted,
      });
      minutesUsed += dur;
      seen.add(easy.topicId);
    }
  }

  // Low-confidence diagnostic: one short quiz-style task when ML is uncertain.
  if (p.mlLowConfidence && prioritized.length && minutesUsed + 8 <= p.dailyBudgetMinutes) {
    const target = prioritized.find((c) => !seen.has(c.topicId)) || prioritized[0];
    if (target && !seen.has(target.topicId)) {
      tasks.push({
        topicId: target.topicId,
        taskType: 'practice',
        durationMinutes: 8,
        rationale: 'Short check — helps sharpen your estimate',
        reason: 'A short confidence check helps the planner learn what you know.',
        priority: 0.9,
        source: 'ml_planner',
        actionType: 'diagnostic',
        mlAdjusted: true,
      });
      minutesUsed += 8;
    }
  }

  tasks.sort((a, b) => {
    if (a.easyWin && !b.easyWin) return -1;
    if (b.easyWin && !a.easyWin) return 1;
    if (a.taskType === 'review' && b.taskType !== 'review') return -1;
    if (b.taskType === 'review' && a.taskType !== 'review') return 1;
    return b.priority - a.priority;
  });

  return { date, totalMinutes: minutesUsed, tasks };
}

export function generateWeeklyPlan(weekStartDate, dueIntervals, prioritized, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const reviewPool = [...dueIntervals];
  const learnPool = [...prioritized];
  const weekStart = new Date(weekStartDate);
  const dailyPlans = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayReviews = reviewPool.splice(0, p.maxReviewTopicsPerDay);
    const dayLearn = learnPool.slice(i * p.maxNewTopicsPerDay, (i + 1) * p.maxNewTopicsPerDay);
    dailyPlans.push(generateDailyPlan(dateStr, dayReviews, dayLearn, p));
  }

  return {
    weekStart: weekStartDate,
    dailyPlans,
    focusTopics: prioritized.filter((c) => c.masteryGap > 0.3).slice(0, 5).map((c) => c.topicId),
    reviewTopics: dueIntervals.filter((i) => i.isDue).map((i) => i.topicId),
  };
}

// ── Full run ───────────────────────────────────────────────────────────────

export function runANPS(topicMasteryMap, revisionUrgencyMap, config = {}) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
  const weekStartStr = monday.toISOString().slice(0, 10);

  const mlHints = config.plannerHints ?? null;
  const mlPrediction = config.mlPrediction ?? null;

  const prioritizedConcepts = prioritizeConcepts(
    topicMasteryMap, revisionUrgencyMap, config.prerequisiteDepths ?? {}, mlHints, mlPrediction,
  );
  const spacingIntervals = computeAllReviewIntervals(topicMasteryMap, config.difficultyMap ?? {});

  const planParams = {
    ...(config.planParams || {}),
    participationSlope: config.participationSlope,
    mlAdjusted: !!mlHints,
    mlLowConfidence: mlPrediction?.lowConfidence ?? false,
  };

  const dailyPlan = generateDailyPlan(todayStr, spacingIntervals, prioritizedConcepts, planParams);
  const weeklyPlan = generateWeeklyPlan(weekStartStr, spacingIntervals, prioritizedConcepts, config.planParams);

  return {
    prioritizedConcepts,
    spacingIntervals,
    dailyPlan,
    weeklyPlan,
    computedAt: now.toISOString(),
    mlAdjusted: !!mlHints,
    plannerHints: mlHints,
    mlDecision: config.mlDecision ?? mlPrediction?.decision ?? null,
  };
}
