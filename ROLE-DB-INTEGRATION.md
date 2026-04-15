# Teacher and Parent Pages Database Integration

Teacher and parent pages read content from Firestore documents.

## Required Teacher Routes
- /teacher/dashboard
- /teacher/interventions

## Required Parent Routes
- /parent/dashboard
- /parent/inbox

## Firestore Paths
For teacher id from `NEXT_PUBLIC_TEACHER_ID` (default: `default-teacher`), create:
- teachers/{teacherId}/pages/dashboard
- teachers/{teacherId}/pages/interventions

For parent id from `NEXT_PUBLIC_PARENT_ID` (default: `default-parent`), create:
- parents/{parentId}/pages/dashboard
- parents/{parentId}/pages/inbox

## Data Contract Source
- src/lib/role-content.ts

## Seed Data Source
- src/lib/role-seed-data.ts

## Optional Dev Seed Helper
- src/lib/seed-role-pages.ts

Example usage in a client-side admin/dev utility:
1. Import `seedTeacherPages` and `seedParentPages` from `src/lib/seed-role-pages.ts`
2. Run `await seedTeacherPages("default-teacher")`
3. Run `await seedParentPages("default-parent")`

## Environment Variables
Set all Firebase values in local env:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_TEACHER_ID (optional)
- NEXT_PUBLIC_PARENT_ID (optional)

## Runtime Behavior
- If the page document exists: all displayed names, numbers, and sentence content render from Firestore.
- If missing: page shows a database state card with the exact missing document path.