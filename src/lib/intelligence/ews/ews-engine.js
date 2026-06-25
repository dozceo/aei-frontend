/**
 * EWS Engine (Ported pure logic)
 */

export function stratifyStudent(state) {
  const topics = Object.values(state.topicMasteryMap);
  const avgMastery =
    topics.length > 0
      ? topics.reduce((sum, t) => sum + (t.mastery ?? 0.5), 0) / topics.length
      : 0.5;

  const dropoutProbability = state.attentionState?.dropoutProbability ?? 0.0;

  const lastActiveMs = state.lastActiveAt
    ? new Date(state.lastActiveAt).getTime()
    : Date.now();
  const daysSinceActive = (Date.now() - lastActiveMs) / 86_400_000;
  const inactivityFactor = Math.min(daysSinceActive / 7, 1.0);

  const overallRiskScore =
    (1 - avgMastery) * 0.4 + dropoutProbability * 0.4 + inactivityFactor * 0.2;

  let tier;
  let recommendedActions;

  if (overallRiskScore >= 0.5) {
    tier = "tier1_critical";
    recommendedActions = [{ priority: "immediate" }];
  } else if (overallRiskScore >= 0.3) {
    tier = "tier2_at_risk";
    recommendedActions = [{ priority: "high" }];
  } else if (overallRiskScore >= 0.15) {
    tier = "tier3_monitoring";
    recommendedActions = [{ priority: "medium" }];
  } else {
    tier = "none";
    recommendedActions = [];
  }

  return { learnerId: state.actorId, tier, overallRiskScore, recommendedActions };
}

const THRESHOLDS = {
  masteryCollapse: 0.3,
  dropoutRisk: 0.6,
  inactivityDays: 5,
  attentionRisk: 2,
  examUrgencyDays: 7,
  retentionCollapse: 0.4,
};

export function detectTrigger(learnerState) {
  const checks = [];

  const masteryValues = Object.values(learnerState.topicMasteryMap).map(
    (tm) => tm.mastery
  );
  const avgMastery = masteryValues.length
    ? masteryValues.reduce((s, v) => s + v, 0) / masteryValues.length
    : 0.5;

  if (avgMastery < THRESHOLDS.masteryCollapse) {
    checks.push({
      trigger: "mastery_collapse",
      score: 1 - avgMastery / THRESHOLDS.masteryCollapse,
    });
  }

  const dropoutRisk = learnerState.attentionState?.dropoutProbability ?? 0;
  if (dropoutRisk > THRESHOLDS.dropoutRisk) {
    checks.push({
      trigger: "high_attention_risk",
      score: dropoutRisk,
    });
  }

  const lastActiveDate = new Date(learnerState.lastActiveAt);
  const lastActiveMs = isNaN(lastActiveDate.getTime()) ? 0 : Date.now() - lastActiveDate.getTime();
  const inactiveDays = Math.max(0, lastActiveMs / 86_400_000);
  if (inactiveDays > THRESHOLDS.inactivityDays) {
    checks.push({
      trigger: "sustained_inactivity",
      score: Math.min(1, inactiveDays / 14),
    });
  }

  const urgencies = Object.values(learnerState.revisionUrgencyMap || {}).filter(
    (u) => u.urgency === "critical"
  );
  if (urgencies.length > 0) {
    const minDays = Math.min(
      ...urgencies.map((u) =>
        Math.max(
          0,
          (new Date(u.estimatedForgetDate).getTime() - Date.now()) / 86_400_000
        )
      )
    );
    if (minDays <= THRESHOLDS.examUrgencyDays) {
      checks.push({
        trigger: "exam_urgency",
        score: 1 - minDays / THRESHOLDS.examUrgencyDays,
      });
    }
  }

  if (
    learnerState.attentionState?.engagementTrend === "declining" &&
    dropoutRisk > 0.3
  ) {
    checks.push({ trigger: "motivational_decline", score: dropoutRisk });
  }

  const retentionValues = Object.values(learnerState.topicMasteryMap).map(
    (tm) => tm.retentionStrength ?? 1
  );
  const avgRetention = retentionValues.length
    ? retentionValues.reduce((s, v) => s + v, 0) / retentionValues.length
    : 1;
  if (avgRetention < THRESHOLDS.retentionCollapse) {
    checks.push({
      trigger: "repeated_topic_failure",
      score: 1 - avgRetention,
    });
  }

  const criticalFailures = Object.values(learnerState.topicMasteryMap).filter(
    (tm) => tm.topicId.startsWith("core_") && tm.mastery < 0.2
  );
  if (criticalFailures.length > 0) {
    checks.push({
      trigger: "repeated_topic_failure",
      score: 0.95,
    });
  }

  const allMasteries = Object.values(learnerState.topicMasteryMap);
  const activeStruggles = allMasteries.filter(tm => tm.struggleFlags && tm.struggleFlags.length > 0);
  const negativeTrajectories = allMasteries.filter(tm => tm.trajectorySlope !== undefined && tm.trajectorySlope < -0.1);

  if (activeStruggles.length > 0 || negativeTrajectories.length > 0) {
    const scoreBase = Math.min(1.0, (activeStruggles.length * 0.4) + (negativeTrajectories.length * 0.3));
    checks.push({
      trigger: "abnormal_behavioral_shift",
      score: Math.max(0.6, scoreBase),
    });
  }

  if (!checks.length) return { trigger: null, severityScore: 0 };

  checks.sort((a, b) => b.score - a.score);
  return { trigger: checks[0].trigger, severityScore: checks[0].score };
}

