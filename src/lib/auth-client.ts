"use client";

import type { AppRole } from "@/app/routes";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE_SECONDS, ROLE_COOKIE } from "@/lib/auth";
import { db, firebaseAuth } from "@/lib/firebase-client";
import { initializeUserData } from "@/lib/user-initialization-db";

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  const secureAttribute = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureAttribute}`;
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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const maybeCode = (error as { code?: unknown }).code;
  return typeof maybeCode === "string" ? maybeCode : null;
}

function mapAuthError(error: unknown): Error {
  const code = getErrorCode(error);

  if (code === "auth/invalid-email") {
    return new Error("Enter a valid email address.");
  }

  if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
    return new Error("No account found for this email. Create an account to continue.");
  }

  if (code === "auth/wrong-password") {
    return new Error("Incorrect password. Try again or reset your password.");
  }

  if (code === "auth/popup-blocked") {
    return new Error("Popup was blocked. Allow popups and try Google sign-in again.");
  }

  if (code === "auth/popup-closed-by-user") {
    return new Error("Google sign-in was canceled before completion.");
  }

  if (code === "auth/unauthorized-domain") {
    return new Error("This domain is not authorized for Firebase auth. Add it in Firebase Console > Authentication > Settings > Authorized domains.");
  }

  if (code === "auth/operation-not-allowed") {
    return new Error("Sign-in provider is disabled. Enable Email/Password and Google in Firebase Console.");
  }

  if (code === "auth/account-exists-with-different-credential") {
    return new Error("An account already exists with this email using a different sign-in method.");
  }

  if (code === "auth/too-many-requests") {
    return new Error("Too many attempts. Wait a moment and try again.");
  }

  if (code === "auth/network-request-failed") {
    return new Error("Network error while signing in. Check your connection and try again.");
  }

  if (error instanceof Error && error.message) {
    return error;
  }

  return new Error("Authentication failed. Verify Firebase setup and try again.");
}

async function getRoleFromUserDocument(uid: string): Promise<AppRole | null> {
  if (!db) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as { role?: unknown };
    return normalizeClaimRole(data.role);
  } catch {
    return null;
  }
}

async function getRoleFromClaims(user: User): Promise<AppRole | null> {
  const tokenResult = await user.getIdTokenResult(true);
  return normalizeClaimRole(tokenResult.claims.role);
}

interface ResolveRoleOptions {
  selectedRole?: AppRole;
  allowBootstrapFromSelectedRole?: boolean;
}

async function resolveRoleFromUser(credential: UserCredential, options: ResolveRoleOptions = {}): Promise<AppRole | null> {
  const roleFromClaims = await getRoleFromClaims(credential.user);
  if (roleFromClaims) {
    return roleFromClaims;
  }

  const roleFromProfile = await getRoleFromUserDocument(credential.user.uid);
  if (roleFromProfile) {
    return roleFromProfile;
  }

  if (options.allowBootstrapFromSelectedRole && options.selectedRole) {
    return options.selectedRole;
  }

  return null;
}

async function ensureUserSeedData(role: AppRole): Promise<void> {
  const token = await getCurrentIdToken();
  if (!token) {
    throw new Error("No authentication token found. Sign in again.");
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("Backend API URL not configured (NEXT_PUBLIC_API_BASE_URL).");
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/init-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server failed to initialize user data (${response.status}).`);
    }
  } catch (error) {
    console.error("User initialization failed:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to prepare user data on the server.");
  }
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

export async function ensureCurrentUserSeedData(role: AppRole): Promise<void> {
  if (!firebaseAuth || !firebaseAuth.currentUser) {
    throw new Error("No authenticated user found for onboarding. Sign in and try again.");
  }

  // Ensure Firestore data exists
  await initializeUserData(firebaseAuth.currentUser.uid, firebaseAuth.currentUser.email, role);

  try {
    await ensureUserSeedData(role);
  } catch (apiError) {
    console.warn("Backend sync skipped:", apiError);
  }
}

export async function signInWithFirebase(email: string, password: string, selectedRole?: AppRole): Promise<SignInResult> {
  if (!firebaseAuth) {
    throw new Error("Firebase auth is not configured. Set NEXT_PUBLIC_FIREBASE_* values.");
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new Error("Enter both email and password to continue.");
  }

  try {
    const credential = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
    const resolvedRole = await resolveRoleFromUser(credential, {
      selectedRole,
      allowBootstrapFromSelectedRole: Boolean(selectedRole),
    });

    if (!resolvedRole) {
      throw new Error("No role is linked to this account. Complete signup or contact support.");
    }

    // Ensure Firestore data exists
    await initializeUserData(credential.user.uid, credential.user.email, resolvedRole);

    // Call backend for claims/sync
    try {
      await ensureUserSeedData(resolvedRole);
    } catch (apiError) {
      console.warn("Backend sync skipped:", apiError);
    }

    setRoleSession(resolvedRole);

    return {
      role: resolvedRole,
      uid: credential.user.uid,
      email: credential.user.email,
    };
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function signInWithGoogle(selectedRole?: AppRole): Promise<SignInResult> {
  if (!firebaseAuth) {
    throw new Error("Firebase auth is not configured. Set NEXT_PUBLIC_FIREBASE_* values.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const credential = await signInWithPopup(firebaseAuth, provider);
    const authInfo = getAdditionalUserInfo(credential);

    if (authInfo?.isNewUser && !selectedRole) {
      throw new Error("Select your role before first Google sign-in.");
    }

    const resolvedRole = await resolveRoleFromUser(credential, {
      selectedRole,
      allowBootstrapFromSelectedRole: Boolean(authInfo?.isNewUser && selectedRole),
    });

    if (!resolvedRole) {
      throw new Error("No role is linked to this account. Complete signup or contact support.");
    }

    // Initialize for new users or ensure data exists
    await initializeUserData(credential.user.uid, credential.user.email, resolvedRole);

    // Call backend for claims/sync
    try {
      await ensureUserSeedData(resolvedRole);
    } catch (apiError) {
      console.warn("Backend sync skipped:", apiError);
    }

    setRoleSession(resolvedRole);

    return {
      role: resolvedRole,
      uid: credential.user.uid,
      email: credential.user.email,
    };
  } catch (error) {
    throw mapAuthError(error);
  }
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

export async function signUpWithFirebase(email: string, password: string, role: AppRole): Promise<SignInResult> {
  if (!firebaseAuth) {
    throw new Error("Firebase auth is not configured. Set NEXT_PUBLIC_FIREBASE_* values.");
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, normalizedEmail, password);

    // Initialize Firestore data directly from frontend
    await initializeUserData(credential.user.uid, credential.user.email, role);

    // Call backend for claims/sync
    try {
      await ensureUserSeedData(role);
    } catch (apiError) {
      console.warn("Backend sync skipped:", apiError);
    }

    setRoleSession(role);

    return {
      role,
      uid: credential.user.uid,
      email: credential.user.email,
    };
  } catch (error) {
    throw mapAuthError(error);
  }
}

export async function sendResetEmail(email: string): Promise<void> {
  if (!firebaseAuth) {
    throw new Error("Firebase auth is not configured. Set NEXT_PUBLIC_FIREBASE_* values.");
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
  } catch (error) {
    throw mapAuthError(error);
  }
}