import type { BadgeTone } from "@/lib/tone-utils";

export type ProgressTone = "primary" | "success" | "warning";
export type SeverityLevel = "low" | "medium" | "high" | "critical";
export type NotificationType = "report" | "alert" | "achievement";

export interface RoleNavItem {
  href: string;
  label: string;
}

export interface RolePageMeta {
  brandLabel: string;
  navItems: RoleNavItem[];
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    actionLabel?: string;
    actionHref?: string;
  };
}

export type TeacherPageKey = "dashboard" | "interventions";
export type ParentPageKey = "dashboard" | "inbox";

export interface TeacherDashboardDoc extends RolePageMeta {
  sections: {
    snapshotTitle: string;
    snapshotSubtitle: string;
    riskTitle: string;
    riskSubtitle: string;
    actionsTitle: string;
    actionsSubtitle: string;
    noticesTitle: string;
    noticesSubtitle: string;
  };
  classSnapshot: Array<{
    label: string;
    value: number;
    hint: string;
    tone?: ProgressTone;
  }>;
  atRiskLearners: Array<{
    id: string;
    learner: string;
    concept: string;
    trend: string;
    severity: SeverityLevel;
  }>;
  recommendedActions: {
    items: string[];
    primaryActionLabel: string;
    secondaryActionLabel: string;
  };
  liveNotices: string[];
}

export interface TeacherInterventionsDoc extends RolePageMeta {
  sections: {
    queueTitle: string;
    queueSubtitle: string;
    protocolTitle: string;
    protocolSubtitle: string;
    timelineTitle: string;
    timelineSubtitle: string;
  };
  queue: Array<{
    id: string;
    learner: string;
    concept: string;
    severity: SeverityLevel;
    trend: string;
    owner: string;
    ownerLabel: string;
    caseLabel: string;
    viewLabel: string;
    resolveLabel: string;
  }>;
  protocolSteps: string[];
  timeline: Array<{
    timeLabel: string;
    detail: string;
  }>;
}

export interface ParentDashboardDoc extends RolePageMeta {
  sections: {
    snapshotTitle: string;
    snapshotSubtitle: string;
    trendTitle: string;
    trendSubtitle: string;
    notificationsTitle: string;
    notificationsSubtitle: string;
  };
  snapshotBadges: Array<{
    label: string;
    tone: BadgeTone;
  }>;
  snapshotMetrics: Array<{
    label: string;
    value: number;
    hint: string;
    tone?: ProgressTone;
  }>;
  weeklyTrend: Array<{
    weekLabel: string;
    score: number;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: NotificationType;
    read: boolean;
    statusLabel: string;
  }>;
  reportButtonLabel: string;
}

export interface ParentInboxDoc extends RolePageMeta {
  sections: {
    messagesTitle: string;
    messagesSubtitle: string;
  };
  messages: Array<{
    id: string;
    type: NotificationType;
    read: boolean;
    statusLabel: string;
    title: string;
    message: string;
    timestamp: string;
    openLabel: string;
  }>;
}

export const teacherFallbackNav: RoleNavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard" },
  { href: "/teacher/interventions", label: "Interventions" },
  { href: "/onboarding", label: "Role Setup" },
  { href: "/", label: "Plan Hub" },
];

export const parentFallbackNav: RoleNavItem[] = [
  { href: "/parent/dashboard", label: "Dashboard" },
  { href: "/parent/inbox", label: "Inbox" },
  { href: "/onboarding", label: "Role Setup" },
  { href: "/", label: "Plan Hub" },
];

export function getTeacherPagePath(teacherId: string, pageKey: TeacherPageKey): string {
  return `teachers/${teacherId}/pages/${pageKey}`;
}

export function getParentPagePath(parentId: string, pageKey: ParentPageKey): string {
  return `parents/${parentId}/pages/${pageKey}`;
}