export function scoreToSeverity(score) {
  if (score >= 0.8) return "critical";
  if (score >= 0.6) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export const INTERVENTION_CATALOG = [
  {
    id: "ic_mastery_student_review",
    name: "Immediate Student Review Session",
    trigger: "mastery_collapse",
    target: "student",
    prescribedAction: "Schedule an emergency revision session on collapsed topics within 24 hours.",
    minSeverityScore: 0.3,
    durationDays: 3,
  },
  {
    id: "ic_mastery_teacher_alert",
    name: "Mastery Collapse Teacher Alert",
    trigger: "mastery_collapse",
    target: "teacher",
    prescribedAction: "Alert teacher: student mastery has critically collapsed. Recommend one-on-one tutoring.",
    minSeverityScore: 0.6,
    durationDays: 7,
  },
  {
    id: "ic_mastery_mentor_escalation",
    name: "Mentor Escalation for Persistent Mastery Failure",
    trigger: "mastery_collapse",
    target: "mentor",
    prescribedAction: "Escalate to mentor for academic intervention plan review.",
    minSeverityScore: 0.8,
    durationDays: 14,
  },
  {
    id: "ic_inactivity_push",
    name: "Inactivity Re-engagement Prompt",
    trigger: "sustained_inactivity",
    target: "student",
    prescribedAction: "Send personalized re-engagement message with a short 5-minute challenge.",
    minSeverityScore: 0.2,
    durationDays: 1,
  },
  {
    id: "ic_inactivity_teacher",
    name: "Sustained Inactivity Teacher Notification",
    trigger: "sustained_inactivity",
    target: "teacher",
    prescribedAction: "Notify teacher of 5+ day inactivity. Request welfare check.",
    minSeverityScore: 0.5,
    durationDays: 3,
  },
  {
    id: "ic_inactivity_parent",
    name: "Parent Notification for Extended Inactivity",
    trigger: "sustained_inactivity",
    target: "parent",
    prescribedAction: "Inform parent of 7+ day inactivity and provide study tips.",
    minSeverityScore: 0.7,
    durationDays: 7,
  },
  {
    id: "ic_attention_micro_break",
    name: "Micro-break Recommendation",
    trigger: "high_attention_risk",
    target: "student",
    prescribedAction: "Recommend a 10-minute break and lighter learning activity.",
    minSeverityScore: 0.3,
    durationDays: 1,
  },
  {
    id: "ic_attention_session_adjustment",
    name: "Session Length Adjustment",
    trigger: "high_attention_risk",
    target: "student",
    prescribedAction: "Reduce session length to 20 minutes with frequent breaks.",
    minSeverityScore: 0.5,
    durationDays: 3,
  },
  {
    id: "ic_attention_teacher_observation",
    name: "Teacher Attention Alert",
    trigger: "high_attention_risk",
    target: "teacher",
    prescribedAction: "Flag student for attention monitoring. Consider learning environment review.",
    minSeverityScore: 0.7,
    durationDays: 5,
  },
  {
    id: "ic_exam_cram_plan",
    name: "Emergency Exam Cram Plan",
    trigger: "exam_urgency",
    target: "student",
    prescribedAction: "Activate exam cram mode: prioritize weakest topics, daily 45-minute sessions.",
    minSeverityScore: 0.4,
    durationDays: 7,
  },
  {
    id: "ic_exam_teacher_alert",
    name: "Exam Unpreparedness Teacher Alert",
    trigger: "exam_urgency",
    target: "teacher",
    prescribedAction: "Alert teacher: student significantly under-prepared for upcoming exam.",
    minSeverityScore: 0.7,
    durationDays: 7,
  },
  {
    id: "ic_topic_failure_scaffold",
    name: "Scaffolded Re-teaching",
    trigger: "repeated_topic_failure",
    target: "student",
    prescribedAction: "Switch to scaffolded content: rebuild from prerequisites step by step.",
    minSeverityScore: 0.3,
    durationDays: 5,
  },
  {
    id: "ic_topic_failure_teacher",
    name: "Repeated Failure Teacher Review",
    trigger: "repeated_topic_failure",
    target: "teacher",
    prescribedAction: "Review topic: student has failed 3+ times. Consider alternative teaching approach.",
    minSeverityScore: 0.6,
    durationDays: 7,
  },
  {
    id: "ic_motivation_boost",
    name: "Motivational Support Sequence",
    trigger: "motivational_decline",
    target: "student",
    prescribedAction: "Deliver 3-day encouragement + achievement unlock sequence.",
    minSeverityScore: 0.3,
    durationDays: 3,
  },
  {
    id: "ic_motivation_mentor",
    name: "Mentor Motivational Check-in",
    trigger: "motivational_decline",
    target: "mentor",
    prescribedAction: "Schedule mentor check-in to address motivation and engagement.",
    minSeverityScore: 0.6,
    durationDays: 5,
  },
  {
    id: "ic_motivation_parent",
    name: "Parent Motivation Alert",
    trigger: "motivational_decline",
    target: "parent",
    prescribedAction: "Inform parent of motivational decline and provide home support guidance.",
    minSeverityScore: 0.7,
    durationDays: 7,
  },
  {
    id: "ic_behavioral_teacher",
    name: "Behavioral Shift Teacher Flag",
    trigger: "abnormal_behavioral_shift",
    target: "teacher",
    prescribedAction: "Flag significant behavioral change for teacher awareness and welfare check.",
    minSeverityScore: 0.5,
    durationDays: 3,
  },
  {
    id: "ic_behavioral_mentor",
    name: "Behavioral Shift Mentor Escalation",
    trigger: "abnormal_behavioral_shift",
    target: "mentor",
    prescribedAction: "Escalate to mentor: abnormal behavioral pattern detected. Review student wellbeing.",
    minSeverityScore: 0.7,
    durationDays: 5,
  },
  {
    id: "ic_behavioral_parent",
    name: "Behavioral Shift Parent Notification",
    trigger: "abnormal_behavioral_shift",
    target: "parent",
    prescribedAction: "Notify parent of significant behavioral change. Recommend family check-in.",
    minSeverityScore: 0.8,
    durationDays: 7,
  },
  {
    id: "ic_critical_full_escalation",
    name: "Full Multi-Actor Escalation",
    trigger: "mastery_collapse",
    target: "teacher",
    prescribedAction: "Critical: notify teacher, mentor, and parent. Immediate intervention required.",
    minSeverityScore: 0.9,
    durationDays: 14,
  },
];

export function findBestIntervention(trigger, severityScore) {
  const candidates = INTERVENTION_CATALOG.filter(
    (e) => e.trigger === trigger && severityScore >= e.minSeverityScore
  );

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.minSeverityScore - a.minSeverityScore);
  return candidates[0];
}

