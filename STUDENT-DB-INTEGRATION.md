# Student Pages Database Integration

This frontend reads student page content from Firestore documents.

## Required Student Routes
- /student/dashboard
- /student/insights
- /student/curriculum
- /student/assessments
- /student/ai-companion

## Firestore Paths
For student id from `NEXT_PUBLIC_STUDENT_ID` (default: `default-student`), create:
- students/{studentId}/pages/dashboard
- students/{studentId}/pages/insights
- students/{studentId}/pages/curriculum
- students/{studentId}/pages/assessments
- students/{studentId}/pages/ai-companion

## Data Contract Source
- `src/lib/student-content.ts`

## Seed Data Source
- `src/lib/student-seed-data.ts`

## Optional Dev Seed Helper
- `src/lib/seed-student-pages.ts`

Example usage in a client-side admin/dev utility:
1. Import `seedStudentPages` from `src/lib/seed-student-pages.ts`
2. Run `await seedStudentPages("default-student")`

## Environment Variables
Set all Firebase values in local env:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_STUDENT_ID (optional)

## Runtime Behavior
- If the page document exists: all names, numbers, and sentences render from Firestore content.
- If missing: page shows database state card with exact missing document path.
