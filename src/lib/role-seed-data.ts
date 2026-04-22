import type {
  ParentDashboardDoc,
  ParentInboxDoc,
  TeacherDashboardDoc,
  TeacherInterventionsDoc,
} from "@/lib/role-content";

const teacherNav = [
  { href: "/teacher/dashboard", label: "Dashboard" },
  { href: "/teacher/interventions", label: "Interventions" },
  { href: "/onboarding", label: "Role Setup" },
  { href: "/", label: "Home" },
];

const parentNav = [
  { href: "/parent/dashboard", label: "Dashboard" },
  { href: "/parent/inbox", label: "Inbox" },
  { href: "/onboarding", label: "Role Setup" },
  { href: "/", label: "Home" },
];

const sharedBrand = "SANKALP AEI";

export const teacherSeedPages: {
  dashboard: TeacherDashboardDoc;
  interventions: TeacherInterventionsDoc;
} = {
  dashboard: {
    brandLabel: sharedBrand,
    navItems: teacherNav,
    hero: {
      eyebrow: "Teacher Operations",
      title: "Class health and intervention orchestration",
      subtitle:
        "Teacher operations view for trend monitoring, risk routing, and actionable learner diagnostics.",
      actionLabel: "Open Queue",
      actionHref: "/teacher/interventions",
    },
    sections: {
      snapshotTitle: "Class Performance Snapshot",
      snapshotSubtitle: "Grade 10 AP Calculus",
      riskTitle: "At-Risk Learners",
      riskSubtitle: "Prioritized by confidence decline",
      actionsTitle: "Recommended Actions",
      actionsSubtitle: "AI-ranked for next 24 hours",
      noticesTitle: "Live Notices",
      noticesSubtitle: "Broadcast and policy notes",
    },
    classSnapshot: [
      { label: "Average Mastery", value: 68, hint: "+3% week over week" },
      { label: "Engagement", value: 74, hint: "Focus streak improved in 19 learners" },
      { label: "Needs Support", value: 32, hint: "8 students need intervention", tone: "warning" },
    ],
    atRiskLearners: [
      {
        id: "INT-2401",
        learner: "Priya Kumar",
        concept: "Logarithmic Transformation",
        trend: "Declining confidence in 3 sessions",
        severity: "critical",
      },
      {
        id: "INT-2402",
        learner: "Marcus Brown",
        concept: "Differential Constraints",
        trend: "Repeated revision loop without retention",
        severity: "high",
      },
      {
        id: "INT-2403",
        learner: "Sofia Chen",
        concept: "Orbital Equation Mapping",
        trend: "Recovered after guided module",
        severity: "medium",
      },
    ],
    recommendedActions: {
      items: [
        "Pair Priya Kumar with visual derivative module and mentor check-in.",
        "Schedule 12-minute remediation sprint for Differential Constraints.",
        "Assign collaborative challenge to medium-risk cluster by Thursday.",
      ],
      primaryActionLabel: "Review Queue",
      secondaryActionLabel: "Export Summary",
    },
    liveNotices: [
      "Midweek audit: oral review module opens at 14:30.",
      "Parent digest for unresolved interventions scheduled at 18:00.",
      "Current class focus: chain rule stabilization.",
    ],
  },
  interventions: {
    brandLabel: sharedBrand,
    navItems: teacherNav,
    hero: {
      eyebrow: "Intervention Queue",
      title: "Intervention command center",
      subtitle: "Monitor active alerts, assign owners, and close loops with parents in one surface.",
      actionLabel: "Back to Dashboard",
      actionHref: "/teacher/dashboard",
    },
    sections: {
      queueTitle: "Active Queue",
      queueSubtitle: "Sorted by urgency and cognitive impact",
      protocolTitle: "Execution Protocol",
      protocolSubtitle: "Current runbook",
      timelineTitle: "Timeline",
      timelineSubtitle: "Today",
    },
    queue: [
      {
        id: "INT-2401",
        learner: "Priya Kumar",
        concept: "Logarithmic Transformation",
        severity: "critical",
        trend: "Declining confidence in 3 sessions",
        owner: "Ms. Rivera",
        ownerLabel: "Owner",
        caseLabel: "Case",
        viewLabel: "View Detail",
        resolveLabel: "Mark Resolved",
      },
      {
        id: "INT-2402",
        learner: "Marcus Brown",
        concept: "Differential Constraints",
        severity: "high",
        trend: "Repeated revision loop without retention",
        owner: "Mr. Dale",
        ownerLabel: "Owner",
        caseLabel: "Case",
        viewLabel: "View Detail",
        resolveLabel: "Mark Resolved",
      },
      {
        id: "INT-2403",
        learner: "Sofia Chen",
        concept: "Orbital Equation Mapping",
        severity: "medium",
        trend: "Recovered after guided module",
        owner: "Ms. Rivera",
        ownerLabel: "Owner",
        caseLabel: "Case",
        viewLabel: "View Detail",
        resolveLabel: "Mark Resolved",
      },
      {
        id: "INT-2404",
        learner: "Liam Obrien",
        concept: "Chain Rule Application",
        severity: "low",
        trend: "Needs checkpoint quiz before Friday",
        owner: "Mr. Dale",
        ownerLabel: "Owner",
        caseLabel: "Case",
        viewLabel: "View Detail",
        resolveLabel: "Mark Resolved",
      },
    ],
    protocolSteps: [
      "Critical cases must receive mentor response within 4 hours.",
      "Parent communication starts after teacher review is posted.",
      "Resolved interventions re-check confidence after 2 sessions.",
    ],
    timeline: [
      { timeLabel: "09:00", detail: "Priya Kumar intervention escalated to critical." },
      { timeLabel: "11:30", detail: "Marcus Brown remediation sprint assigned." },
      { timeLabel: "15:45", detail: "Parent digest dispatch window opens." },
    ],
  },
};

