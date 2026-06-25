"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { AppRole } from "@/app/routes";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE_SECONDS, ROLE_COOKIE, normalizeRole } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase-client";
import { getRouteConfig, normalizePath } from "@/lib/route-auth";
import { resolveAppRole } from "@/lib/resolve-app-role";

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
  if (!match) return null;
  return decodeURIComponent(match.slice(prefix.length));
}

function clearSessionCookies(): void {
  setCookie(AUTH_COOKIE, "", 0);
  setCookie(ROLE_COOKIE, "", 0);
}

function redirectToLoginIfProtectedRoute(): void {
  const pathname = normalizePath(window.location.pathname);
  const route = getRouteConfig(pathname);
  if (!route?.requireAuth) return;
  const search = new URLSearchParams({ next: pathname });
  if (window.location.pathname !== "/login") {
    window.location.replace(`/login?${search.toString()}`);
  }
}

function persistRole(role: AppRole | null): void {
  if (role) {
    setCookie(ROLE_COOKIE, role, AUTH_COOKIE_MAX_AGE_SECONDS);
  } else if (getCookie(ROLE_COOKIE)) {
    setCookie(ROLE_COOKIE, "", 0);
  }
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
        if (!active) return;

        if (!user) {
          clearSessionCookies();
          redirectToLoginIfProtectedRoute();
          return;
        }

        setCookie(AUTH_COOKIE, "1", AUTH_COOKIE_MAX_AGE_SECONDS);

        try {
          const resolved = await resolveAppRole(user);
          if (!active) return;
          const cookieRole = normalizeRole(getCookie(ROLE_COOKIE));
          persistRole(resolved ?? cookieRole);
        } catch {
          const cookieRole = normalizeRole(getCookie(ROLE_COOKIE));
          if (cookieRole) persistRole(cookieRole);
        }
      },
      () => {
        if (!active) return;
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
