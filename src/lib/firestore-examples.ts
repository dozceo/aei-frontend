/**
 * Firestore Integration Examples
 * 
 * This file demonstrates how to use the new Firestore utilities
 * for frontend and backend operations.
 */

// ═══════════════════════════════════════════════════════════════
// FRONTEND EXAMPLES
// ═══════════════════════════════════════════════════════════════

// Example 1: Real-time User Profile Listener (React Component)
// ───────────────────────────────────────────────────────────────

/*
import { useEffect, useState } from "react";
import { setupUserProfileListener } from "@/lib/firestore-listeners";

export function UserProfile({ uid }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = setupUserProfileListener(
      uid,
      (data) => setUser(data),
      (err) => setError(err)
    );

    // Cleanup on unmount
    return () => unsubscribe?.();
  }, [uid]);

  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Loading...</div>;

  return <div>{user.fullName || "User profile"}</div>;
}
*/

// Example 2: CRUD Operations in a Component
// ───────────────────────────────────────────────────────────────

/*
import { updateDocument, getDocument, deleteDocument } from "@/lib/firestore-ops";

export async function updateUserSettings(uid: string, settings: any) {
  try {
    await updateDocument(`users/${uid}/settings`, "profile", settings);
    console.log("Settings updated!");
  } catch (error) {
    console.error("Update failed:", error);
  }
}

export async function getUserProfile(uid: string) {
  try {
    const profile = await getDocument("users", uid);
    return profile;
  } catch (error) {
    console.error("Fetch failed:", error);
    return null;
  }
}
*/

// Example 3: Create a Course Enrollment
// ───────────────────────────────────────────────────────────────

/*
import { createDocument } from "@/lib/firestore-ops";

export async function enrollInCourse(uid: string, courseId: string) {
  try {
    await createDocument(`users/${uid}/enrollments`, {
      courseId,
      enrolledAt: new Date(),
      status: "active"
    });
    console.log("Enrolled successfully!");
  } catch (error) {
    console.error("Enrollment failed:", error);
  }
}
*/

// Example 4: Real-time Collection Listener (Courses)
// ───────────────────────────────────────────────────────────────

/*
import { setupCollectionListener } from "@/lib/firestore-listeners";

// In a React component
useEffect(() => {
  const unsubscribe = setupCollectionListener("courses", {
    onData: (courses) => {
      setCourses(courses);
    },
    onError: (error) => {
      console.error("Failed to listen to courses:", error);
    }
  });

  return () => unsubscribe?.();
}, []);
*/

// ═══════════════════════════════════════════════════════════════
// BACKEND EXAMPLES
// ═══════════════════════════════════════════════════════════════

// Example 1: Using Firestore Service in a Route Handler
// ───────────────────────────────────────────────────────────────

/*
import firestoreService from "../services/firestore.service";
import express from "express";

const router = express.Router();

// Get user analytics
router.get("/users/:uid/analytics", async (req, res) => {
  try {
    const analytics = await firestoreService.read("analytics", req.params.uid);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new course
router.post("/courses", async (req, res) => {
  try {
    const courseId = await firestoreService.create("courses", {
      title: req.body.title,
      description: req.body.description,
      teacherId: req.auth.uid,
      status: "draft"
    });
    res.status(201).json({ id: courseId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
*/

// Example 2: Querying Documents with Conditions
// ───────────────────────────────────────────────────────────────

/*
// Get all courses by a specific teacher
const courses = await firestoreService.query("courses", [
  { field: "teacherId", operator: "==", value: "teacher-uid-123" },
  { field: "status", operator: "==", value: "published" }
]);

// Get high-performance students
const highPerformers = await firestoreService.query("analytics", [
  { field: "performanceScore", operator: ">=", value: 80 }
]);
*/

// Example 3: Batch Operations (Multiple Updates at Once)
// ───────────────────────────────────────────────────────────────