export function heatmapCells(topicMasteryMap) {
  const topics = {};
  for (const [topicId, mastery] of Object.entries(topicMasteryMap)) {
    const ciLower = mastery.ciLower ?? 0.0;
    const ciUpper = mastery.ciUpper ?? 1.0;
    const uncertainty = mastery.uncertainty ?? (ciUpper - ciLower);

    topics[topicId] = {
      topicId,
      masteryEstimate: mastery.mastery,
      ciLower,
      ciUpper,
      uncertainty,
      isStruggling: Array.isArray(mastery.struggleFlags) && mastery.struggleFlags.length > 0,
    };
  }
  return topics;
}

export function detectStruggleAlerts(learnerState) {
  const alertsToDispatch = [];

  for (const mastery of Object.values(learnerState.topicMasteryMap)) {
    const ciLower = mastery.ciLower ?? 0;
    const ciUpper = mastery.ciUpper ?? 1;
    const ciWidth = mastery.uncertainty ?? (ciUpper - ciLower);

    const hasDecliningMasteryFlag = mastery.struggleFlags?.includes("declining_mastery");
    const isConfidentFailure = ciUpper < 0.4;
    const isConfused = (mastery.trajectorySlope ?? 0) < -0.1 && ciWidth > 0.3;

    if (hasDecliningMasteryFlag || isConfidentFailure || isConfused) {
      let kind = hasDecliningMasteryFlag ? "declining_mastery" : (isConfused ? "confused" : "confident_failure");
      let message = `Early struggle detected in topic ${mastery.topicId}. Bayesian CI width is ${ciWidth.toFixed(2)}, indicating ${ciWidth > 0.3 ? 'high confusion' : 'confident knowledge gap'}.`;

      alertsToDispatch.push({
        topicId: mastery.topicId,
        kind,
        ciWidth,
        message
      });
    }
  }

  return alertsToDispatch;
}
