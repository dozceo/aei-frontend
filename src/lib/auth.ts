import type { AppRole } from "@/app/routes";

export const AUTH_COOKIE = "aei-auth";
export const ROLE_COOKIE = "aei-role";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const roleHomeMap: Record<AppRole, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
};

export function normalizeRole(value: string | null | undefined): AppRole | null {
  if (value === "STUDENT" || value === "TEACHER" || value === "PARENT") {
    return value;
  }

  return null;
}

export function getRoleHome(role: AppRole | null): string {
  if (!role) {
    return "/onboarding";
  }

  return roleHomeMap[role];
}

export function isAuthenticatedValue(value: string | null | undefined): boolean {
  return value === "1";
}