/**
 * Firestore Collection Verification
 * Checks if collections have the correct structure and schema
 */

import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";

export interface CollectionSchema {
  name: string;
  requiredFields?: string[];
  requiredSubcollections?: string[];
  example?: Record<string, any>;
}

export interface VerificationResult {
  collectionName: string;
  exists: boolean;
  documentCount: number;
  hasRequiredFields: boolean;
  missingFields: string[];
  hasRequiredSubcollections: boolean;
  missingSubcollections: string[];
  sampleDocuments: any[];
  errors: string[];
}

interface DetailedVerificationResult {
  timestamp: string;
  projectId: string;
  collections: VerificationResult[];
  summary: {
    totalCollections: number;
    collectionsWithData: number;
    collectionsWithIssues: number;
  };
}

function ensureDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured");
  }
}

/**
 * User collection schema
 */
const usersSchema: CollectionSchema = {
  name: "users",
  requiredFields: ["uid", "email", "role", "createdAt", "updatedAt"],
  example: {
    uid: "user-id",
    email: "user@example.com",
    role: "STUDENT",
    createdAt: "timestamp",
    updatedAt: "timestamp",
  },
};

/**
 * Teachers collection schema
 */
const teachersSchema: CollectionSchema = {
  name: "teachers",
  requiredFields: ["uid", "email", "role", "createdAt", "updatedAt"],
  requiredSubcollections: ["pages"],
  example: {
    uid: "teacher-id",
    email: "teacher@example.com",
    role: "TEACHER",
    createdAt: "timestamp",
    updatedAt: "timestamp",
  },
};

/**
 * Teacher pages sub-collection schema (dashboard, interventions)
 * NOTE: Currently unused - kept for reference
 */
// const teacherPagesSchema: CollectionSchema = {
//   name: "pages",
//   requiredFields: ["brandLabel", "navItems", "hero", "sections"],
//   example: {
//     brandLabel: "SANKALP AEI",
//     navItems: [{ href: "/teacher/dashboard", label: "Dashboard" }],
//     hero: {
//       eyebrow: "string",
//       title: "string",
//       subtitle: "string",
//     },
//     sections: {},
//   },
// };

/**
 * Parents collection schema
 */
const parentsSchema: CollectionSchema = {
  name: "parents",
  requiredFields: ["uid", "email", "role", "createdAt", "updatedAt"],
  requiredSubcollections: ["pages"],
  example: {
    uid: "parent-id",
    email: "parent@example.com",
    role: "PARENT",
    createdAt: "timestamp",
    updatedAt: "timestamp",
  },
};

/**
 * Students collection schema
 */
const studentsSchema: CollectionSchema = {
  name: "students",
  requiredFields: ["uid", "email", "role", "createdAt", "updatedAt"],
  requiredSubcollections: ["pages"],
  example: {
    uid: "student-id",
    email: "student@example.com",
    role: "STUDENT",
    createdAt: "timestamp",
    updatedAt: "timestamp",
  },
};

/**
 * Student pages sub-collection schema
 * NOTE: Currently unused - kept for reference
 */
// const studentPagesSchema: CollectionSchema = {
//   name: "pages",
//   requiredFields: ["brandLabel", "navItems", "hero", "sections"],
//   example: {
//     brandLabel: "SANKALP AEI",
//     navItems: [{ href: "/student/dashboard", label: "Dashboard" }],
//     hero: {
//       eyebrow: "string",
//       title: "string",
//       subtitle: "string",
//     },
//     sections: {},
//   },
// };

/**
 * Verify a collection has required fields
 */
