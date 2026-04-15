export interface SubjectMetric {
  subject: string;
  mastery: number;
}

export interface InterventionItem {
  id: string;
  learner: string;
  concept: string;
  severity: "low" | "medium" | "high" | "critical";
  trend: string;
  owner: string;
}

export interface ParentNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "report" | "alert" | "achievement";
  read: boolean;
}

export const studentSubjectMetrics: SubjectMetric[] = [
  { subject: "Advanced Thermodynamics", mastery: 78 },
  { subject: "Vector Calculus", mastery: 69 },
  { subject: "Cognitive Study Design", mastery: 86 },
  { subject: "Quantum Modeling", mastery: 62 },
];

export const teacherInterventions: InterventionItem[] = [
  {
    id: "INT-2401",
    learner: "Priya Kumar",
    concept: "Logarithmic Transformation",
    severity: "critical",
    trend: "Declining confidence in 3 sessions",
    owner: "Ms. Rivera",
  },
  {
    id: "INT-2402",
    learner: "Marcus Brown",
    concept: "Differential Constraints",
    severity: "high",
    trend: "Repeated revision loop without retention",
    owner: "Mr. Dale",
  },
  {
    id: "INT-2403",
    learner: "Sofia Chen",
    concept: "Orbital Equation Mapping",
    severity: "medium",
    trend: "Recovered after guided module",
    owner: "Ms. Rivera",
  },
  {
    id: "INT-2404",
    learner: "Liam Obrien",
    concept: "Chain Rule Application",
    severity: "low",
    trend: "Needs checkpoint quiz before Friday",
    owner: "Mr. Dale",
  },
];

export const parentNotifications: ParentNotification[] = [
  {
    id: "N-001",
    title: "Weekly Learning Pulse Ready",
    message: "Aarav completed 86% of this week’s mission and improved mastery by 7 points.",
    timestamp: "Today, 08:15",
    type: "report",
    read: false,
  },
  {
    id: "N-002",
    title: "Intervention Cleared",
    message: "The earlier alert on Trigonometric Derivatives has been resolved by the mentor team.",
    timestamp: "Yesterday, 17:42",
    type: "alert",
    read: true,
  },
  {
    id: "N-003",
    title: "Achievement Unlocked",
    message: "Aarav unlocked the Deep Thinker badge after maintaining a 12-day focus streak.",
    timestamp: "Yesterday, 09:03",
    type: "achievement",
    read: true,
  },
];

export const parentTrend = [
  { week: "W1", score: 61 },
  { week: "W2", score: 68 },
  { week: "W3", score: 71 },
  { week: "W4", score: 76 },
];
