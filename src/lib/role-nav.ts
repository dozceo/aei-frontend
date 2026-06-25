import type { AppRoute } from "@/app/routes";
import { routeGroups } from "@/app/routes";

const shortLabels: Record<string, string> = {
  "/student/dashboard": "Hub",
  "/student/loop": "Loop",
  "/student/mind": "Mind",
  "/student/queries": "Ask",
  "/student/insights": "Insights",
  "/student/curriculum": "Syllabus",
  "/student/assessments": "Tests",
  "/student/ai-companion": "AI",
  "/teacher/dashboard": "Hub",
  "/teacher/students": "Students",
  "/teacher/heatmap": "Heatmap",
  "/teacher/attendance": "Attend",
  "/teacher/interventions": "Nudges",
  "/parent/dashboard": "Hub",
  "/parent/inbox": "Inbox",
  "/admin": "Hub",
  "/admin/attendance": "Attend",
  "/admin/ews": "EWS",
  "/admin/roster": "Roster",
  "/admin/exams": "Exams",
};

const navIcons: Record<string, string> = {
  "/student/dashboard": "◆",
  "/student/loop": "↻",
  "/student/mind": "✦",
  "/student/queries": "?",
  "/student/insights": "▲",
  "/student/curriculum": "▤",
  "/student/assessments": "✎",
  "/student/ai-companion": "✺",
  "/teacher/dashboard": "◆",
  "/teacher/students": "❏",
  "/teacher/heatmap": "▦",
  "/teacher/attendance": "✓",
  "/teacher/interventions": "✦",
  "/parent/dashboard": "◆",
  "/parent/inbox": "✉",
  "/admin": "◆",
  "/admin/attendance": "✓",
  "/admin/ews": "▲",
  "/admin/roster": "❏",
  "/admin/exams": "✎",
};

function toNavItem(route: AppRoute) {
  return {
    label: route.label,
    shortLabel: shortLabels[route.path] ?? route.label.split(" ").pop() ?? route.label,
    href: route.path,
    icon: navIcons[route.path],
  };
}

export const studentNav = routeGroups.student.map(toNavItem);
export const teacherNav = routeGroups.teacher.map(toNavItem);
export const parentNav = routeGroups.parent.map(toNavItem);
export const adminNav = [
  { label: "Overview", shortLabel: "Hub", href: "/admin", icon: "◆" },
  { label: "Attendance", shortLabel: "Attend", href: "/admin/attendance", icon: "✓" },
  { label: "Early Warning", shortLabel: "EWS", href: "/admin/ews", icon: "▲" },
  { label: "Roster", shortLabel: "Roster", href: "/admin/roster", icon: "❏" },
  { label: "Exams", shortLabel: "Exams", href: "/admin/exams", icon: "✎" },
];
