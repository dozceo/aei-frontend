/**
 * Manual Firestore Seeding Utility
 * Helps seed or reseed existing Firestore data
 */

import { getDocs, collection, doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";
import { seedTeacherPages, seedParentPages } from "@/lib/seed-role-pages";
import { seedStudentPages } from "@/lib/seed-student-pages";

interface SeedingResult {
  totalUsers: number;
  successCount: number;
  failedCount: number;
  failures: Array<{
    userId: string;
    role: string;
    error: string;
  }>;
}

function ensureDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured");
  }
}

/**
 * Seed page data for all users in a specific role collection
 * Useful for onboarding existing users with page content
 */
export async function seedAllUsersByRole(
  roleCollection: "teachers" | "parents" | "students",
): Promise<SeedingResult> {
  ensureDatabase();

  const result: SeedingResult = {
    totalUsers: 0,
    successCount: 0,
    failedCount: 0,
    failures: [],
  };

  try {
    const collectionRef = collection(db!, roleCollection);
    const snapshot = await getDocs(collectionRef);

    result.totalUsers = snapshot.size;

    const seedFn =
      roleCollection === "teachers"
        ? seedTeacherPages
        : roleCollection === "parents"
          ? seedParentPages
          : seedStudentPages;

    for (const docSnap of snapshot.docs) {
      const userId = docSnap.id;
      const role = roleCollection.slice(0, -1).toUpperCase();

      try {
        await seedFn(userId);
        result.successCount++;
        console.log(`✓ Seeded ${role} pages for user ${userId}`);
      } catch (error) {
        result.failedCount++;
        result.failures.push({
          userId,
          role,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(`✗ Failed to seed ${role} pages for user ${userId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }

  return result;
}

/**
 * Seed page data for a specific user
 */
export async function seedUserPages(
  userId: string,
  role: "TEACHER" | "PARENT" | "STUDENT",
): Promise<void> {
  ensureDatabase();

  const seedFn =
    role === "TEACHER"
      ? seedTeacherPages
      : role === "PARENT"
        ? seedParentPages
        : seedStudentPages;

  try {
    await seedFn(userId);
    console.log(`✓ Successfully seeded ${role} pages for user ${userId}`);
  } catch (error) {
    console.error(`✗ Failed to seed ${role} pages for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Check if a user has all required page documents
 * Returns which pages are missing
 */
export async function checkUserPages(
  userId: string,
  role: "TEACHER" | "PARENT" | "STUDENT",
): Promise<{
  hasAllPages: boolean;
  presentPages: string[];
  missingPages: string[];
}> {
  ensureDatabase();

  const pageKeys =
    role === "TEACHER"
      ? ["dashboard", "interventions"]
      : role === "PARENT"
        ? ["dashboard", "inbox"]
        : ["dashboard", "insights", "curriculum", "assessments", "ai-companion"];

  const collectionName =
    role === "TEACHER" ? "teachers" : role === "PARENT" ? "parents" : "students";

  const presentPages: string[] = [];
  const missingPages: string[] = [];

  for (const pageKey of pageKeys) {
    const pageRef = doc(db!, collectionName, userId, "pages", pageKey);
    const pageSnap = await getDoc(pageRef);

    if (pageSnap.exists()) {
      presentPages.push(pageKey);
    } else {
      missingPages.push(pageKey);
    }
  }

  return {
    hasAllPages: missingPages.length === 0,
    presentPages,
    missingPages,
  };
}

/**
 * Reseed pages for a user (overwrites existing pages)
 */
export async function reseedUserPages(
  userId: string,
  role: "TEACHER" | "PARENT" | "STUDENT",
): Promise<void> {
  ensureDatabase();

  const seedFn =
    role === "TEACHER"
      ? seedTeacherPages
      : role === "PARENT"
        ? seedParentPages
        : seedStudentPages;

  try {
    await seedFn(userId);
    console.log(`✓ Successfully reseeded ${role} pages for user ${userId}`);
  } catch (error) {
    console.error(`✗ Failed to reseed ${role} pages for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get a seeding status report for all roles
 */
export async function getSeedingStatusReport(): Promise<string> {
  ensureDatabase();

  const roles: Array<{
    role: "TEACHER" | "PARENT" | "STUDENT";
    collection: "teachers" | "parents" | "students";
    displayName: string;
  }> = [
    { role: "TEACHER", collection: "teachers", displayName: "Teachers" },
    { role: "PARENT", collection: "parents", displayName: "Parents" },
    { role: "STUDENT", collection: "students", displayName: "Students" },
  ];

  let report = `
╔════════════════════════════════════════════════════════════╗
║              FIRESTORE SEEDING STATUS REPORT                ║
╚════════════════════════════════════════════════════════════╝

Timestamp: ${new Date().toISOString()}

ROLE SUMMARIES:
`;

  for (const { role, collection: collectionName, displayName } of roles) {
    try {
      const collectionRef = collection(db!, collectionName);
      const snapshot = await getDocs(collectionRef);

      let fullySeededCount = 0;
      let partiallySeededCount = 0;
      let unseededCount = 0;

      for (const userDoc of snapshot.docs) {
        const pages = await checkUserPages(userDoc.id, role);
        if (pages.hasAllPages) {
          fullySeededCount++;
        } else if (pages.presentPages.length > 0) {
          partiallySeededCount++;
        } else {
          unseededCount++;
        }
      }

      report += `
${displayName}:
  ├─ Total Users: ${snapshot.size}
  ├─ Fully Seeded: ${fullySeededCount}
  ├─ Partially Seeded: ${partiallySeededCount}
  └─ Not Seeded: ${unseededCount}`;
    } catch (error) {
      report += `
${displayName}:
  └─ Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }

  report += `

═════════════════════════════════════════════════════════════
RECOMMENDED ACTIONS:
1. If "Not Seeded" count > 0, run: seedAllUsersByRole('teachers|parents|students')
2. If "Partially Seeded" count > 0, run: reseedUserPages(userId, role) for each
3. Monitor collection counts and compare to user count in Firebase Auth
`;

  return report;
}
