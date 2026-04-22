"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { AppRole } from "@/app/routes";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE_SECONDS, ROLE_COOKIE, normalizeRole } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase-client";
import { getRouteConfig, normalizePath } from "@/lib/route-auth";

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  const secureAttribute = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureAttribute}`;
}

function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
}

function clearSessionCookies(): void {
  setCookie(AUTH_COOKIE, "", 0);
  setCookie(ROLE_COOKIE, "", 0);
}

function redirectToLoginIfProtectedRoute(): void {
  const pathname = normalizePath(window.location.pathname);
  const route = getRouteConfig(pathname);

  if (!route?.requireAuth) {
    return;
  }

  const search = new URLSearchParams({ next: pathname });
  const destination = `/login?${search.toString()}`;

  if (window.location.pathname !== "/login") {
    window.location.replace(destination);
  }
}

function normalizeClaimRole(claimRole: unknown): AppRole | null {
  if (typeof claimRole !== "string") {
    return null;
  }

  const normalized = claimRole.trim().toUpperCase();
  if (normalized === "STUDENT" || normalized === "TEACHER" || normalized === "PARENT") {
    return normalized;
  }

  return null;
}

export function AuthSessionSync() {
  useEffect(() => {
    if (!firebaseAuth) {
      clearSessionCookies();
      return () => undefined;
    }

    let active = true;

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (user) => {
        if (!active) {
          return;
        }

        if (!user) {
          clearSessionCookies();
          redirectToLoginIfProtectedRoute();
          return;
        }

        setCookie(AUTH_COOKIE, "1", AUTH_COOKIE_MAX_AGE_SECONDS);

        const cookieRole = normalizeRole(getCookie(ROLE_COOKIE));

        try {
          const tokenResult = await user.getIdTokenResult();
          if (!active) {
            return;
          }

          const claimRole = normalizeClaimRole(tokenResult.claims.role);
          const resolvedRole = claimRole ?? cookieRole;

          if (resolvedRole) {
            setCookie(ROLE_COOKIE, resolvedRole, AUTH_COOKIE_MAX_AGE_SECONDS);
          } else {
            setCookie(ROLE_COOKIE, "", 0);
          }
        } catch {
          if (cookieRole) {
            setCookie(ROLE_COOKIE, cookieRole, AUTH_COOKIE_MAX_AGE_SECONDS);
          } else {
            setCookie(ROLE_COOKIE, "", 0);
          }
        }
      },
      () => {
        if (!active) {
          return;
        }

        clearSessionCookies();
        redirectToLoginIfProtectedRoute();
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return null;
}
