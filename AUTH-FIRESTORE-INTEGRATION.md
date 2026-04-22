# Authentication & Firestore Integration Guide

## Overview

The authentication flow works as follows:

```
1. User signs up via /auth/signup with email, password, and role
2. signUpWithFirebase() is called
3. Firebase Auth creates user account
4. initializeUserData() is called
5. Creates user document in "users" collection
6. Creates role-specific document in "teachers|parents|students" collection
7. Calls appropriate seed function (seedTeacherPages, seedParentPages, or seedStudentPages)
8. Seed functions write page documents to "pages" sub-collection
9. Session cookies are set
10. User is redirected to dashboard
```

## Testing the Complete Flow

### Step 1: Prerequisites

Ensure your `.env.local` has Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

Check that your Firestore Rules allow writes:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to write during signup
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

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

### Step 2: Test Signup

1. Go to http://localhost:3000/auth/signup
2. Fill in:
   - Email: `test-student-123@example.com` (use a unique email each time)
   - Password: `TestPassword123456`
   - Confirm Password: `TestPassword123456`
   - Role: Select "Student"
3. Check "I agree with the terms..." checkbox
4. Click "Create Account"

### Step 3: Monitor Logs

Open the **browser developer console** (F12) and look for messages:

**Success messages (you should see these):**
```
✓ User created in Firebase Auth. UID: abc123xyz
→ Initializing Firestore data for user...
✓ Firestore data initialized successfully for STUDENT
```

**If you see these errors instead:**

**Error: "Firebase auth is not configured"**
- Check that all `NEXT_PUBLIC_FIREBASE_*` env vars are set
- Restart the dev server after changing env vars

**Error: "Firebase Firestore is not configured"**
- Same as above - firebase-client.ts cannot initialize

**Error: "Account created but failed to initialize user data in Firestore"**
- Check Firestore Rules (permission denied)
- Check that Firestore is enabled in Firebase Console

### Step 4: Verify Firestore Created Data

After successful signup:

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Verify these collections and documents exist:

**users collection:**
```
users/{uid}
  uid: "abc123xyz"
  email: "test-student-123@example.com"
  role: "STUDENT"
  createdAt: Timestamp
  updatedAt: Timestamp
```

**students collection:**
```
students/{uid}
  uid: "abc123xyz"
  email: "test-student-123@example.com"
  role: "STUDENT"
  createdAt: Timestamp
  updatedAt: Timestamp
  pages/
    dashboard/ { ...full page content... }
    insights/ { ...full page content... }
    curriculum/ { ...full page content... }
    assessments/ { ...full page content... }
    ai-companion/ { ...full page content... }
```

### Step 5: Verify Dashboard Loads

If signup succeeds, you should be redirected to `/student/dashboard`. 

Check browser console for any "Database document missing" errors. If you see them:
- The user was created but pages weren't seeded
- Run the seeding utility (see below)

## Troubleshooting

### Scenario 1: User created, but Firestore is empty

**Cause:** User was created before seeding was implemented, or seeding failed silently

**Solution:** In browser console:
```javascript
import { seedStudentPages } from "@/lib/seed-student-pages";
import { seedTeacherPages } from "@/lib/seed-role-pages";
import { seedParentPages } from "@/lib/seed-role-pages";

// For a student user:
await seedStudentPages("user-uid-here");

// For a teacher user:
await seedTeacherPages("user-uid-here");

// For a parent user:
await seedParentPages("user-uid-here");
```

**Check if it worked:**
```javascript
import { verifyUserRoleData } from "@/lib/firestore-verify";
const result = await verifyUserRoleData("user-uid-here", "STUDENT");
console.log(result);
```

### Scenario 2: "Permission denied" when signing up

**Possible causes:**
1. Firestore Rules don't allow the write
2. User is not authenticated (shouldn't happen in this flow)
3. The collection path is incorrect

**Solution:**
1. Update Firestore Rules (see Step 1 above)
2. Check browser console for exact error message
3. Verify the user document path is correct: `users/{uid}` not `user/{uid}`

### Scenario 3: Signup redirects to dashboard but shows "Database document missing"

**Cause:** User/role document created, but page documents weren't seeded

**Solution:** Reseed manually:
```javascript
import { reseedUserPages } from "@/lib/firestore-seed-utility";
await reseedUserPages("user-uid-here", "STUDENT"); // or TEACHER or PARENT
```

### Scenario 4: Sign-in fails with "No account found with this email"

**Cause:** The email doesn't exist in Firebase Auth

**Solution:** Create a new account at `/auth/signup`

### Scenario 5: Sign-in fails with "Incorrect password"

**Cause:** The password is wrong

**Solution:** Use the correct password or reset it via `/auth/forgot-password`

## Manual Testing Commands

### In Browser Console

**Test 1: Check if Firebase is configured**
```javascript
import { isFirebaseConfigured, db, firebaseAuth } from "@/lib/firebase-client";
console.log("Firebase configured:", isFirebaseConfigured);
console.log("Firestore available:", !!db);
console.log("Auth available:", !!firebaseAuth);
```

**Test 2: Get current user**
```javascript
import { firebaseAuth } from "@/lib/firebase-client";
console.log("Current user:", firebaseAuth?.currentUser);
```

**Test 3: Read a user document**
```javascript
import { getDocument } from "@/lib/firestore-ops";
const userDoc = await getDocument("users", "user-uid-here");
console.log(userDoc);
```

**Test 4: Check all user pages**
```javascript
import { checkUserPages } from "@/lib/firestore-seed-utility";
const pages = await checkUserPages("user-uid-here", "STUDENT");
console.log(pages);
// {
//   hasAllPages: true,
//   presentPages: ["dashboard", "insights", "curriculum", "assessments", "ai-companion"],
//   missingPages: []
// }
```

**Test 5: Full verification report**
```javascript
import { getFirestoreReport } from "@/lib/firestore-verify";
const report = await getFirestoreReport();
console.log(report);
```

**Test 6: Verify a specific user's complete data**
```javascript
import { verifyUserRoleData } from "@/lib/firestore-verify";
const check = await verifyUserRoleData("user-uid-here", "STUDENT");
console.log(check);
// {
//   userDocExists: true,
//   roleDocExists: true,
//   pagesExist: {
//     dashboard: true,
//     insights: true,
//     curriculum: true,
//     assessments: true,
//     "ai-companion": true
//   },
//   errors: []
// }
```

## Monitoring in Production

Add this to your error logging service to monitor signup failures:

```typescript
// In your error handler or logging middleware
try {
  await signUpWithFirebase(email, password, role);
} catch (error) {
  logToSentry({
    tags: {
      component: "signup",
      stage: error.message.includes("Account created")
        ? "firestore-initialization"
        : "firebase-auth",
    },
    message: error.message,
  });
}
```

## Environment Variable Checklist

Before deploying, verify all these are in:
- `.env.local` (for local development)
- `.env.production.local` (for production testing)
- Firebase App Hosting environment (for Firebase deploy)

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Run this to check if they're available:
```bash
node -e "
const keys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];
keys.forEach(k => console.log(k + ':', process.env[k] ? '✓' : '✗'));
" 
```

## Summary

The authentication flow is now fully integrated with Firestore:
1. ✅ Signup creates Firebase Auth user
2. ✅ Creates user document in Firestore
3. ✅ Creates role-specific document in Firestore
4. ✅ Automatically seeds page content (5 student pages, 2 teacher/parent pages)
5. ✅ Enhanced error logging for debugging
6. ✅ All data is immediately available for dashboard loading

If users see "Database document missing" errors after signup, use the manual seeding utilities provided to fix them.
