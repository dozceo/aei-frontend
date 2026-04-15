export type AppRole = "STUDENT" | "TEACHER" | "PARENT";

export interface AppRoute {
  path: string;
  label: string;
  requireAuth: boolean;
  roles?: AppRole[];
}

export const appRoutes: AppRoute[] = [
  { path: "/login", label: "Login", requireAuth: false },
  { path: "/onboarding", label: "Onboarding", requireAuth: true },
  { path: "/student/dashboard", label: "Student Dashboard", requireAuth: true, roles: ["STUDENT"] },
  { path: "/student/insights", label: "Student Insights", requireAuth: true, roles: ["STUDENT"] },
  { path: "/student/curriculum", label: "Student Curriculum", requireAuth: true, roles: ["STUDENT"] },
  { path: "/student/assessments", label: "Student Assessments", requireAuth: true, roles: ["STUDENT"] },
  { path: "/student/ai-companion", label: "Student AI Companion", requireAuth: true, roles: ["STUDENT"] },
  { path: "/teacher/dashboard", label: "Teacher Dashboard", requireAuth: true, roles: ["TEACHER"] },
  { path: "/teacher/interventions", label: "Teacher Interventions", requireAuth: true, roles: ["TEACHER"] },
  { path: "/parent/dashboard", label: "Parent Dashboard", requireAuth: true, roles: ["PARENT"] },
  { path: "/parent/inbox", label: "Parent Inbox", requireAuth: true, roles: ["PARENT"] },
];

export const routeGroups = {
  student: appRoutes.filter((route) => route.roles?.includes("STUDENT")),
  teacher: appRoutes.filter((route) => route.roles?.includes("TEACHER")),
  parent: appRoutes.filter((route) => route.roles?.includes("PARENT")),
};