/*
export async function enrollStudentInMultipleCourses(
  uid: string,
  courseIds: string[]
) {
  const operations = courseIds.map((courseId) => ({
    type: "set" as const,
    collection: `users/${uid}/enrollments`,
    docId: courseId,
    data: {
      courseId,
      status: "active",
      progress: 0
    }
  }));

  await firestoreService.batch(operations);
}
*/

// Example 4: Working with Subcollections
// ───────────────────────────────────────────────────────────────

/*
// Get all lessons in a course
const lessons = await firestoreService.getSubcollection(
  "courses",
  "course-id-123",
  "lessons"
);

// Add a new lesson to a course
const lessonId = await firestoreService.createSubdocument(
  "courses",
  "course-id-123",
  "lessons",
  {
    title: "Introduction to Algebra",
    duration: 45,
    content: "..."
  }
);
*/

// Example 5: Advanced Querying with Ordering and Limits
// ───────────────────────────────────────────────────────────────

/*
// Get top 10 performing students
const topStudents = await firestoreService.queryWithOrder(
  "analytics",
  [{ field: "role", operator: "==", value: "student" }],
  [{ field: "performanceScore", direction: "desc" }]
);

// Limit results
const recentCourses = await firestoreService.queryLimit(
  "courses",
  [{ field: "status", operator: "==", value: "published" }],
  10
);
*/

// ═══════════════════════════════════════════════════════════════
// API ENDPOINTS REFERENCE
// ═══════════════════════════════════════════════════════════════

/*

GET /api/firestore/:collection/:docId
  Get a single document
  Example: GET /api/firestore/users/user-123

GET /api/firestore/:collection
  Get all documents in a collection
  Example: GET /api/firestore/courses

POST /api/firestore/:collection
  Create a new document
  Example: POST /api/firestore/courses
  Body: { "title": "Math 101", "description": "..." }

PUT /api/firestore/:collection/:docId
  Update a document (merge)
  Example: PUT /api/firestore/courses/course-123
  Body: { "title": "Updated Title" }

PATCH /api/firestore/:collection/:docId
  Patch specific fields
  Example: PATCH /api/firestore/courses/course-123
  Body: { "status": "published" }

DELETE /api/firestore/:collection/:docId
  Delete a document
  Example: DELETE /api/firestore/courses/course-123

POST /api/firestore/:collection/query
  Query documents with conditions
  Example: POST /api/firestore/courses/query
  Body: {
    "conditions": [
      { "field": "status", "operator": "==", "value": "published" },
      { "field": "teacherId", "operator": "==", "value": "teacher-123" }
    ]
  }

POST /api/firestore/batch
  Batch operations
  Body: {
    "operations": [
      { "type": "set", "collection": "courses", "docId": "c1", "data": {...} },
      { "type": "delete", "collection": "courses", "docId": "c2" }
    ]
  }

*/

// ═══════════════════════════════════════════════════════════════
// FIRESTORE DATA STRUCTURE (RECOMMENDED)
// ═══════════════════════════════════════════════════════════════

/*

users/
  {uid}/
    fullName: string
    email: string
    role: "student" | "teacher" | "parent"
    createdAt: timestamp
    updatedAt: timestamp
    settings/
      profile/
        - phone: string
        - timezone: string
        - notifications: boolean
      preferences/
        - theme: "light" | "dark" | "system"
        - language: string
    enrollments/
      {courseId}/
        - enrolledAt: timestamp
        - status: "active" | "completed" | "dropped"
        - progress: number (0-100)

courses/
  {courseId}/
    title: string
    description: string
    teacherId: string (uid)
    status: "draft" | "published" | "archived"
    createdAt: timestamp
    lessons/
      {lessonId}/
        - title: string
        - duration: number (minutes)
        - content: string
    students/
      {uid}/
        - enrolledAt: timestamp
        - progress: number

analytics/
  {uid}/
    totalStudyTime: number (minutes)
    performanceScore: number (0-100)
    lastActive: timestamp
    metrics/
      dailyActivity/
        - type: "study_session" | "quiz" | "assignment"
        - duration: number

*/

export {};