async function verifyCollection(
  collectionName: string,
  schema: CollectionSchema,
  limit: number = 5,
): Promise<VerificationResult> {
  ensureDatabase();

  const result: VerificationResult = {
    collectionName,
    exists: false,
    documentCount: 0,
    hasRequiredFields: true,
    missingFields: [],
    hasRequiredSubcollections: true,
    missingSubcollections: [],
    sampleDocuments: [],
    errors: [],
  };

  try {
    const collectionRef = collection(db!, collectionName);
    const snapshot = await getDocs(collectionRef);

    result.exists = true;
    result.documentCount = snapshot.size;

    // Collect sample documents
    let count = 0;
    snapshot.forEach((doc) => {
      if (count < limit) {
        result.sampleDocuments.push({
          id: doc.id,
          ...doc.data(),
        });
        count++;
      }
    });

    // Check required fields in first document
    if (snapshot.size > 0) {
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();

      if (schema.requiredFields) {
        schema.requiredFields.forEach((field) => {
          if (!(field in data)) {
            result.missingFields.push(field);
            result.hasRequiredFields = false;
          }
        });
      }

      // Check for required sub-collections (if applicable)
      if (schema.requiredSubcollections && collectionName !== "pages") {
        for (const subCollection of schema.requiredSubcollections) {
          try {
            const subCollectionRef = collection(
              db!,
              collectionName,
              firstDoc.id,
              subCollection,
            );
            const subSnapshot = await getDocs(subCollectionRef);
            if (subSnapshot.size === 0) {
              result.missingSubcollections.push(subCollection);
              result.hasRequiredSubcollections = false;
            }
          } catch (error) {
            result.missingSubcollections.push(subCollection);
            result.hasRequiredSubcollections = false;
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push(error.message);
    } else {
      result.errors.push("Unknown error occurred");
    }
  }

  return result;
}

/**
 * Verify a user's role-specific data structure
 */
export async function verifyUserRoleData(
  userId: string,
  role: "TEACHER" | "PARENT" | "STUDENT",
): Promise<{
  userDocExists: boolean;
  roleDocExists: boolean;
  pagesExist: {
    dashboard: boolean;
    inbox?: boolean;
    interventions?: boolean;
    insights?: boolean;
    curriculum?: boolean;
    assessments?: boolean;
    "ai-companion"?: boolean;
  };
  errors: string[];
}> {
  ensureDatabase();

  const result = {
    userDocExists: false,
    roleDocExists: false,
    pagesExist: {
      dashboard: false,
      ...(role === "PARENT" && { inbox: false }),
      ...(role === "TEACHER" && { interventions: false }),
      ...(role === "STUDENT" && {
        insights: false,
        curriculum: false,
        assessments: false,
        "ai-companion": false,
      }),
    },
    errors: [] as string[],
  };

  try {
    // Check user document
    const userDocRef = doc(db!, "users", userId);
    const userSnapshot = await getDoc(userDocRef);
    result.userDocExists = userSnapshot.exists();

    if (!result.userDocExists) {
      result.errors.push(`User document not found at users/${userId}`);
    }

    // Check role document
    const roleDocRef = doc(db!, role === "TEACHER" ? "teachers" : role === "PARENT" ? "parents" : "students", userId);
    const roleSnapshot = await getDoc(roleDocRef);
    result.roleDocExists = roleSnapshot.exists();

    if (!result.roleDocExists) {
      result.errors.push(`Role document not found at ${role.toLowerCase()}/${userId}`);
    }

    // Check page documents
    const pageKeys =
      role === "TEACHER"
        ? ["dashboard", "interventions"]
        : role === "PARENT"
          ? ["dashboard", "inbox"]
          : ["dashboard", "insights", "curriculum", "assessments", "ai-companion"];

    const collectionName = role === "TEACHER" ? "teachers" : role === "PARENT" ? "parents" : "students";

    for (const pageKey of pageKeys) {
      const pageRef = doc(db!, collectionName, userId, "pages", pageKey);
      const pageSnapshot = await getDoc(pageRef);

      result.pagesExist[pageKey as keyof typeof result.pagesExist] = pageSnapshot.exists();

      if (!pageSnapshot.exists()) {
        result.errors.push(`Page document missing at ${collectionName}/${userId}/pages/${pageKey}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      result.errors.push(`Error verifying user data: ${error.message}`);
    }
  }

  return result;
}

/**
 * Run complete Firestore verification
 */
export async function verifyFirestoreStructure(): Promise<DetailedVerificationResult> {
  ensureDatabase();

  const schemas = [usersSchema, teachersSchema, parentsSchema, studentsSchema];

  const results = await Promise.all(schemas.map((schema) => verifyCollection(schema.name, schema)));

  const collectionsWithIssues = results.filter(
    (r) =>
      r.errors.length > 0 ||
      !r.hasRequiredFields ||
      !r.hasRequiredSubcollections,
  ).length;

  return {
    timestamp: new Date().toISOString(),
    projectId: db?.app.options.projectId || "unknown",
    collections: results,
    summary: {
      totalCollections: results.length,
      collectionsWithData: results.filter((r) => r.documentCount > 0).length,
      collectionsWithIssues: collectionsWithIssues,
    },
  };
}

/**
 * Get a detailed report of Firestore structure
 */
export async function getFirestoreReport(): Promise<string> {
  const verification = await verifyFirestoreStructure();

  let report = `
╔════════════════════════════════════════════════════════════╗
║           FIRESTORE STRUCTURE VERIFICATION REPORT          ║
╚════════════════════════════════════════════════════════════╝

Timestamp: ${verification.timestamp}
Project ID: ${verification.projectId}

SUMMARY:
├─ Total Collections: ${verification.summary.totalCollections}
├─ Collections with Data: ${verification.summary.collectionsWithData}
└─ Collections with Issues: ${verification.summary.collectionsWithIssues}

COLLECTIONS:
`;

  for (const collection of verification.collections) {
    const status = collection.exists ? "✓" : "✗";
    const fieldStatus = collection.hasRequiredFields ? "✓" : "✗";
    const subStatus = collection.hasRequiredSubcollections ? "✓" : "✗";

    report += `
${status} ${collection.collectionName}
  ├─ Exists: ${collection.exists}
  ├─ Document Count: ${collection.documentCount}
  ├─ Required Fields: ${fieldStatus} ${collection.missingFields.length > 0 ? `(Missing: ${collection.missingFields.join(", ")})` : ""}
  ├─ Sub-collections: ${subStatus} ${collection.missingSubcollections.length > 0 ? `(Missing: ${collection.missingSubcollections.join(", ")})` : ""}
  ${collection.errors.length > 0 ? `├─ Errors: ${collection.errors.join("; ")}` : ""}
  └─ Sample Documents: ${collection.sampleDocuments.length > 0 ? `(${collection.sampleDocuments.length} shown)` : "None"}`;

    if (collection.sampleDocuments.length > 0) {
      report += `
     First Document ID: ${collection.sampleDocuments[0].id}`;
    }
  }

  report += `

═════════════════════════════════════════════════════════════
`;

  return report;
}
