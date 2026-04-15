export type StudentPageKey = "dashboard" | "insights" | "curriculum" | "assessments" | "ai-companion";

export interface StudentNavItem {
  href: string;
  label: string;
}

export interface StudentPageMeta {
  brandLabel: string;
  navItems: StudentNavItem[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

export interface StudentDashboardDoc extends StudentPageMeta {
  sections: {
    signalsTitle: string;
    signalsSubtitle: string;
    masteryTitle: string;
    masterySubtitle: string;
  };
  mission: {
    title: string;
    subtitle: string;
    badges: string[];
    description: string;
    progress: {
      label: string;
      value: number;
      hint: string;
    };
    actions: {
      primary: string;
      secondary: string;
    };
  };
  signals: Array<{
    title: string;
    value: string;
  }>;
  subjectMastery: Array<{
    subject: string;
    mastery: number;
  }>;
  nextSteps: {
    title: string;
    subtitle: string;
    items: string[];
    actions: {
      primary: string;
      secondary: string;
    };
  };
}

export interface StudentInsightsDoc extends StudentPageMeta {
  sections: {
    highlightsTitle: string;
    highlightsSubtitle: string;
    breakdownTitle: string;
    breakdownSubtitle: string;
    narrativesTitle: string;
    narrativesSubtitle: string;
  };
  highlights: Array<{
    label: string;
    value: string;
    delta: string;
  }>;
  trajectory: {
    title: string;
    subtitle: string;
    points: Array<{
      label: string;
      value: number;
    }>;
  };
  subjectBreakdown: Array<{
    subject: string;
    mastery: number;
  }>;
  narratives: Array<{
    title: string;
    body: string;
  }>;
  recommendations: {
    title: string;
    items: string[];
  };
}

export interface StudentCurriculumDoc extends StudentPageMeta {
  sections: {
    scheduleTitle: string;
    scheduleSubtitle: string;
    dependencyTitle: string;
    dependencySubtitle: string;
  };
  currentBlock: {
    title: string;
    subtitle: string;
    progressLabel: string;
    progressValue: number;
  };
  schedule: Array<{
    dateLabel: string;
    topic: string;
    statusLabel: string;
    readiness: number;
  }>;
  dependencyRisks: Array<{
    title: string;
    riskLevel: string;
    progress: number;
  }>;
  oracleInsights: {
    title: string;
    impactLabel: string;
    summary: string;
    primaryAction: string;
    secondaryAction: string;
  };
}

export interface StudentAssessmentsDoc extends StudentPageMeta {
  sections: {
    upcomingTitle: string;
    upcomingSubtitle: string;
    historyTitle: string;
    historySubtitle: string;
  };
  activeAssessment: {
    title: string;
    progressLabel: string;
    questionLabel: string;
    questionText: string;
    options: Array<{
      id: string;
      text: string;
      selected: boolean;
    }>;
    confidenceLabel: string;
    confidenceValue: number;
    submitLabel: string;
  };
  upcoming: Array<{
    title: string;
    schedule: string;
    type: string;
  }>;
  history: Array<{
    title: string;
    scoreLabel: string;
    statusLabel: string;
  }>;
}

export interface StudentAiCompanionDoc extends StudentPageMeta {
  sections: {
    contextTitle: string;
    contextSubtitle: string;
  };
  session: {
    title: string;
    subtitle: string;
  };
  quickPrompts: string[];
  messages: Array<{
    role: "student" | "assistant";
    content: string;
    timestamp: string;
  }>;
  contextMetrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
  composer: {
    placeholder: string;
    sendLabel: string;
  };
}

export const studentFallbackNav: StudentNavItem[] = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/insights", label: "Insights" },
  { href: "/student/curriculum", label: "Curriculum" },
  { href: "/student/assessments", label: "Assessments" },
  { href: "/student/ai-companion", label: "AI Companion" },
];

export function getStudentPagePath(studentId: string, pageKey: StudentPageKey): string {
  return `students/${studentId}/pages/${pageKey}`;
}
