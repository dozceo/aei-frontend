import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { AppRole } from "@/app/routes";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";
import { seedTeacherPages, seedParentPages } from "@/lib/seed-role-pages";
import { seedStudentPages } from "@/lib/seed-student-pages";

export interface UserDocument {
  uid: string;
  email: string;
  role: AppRole;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface StudentUserDocument extends UserDocument {
  role: "STUDENT";
}

export interface TeacherUserDocument extends UserDocument {
  role: "TEACHER";
}

export interface ParentUserDocument extends UserDocument {
  role: "PARENT";
}

/**
 * Initialize user data in Firestore after signup.
 * Creates a user document and role-specific documents.
 * 
 * @param uid - The Firebase Auth user ID
 * @param email - The user's email
 * @param role - The user's role (STUDENT, TEACHER, or PARENT)
 */
export async function initializeUserData(
  uid: string,
  email: string | null,
  role: AppRole,
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured.");
  }

  const timestamp = serverTimestamp();
  
  // Create main user document
  const userDocRef = doc(db, "users", uid);
  const userDocData: UserDocument = {
    uid,
    email: email || "",
    role,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Create role-specific document
  const roleCollectionMap: Record<AppRole, string> = {
    STUDENT: "students",
    TEACHER: "teachers",
    PARENT: "parents",
  };

  const roleCollection = roleCollectionMap[role];
  const roleDocRef = doc(db, roleCollection, uid);
  const roleDocData: UserDocument = {
    uid,
    email: email || "",
    role,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Write both documents
  await Promise.all([
    setDoc(userDocRef, userDocData, { merge: true }),
    setDoc(roleDocRef, roleDocData, { merge: true }),
  ]);

  // Seed page data for the user's role
  if (role === "TEACHER") {
    await seedTeacherPages(uid);
  } else if (role === "PARENT") {
    await seedParentPages(uid);
  } else if (role === "STUDENT") {
    await seedStudentPages(uid);
  }
}
