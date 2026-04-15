"use client";

import type { AppRole } from "@/app/routes";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE_SECONDS, ROLE_COOKIE } from "@/lib/auth";
import { firebaseAuth } from "@/lib/firebase-client";

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
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

export interface SignInResult {
  role: AppRole;
  uid: string;
  email: string | null;
}

export function setRoleSession(role: AppRole): void {
  setCookie(AUTH_COOKIE, "1", AUTH_COOKIE_MAX_AGE_SECONDS);
  setCookie(ROLE_COOKIE, role, AUTH_COOKIE_MAX_AGE_SECONDS);
}

export async function signInWithFirebase(email: string, password: string, fallbackRole: AppRole): Promise<SignInResult> {
  if (!firebaseAuth) {
    throw new Error("Firebase auth is not configured. Set NEXT_PUBLIC_FIREBASE_* values.");
  }

  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const tokenResult = await credential.user.getIdTokenResult(true);
  const claimRole = normalizeClaimRole(tokenResult.claims.role);
  const resolvedRole = claimRole ?? fallbackRole;

  setRoleSession(resolvedRole);

  return {
    role: resolvedRole,
    uid: credential.user.uid,
    email: credential.user.email,
  };
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  if (!firebaseAuth || !firebaseAuth.currentUser) {
    return null;
  }

  return firebaseAuth.currentUser.getIdToken(forceRefresh);
}

export async function signOutFromFirebase(): Promise<void> {
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }

  clearAuthCookies();
}

export function clearAuthCookies(): void {
  setCookie(AUTH_COOKIE, "", 0);
  setCookie(ROLE_COOKIE, "", 0);
}