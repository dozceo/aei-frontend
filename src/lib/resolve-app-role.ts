import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { AppRole } from "@/app/routes";
import { isAdminEmail } from "@/lib/admins";
import { db } from "@/lib/firebase-client";

export function normalizeClaimRole(claimRole: unknown): AppRole | null {
  if (typeof claimRole !== "string") return null;
  const normalized = claimRole.trim().toUpperCase();
  if (normalized === "STUDENT" || normalized === "TEACHER" || normalized === "PARENT" || normalized === "ADMIN") {
    return normalized;
  }
  return null;
}

async function getRoleFromUserDocument(uid: string): Promise<AppRole | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return normalizeClaimRole(snap.data().role);
  } catch {
    return null;
  }
}

async function getRoleFromTeacherRecord(uid: string): Promise<AppRole | null> {
  if (!db) return null;
  try {
    const roleSnap = await getDoc(doc(db, "teacher_roles", uid));
    if (!roleSnap.exists()) return null;
    const role = roleSnap.data();
    const sid = (role.schoolId as string) || null;
    if (!sid && role.teacherId) {
      const tSnap = await getDoc(doc(db, "teachers", role.teacherId as string));
      if (tSnap.exists() && tSnap.data().schoolId) return "TEACHER";
    }
    return sid ? "TEACHER" : null;
  } catch {
    return null;
  }
}

/** Resolve the app role for a signed-in Firebase user (claims → admin email → users doc → teacher_roles). */
export async function resolveAppRole(user: User): Promise<AppRole | null> {
  if (isAdminEmail(user.email)) return "ADMIN";

  try {
    const tokenResult = await user.getIdTokenResult();
    const fromClaims = normalizeClaimRole(tokenResult.claims.role);
    if (fromClaims) return fromClaims;
  } catch {
    /* fall through */
  }

  const fromProfile = await getRoleFromUserDocument(user.uid);
  if (fromProfile) return fromProfile;

  const fromTeacher = await getRoleFromTeacherRecord(user.uid);
  if (fromTeacher) return fromTeacher;

  return null;
}