export const parentSeedPages: {
  dashboard: ParentDashboardDoc;
  inbox: ParentInboxDoc;
} = {
  dashboard: {
    brandLabel: sharedBrand,
    navItems: parentNav,
    hero: {
      eyebrow: "Parent Intelligence",
      title: "Aarav is on a strong trajectory this week",
      subtitle:
        "Parent insight dashboard for learning momentum, intervention visibility, and confidence-safe decision making.",
      actionLabel: "Open Inbox",
      actionHref: "/parent/inbox",
    },
    sections: {
      snapshotTitle: "Child Snapshot",
      snapshotSubtitle: "Grade 10 - AP Calculus",
      trendTitle: "Weekly Trend",
      trendSubtitle: "Progress over 4 checkpoints",
      notificationsTitle: "Recent Notifications",
      notificationsSubtitle: "Most important updates",
    },
    snapshotBadges: [
      { label: "Focus streak: 14 days", tone: "success" },
      { label: "Mastery index: 78%", tone: "primary" },
    ],
    snapshotMetrics: [
      { label: "Weekly mastery growth", value: 76, hint: "+7 points vs last week", tone: "success" },
      { label: "Engagement quality", value: 84, hint: "Consistent evening session adherence" },
      { label: "Support risk", value: 24, hint: "Low and stable", tone: "success" },
    ],
    weeklyTrend: [
      { weekLabel: "W1", score: 61 },
      { weekLabel: "W2", score: 68 },
      { weekLabel: "W3", score: 71 },
      { weekLabel: "W4", score: 76 },
    ],
    notifications: [
      {
        id: "N-001",
        title: "Weekly Learning Pulse Ready",
        message: "Aarav completed 86% of this week's mission and improved mastery by 7 points.",
        timestamp: "Today, 08:15",
        type: "report",
        read: false,
        statusLabel: "New",
      },
      {
        id: "N-002",
        title: "Intervention Cleared",
        message: "The earlier alert on Trigonometric Derivatives has been resolved by the mentor team.",
        timestamp: "Yesterday, 17:42",
        type: "alert",
        read: true,
        statusLabel: "Read",
      },
    ],
    reportButtonLabel: "View Full Weekly Report",
  },
  inbox: {
    brandLabel: sharedBrand,
    navItems: parentNav,
    hero: {
      eyebrow: "Parent Inbox",
      title: "Parent notification inbox",
      subtitle: "A prioritized stream of reports, interventions, and achievements sent from the learning engine.",
      actionLabel: "Back to Dashboard",
      actionHref: "/parent/dashboard",
    },
    sections: {
      messagesTitle: "Messages",
      messagesSubtitle: "Latest updates first",
    },
    messages: [
      {
        id: "N-001",
        type: "report",
        read: false,
        statusLabel: "Unread",
        title: "Weekly Learning Pulse Ready",
        message: "Aarav completed 86% of this week's mission and improved mastery by 7 points.",
        timestamp: "Today, 08:15",
        openLabel: "Open",
      },
      {
        id: "N-002",
        type: "alert",
        read: true,
        statusLabel: "Read",
        title: "Intervention Cleared",
        message: "The earlier alert on Trigonometric Derivatives has been resolved by the mentor team.",
        timestamp: "Yesterday, 17:42",
        openLabel: "Open",
      },
      {
        id: "N-003",
        type: "achievement",
        read: true,
        statusLabel: "Read",
        title: "Achievement Unlocked",
        message: "Aarav unlocked the Deep Thinker badge after maintaining a 12-day focus streak.",
        timestamp: "Yesterday, 09:03",
        openLabel: "Open",
      },
    ],
  },
};