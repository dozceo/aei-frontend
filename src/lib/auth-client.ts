"use client";

import type { AppRole } from "@/app/routes";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE_SECONDS, ROLE_COOKIE } from "@/lib/auth";

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function signInAsRole(role: AppRole): void {
  setCookie(AUTH_COOKIE, "1", AUTH_COOKIE_MAX_AGE_SECONDS);
  setCookie(ROLE_COOKIE, role, AUTH_COOKIE_MAX_AGE_SECONDS);
}

export function clearAuthCookies(): void {
  setCookie(AUTH_COOKIE, "", 0);
  setCookie(ROLE_COOKIE, "", 0);
}