# Firestore Setup & Verification Guide

## Overview

This guide explains how to ensure your Firestore database has the correct collection structure and that data is properly registered.

## Collection Structure

The Sankalp AEI frontend expects the following Firestore structure:

### Collections (Top Level)

```
users/
  {uid}/
    uid: string
    email: string
    role: "STUDENT" | "TEACHER" | "PARENT"
    createdAt: Timestamp
    updatedAt: Timestamp

teachers/
  {teacherId}/
    uid: string
    email: string
    role: "TEACHER"
    createdAt: Timestamp
    updatedAt: Timestamp
    pages/
      dashboard/
        brandLabel: string
        navItems: Array<{href: string, label: string}>
        hero: {eyebrow: string, title: string, subtitle: string, ...}
        sections: {...}
        classSnapshot: Array<...>
        atRiskLearners: Array<...>
        ... (see role-seed-data.ts)
      interventions/
        ... (similar structure to dashboard)

parents/
  {parentId}/
    uid: string
    email: string
    role: "PARENT"
    createdAt: Timestamp
    updatedAt: Timestamp
    pages/
      dashboard/
        ... (similar structure to teacher dashboard)
      inbox/
        ... (similar structure to dashboard)

students/
  {studentId}/
    uid: string
    email: string
    role: "STUDENT"
    createdAt: Timestamp
    updatedAt: Timestamp
    pages/
      dashboard/
        ... (see student-seed-data.ts)
      insights/
      curriculum/
      assessments/
      ai-companion/
```

## How Data is Seeded

When a user signs up through the `/auth/signup` page:

1. `signUpWithFirebase()` is called with email, password, and role
2. Firebase Auth creates a user account
3. `initializeUserData()` is called with the UID, email, and role
4. `initializeUserData()` now **automatically** calls the appropriate seed function:
   - `seedTeacherPages(uid)` for TEACHER role
   - `seedParentPages(uid)` for PARENT role
   - `seedStudentPages(uid)` for STUDENT role
5. Seed functions write page documents with pre-built content from `role-seed-data.ts` and `student-seed-data.ts`

## Verification & Troubleshooting

### Quick Verification Checklist

You can use the verification utilities in the frontend:

#### In the Browser Console

```javascript
// Import these utilities
import { verifyFirestoreStructure, getFirestoreReport } from "@/lib/firestore-verify";
import { verifyUserRoleData } from "@/lib/firestore-verify";
import { getSeedingStatusReport } from "@/lib/firestore-seed-utility";

// Run complete verification
const verification = await verifyFirestoreStructure();
console.log(verification);

// Get a formatted report
const report = await getFirestoreReport();
console.log(report);

// Check a specific user's data
const userCheck = await verifyUserRoleData("user-id-here", "STUDENT");
console.log(userCheck);

// Get seeding status for all roles
const status = await getSeedingStatusReport();
console.log(status);
```

#### Common Issues & Fixes

**Issue 1: "Database document missing at teachers/user-id/pages/dashboard"**

**Cause:** The user was created before the seed functions were being called.

**Fix:** Manually seed the user by running in the browser console:

```javascript
import { seedUserPages } from "@/lib/firestore-seed-utility";

await seedUserPages("user-id-here", "TEACHER"); // or PARENT or STUDENT
```

---

**Issue 2: Collections exist but are empty**

**Cause:** Either no users have signed up yet, or users signed up before seeding was implemented.

**Fix:** Seed all users in a role collection:

```javascript
import { seedAllUsersByRole } from "@/lib/firestore-seed-utility";

// This will seed all teachers
const result = await seedAllUsersByRole("teachers");
console.log(result);
// { totalUsers: 5, successCount: 5, failedCount: 0, failures: [] }
```

---

**Issue 3: Partial data in a user's account (some pages missing)**

**Cause:** User signed up during a period when only partial seeding was working.

**Fix:** Reseed the user (overwrites existing pages):

```javascript
import { reseedUserPages } from "@/lib/firestore-seed-utility";

await reseedUserPages("user-id-here", "STUDENT");
```

---

**Issue 4: Need to check what pages a user is missing**

**Cause:** Debugging incomplete seeding.

**Solution:** Check individual user pages:

```javascript
import { checkUserPages } from "@/lib/firestore-seed-utility";

const pages = await checkUserPages("user-id-here", "TEACHER");
console.log(pages);
// {
//   hasAllPages: false,
//   presentPages: ["dashboard"],
//   missingPages: ["interventions"]
// }
```

---

## Firestore Rules Verification

If you get "permission-denied" errors, check your Firestore Security Rules. The frontend expects these basic read permissions:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own user document
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    // Users can read their own role document and subrules
    match /teachers/{teacherId} {
      allow read, write: if request.auth.uid == teacherId;
      match /pages/{document=**} {
        allow read: if request.auth.uid == teacherId;
      }
    }

    match /parents/{parentId} {
      allow read, write: if request.auth.uid == parentId;
      match /pages/{document=**} {
        allow read: if request.auth.uid == parentId;
      }
    }

    match /students/{studentId} {
      allow read, write: if request.auth.uid == studentId;
      match /pages/{document=**} {
        allow read: if request.auth.uid == studentId;
      }
    }
  }
}
```

## Administrative Tools

### Manually Verify Collections via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Check for these collections:
   - `users`
   - `teachers`
   - `parents`
   - `students`

5. For each role collection, click to expand and verify:
   - Documents exist (one per user)
   - Each document has a `pages` sub-collection
   - Each `pages` sub-collection contains the expected page documents:
     - Teachers: `dashboard`, `interventions`
     - Parents: `dashboard`, `inbox`
     - Students: `dashboard`, `insights`, `curriculum`, `assessments`, `ai-companion`

### Bulk Seeding via Custom Script

If you need to seed many existing users, you can create a custom Cloud Function or use the Admin SDK. Example Node.js script:

```bash
# From the root of your project
node scripts/firestore-seed-admin.js
```

See [FIRESTORE-STRUCTURE-GUIDE.md](./FIRESTORE-STRUCTURE-GUIDE.md) for admin script details.

## Schema Documentation

For detailed schema information, see:
- [role-seed-data.ts](./src/lib/role-seed-data.ts) - Teacher and Parent page templates
- [student-seed-data.ts](./src/lib/student-seed-data.ts) - Student page templates
- [role-content.ts](./src/lib/role-content.ts) - Type definitions for role data
- [student-content.ts](./src/lib/student-content.ts) - Type definitions for student data

## Testing the Complete Flow

1. **Create a test user**: Go to `/auth/signup`, fill in the form with a test email/password, select a role
2. **Verify seeding**: Wait 2-3 seconds, then run in the browser console:
   ```javascript
   import { verifyUserRoleData } from "@/lib/firestore-verify";
   const user = await verifyUserRoleData("your-new-user-uid", "STUDENT");
   console.log(user);
   ```
3. **Check Firestore Console**: Navigate to your Firestore and verify the documents appear
4. **Test the UI**: Log in with the test account and navigate to different pages to see the seeded content

## Moving Forward

- The seeding now happens **automatically** on signup
- New users will have all required page data immediately
- For existing users, use the utilities provided to manually seed if needed
- Monitor logs for any seed failures during signup

