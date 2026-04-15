import { appRoutes, type AppRole, type AppRoute } from "@/app/routes";

export function normalizePath(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function getRouteConfig(pathname: string): AppRoute | undefined {
  const normalizedPath = normalizePath(pathname);
  return appRoutes.find((route) => route.path === normalizedPath);
}

export function isRoleAllowedForPath(pathname: string, role: AppRole | null): boolean {
  const route = getRouteConfig(pathname);

  if (!route) {
    return true;
  }

  if (!route.roles || route.roles.length === 0) {
    return true;
  }

  if (!role) {
    return false;
  }

  return route.roles.includes(role);
}