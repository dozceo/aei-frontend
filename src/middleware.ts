import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, getRoleHome, isAuthenticatedValue, normalizeRole, ROLE_COOKIE } from "@/lib/auth";
import { getRouteConfig, normalizePath } from "@/lib/route-auth";

function redirectTo(request: NextRequest, pathname: string, searchParams?: Record<string, string>): NextResponse {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      redirectUrl.searchParams.set(key, value);
    });
  }

  return NextResponse.redirect(redirectUrl);
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = normalizePath(request.nextUrl.pathname);
  const route = getRouteConfig(pathname);
  const authCookieValue = request.cookies.get(AUTH_COOKIE)?.value;
  const roleCookieValue = request.cookies.get(ROLE_COOKIE)?.value;
  const isAuthenticated = isAuthenticatedValue(authCookieValue);
  const role = normalizeRole(roleCookieValue);

  // REMOVED: Aggressive redirect away from auth pages when authenticated.
  // This allows users to switch accounts or see the signup page even if a session cookie exists.

  if (!route) {
    return NextResponse.next();
  }

  if (route.requireAuth && !isAuthenticated) {
    return redirectTo(request, "/login", { next: pathname });
  }

  if (route.roles && route.roles.length > 0) {
    if (!role || !route.roles.includes(role)) {
      // Only redirect if they are actually trying to access a restricted role path
      // and they don't have that role.
      if (isAuthenticated) {
          return redirectTo(request, getRoleHome(role), { denied: pathname });
      } else {
          return redirectTo(request, "/login", { next: pathname });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};