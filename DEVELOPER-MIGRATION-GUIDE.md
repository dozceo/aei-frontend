# Developer Migration Guide - Dynamic User Data

## For Frontend Developers

### You are Working With

Your app now uses **authenticated user UIDs** instead of hardcoded IDs. This means:
- Each logged-in user gets their own isolated data
- Data paths are dynamic: `/students/{uid}` instead of `/students/default-student`
- No more need for `NEXT_PUBLIC_STUDENT_ID`, `NEXT_PUBLIC_TEACHER_ID`, `NEXT_PUBLIC_PARENT_ID`

### If You're Writing New Components

#### Getting Current User's UID
```typescript
import { useAuthUserId } from "@/hooks/useAuthUserId";

export function MyComponent() {
  const userId = useAuthUserId(); // Get current user's UID
  
  if (!userId) {
    return <p>Loading authentication...</p>;
  }
  
  // userId is now available and can be used for Firestore paths
  return <div>User ID: {userId}</div>;
}
```

#### Accessing User-Specific Data
```typescript
import { useAuthUserId } from "@/hooks/useAuthUserId";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export function MyDataComponent() {
  const userId = useAuthUserId();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (!userId) return; // Wait for auth
    
    // Subscribe to user's data
    const unsubscribe = onSnapshot(
      doc(db, "students", userId, "pages", "mypage"),
      (doc) => {
        setData(doc.data());
      }
    );
    
    return () => unsubscribe();
  }, [userId]);
  
  return <div>{/* Render data */}</div>;
}
```

#### Creating Records for Current User
```typescript
import { useAuthUserId } from "@/hooks/useAuthUserId";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export async function createUserNote(noteText: string) {
  const userId = useAuthUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }
  
  // Create document in user's personal collection
  await addDoc(
    collection(db, "students", userId, "notes"),
    {
      text: noteText,
      createdAt: serverTimestamp(),
    }
  );
}
```

### If You're Modifying Existing Components

**Old Pattern** (with hardcoded ID):
```typescript
// ❌ OLD - Don't do this anymore
const studentId = process.env.NEXT_PUBLIC_STUDENT_ID ?? "default-student";
const path = `students/${studentId}/pages/dashboard`;
```

**New Pattern** (with authenticated UID):
```typescript
// ✅ NEW - Do this instead
const userId = useAuthUserId();
const path = userId ? `students/${userId}/pages/dashboard` : null;
```

### Environment Variables Changed

| Variable | Status | Replacement |
|----------|--------|-------------|
| `NEXT_PUBLIC_STUDENT_ID` | ❌ DEPRECATED | Use `useAuthUserId()` |
| `NEXT_PUBLIC_TEACHER_ID` | ❌ DEPRECATED | Use `useAuthUserId()` |
| `NEXT_PUBLIC_PARENT_ID` | ❌ DEPRECATED | Use `useAuthUserId()` |

If you see these in `.env`, they're no longer used. They're commented out for backward compatibility.

## For Backend Developers

### What Changed on Frontend

The frontend now creates user documents in Firestore at signup:

```
Firestore Collections Created:
├── /users/{uid}
│   └── {uid, email, role, createdAt, updatedAt}
│
├── /students/{uid}
│   └── {uid, email, role, createdAt, updatedAt, pages/*}
│
├── /teachers/{uid}
│   └── {uid, email, role, createdAt, updatedAt, pages/*}
│
└── /parents/{uid}
    └── {uid, email, role, createdAt, updatedAt, pages/*}
```

### Your Backend Code is Unaffected

The `buildUserContext()` in `rbac.ts` continues to work because:

1. Frontend creates `/users/{uid}` when user signs up
2. Backend queries `/users/{uid}` to build user context
3. No changes needed—it already works!

```typescript
// In rbac.ts - still works with new data structure
export async function buildUserContext(userId: string): Promise<UserContext> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data(); // Gets {uid, email, role, ...}
  // ✅ Everything works as before
}
```

### Recommended: Add Firestore Rules

Now that users have their own data paths, secure them:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Each user can only read/write their own data
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
    match /students/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
    match /teachers/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
    match /parents/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

### If You Query User Data

```typescript
// Frontend sends JWT with request
const token = headers.get("Authorization"); // Bearer {jwt}
const userId = token.claims.sub; // Extract UID from JWT

// Query user data - automatically isolated
const userDoc = await db.collection('users').doc(userId).get();
const userData = userDoc.data();
// ✓ Only gets the authenticated user's data
```

## For QA/Testing Teams

### What to Test

1. **Signup Creates Documents**
   - Create new account
   - Check Firestore `/users/{uid}` exists
   - Check role-specific collection has entry

2. **Data Isolation**
   - Create multiple accounts
   - Log in as each
   - Verify no data bleeding between users

3. **Dashboard Content**
   - Login as student → see student dashboard
   - Login as teacher → see teacher dashboard
   - Login as parent → see parent dashboard

4. **Authentication States**
   - New user → redirected to dashboard ✓
   - Existing user → can login ✓
   - Logged-out user → can't access protected pages ✓

5. **Backend Integration**
   - Protected API routes work ✓
   - User context available in requests ✓
   - Unauthorized requests rejected ✓

### Test Accounts Setup

Create test accounts for each role:
```
STUDENT:
  - Email: student.test@example.com
  - Expected UID: (auto-generated by Firebase)
  - Expected path: /students/{uid}/pages/...

TEACHER:
  - Email: teacher.test@example.com
  - Expected UID: (auto-generated by Firebase)
  - Expected path: /teachers/{uid}/pages/...

PARENT:
  - Email: parent.test@example.com
  - Expected UID: (auto-generated by Firebase)
  - Expected path: /parents/{uid}/pages/...
```

## For DevOps/Infrastructure

### No Infrastructure Changes

Nothing has changed in deployment or infrastructure:
- ✓ No new environment variables needed
- ✓ No new Firebase collections needed (auto-created)
- ✓ No new backend endpoints
- ✓ No scaling issues

### What Was Removed

The following are no longer needed in deployment:
- ❌ `NEXT_PUBLIC_STUDENT_ID`
- ❌ `NEXT_PUBLIC_TEACHER_ID`
- ❌ `NEXT_PUBLIC_PARENT_ID`

These have been commented out in:
- `.env`
- `apphosting.yaml`
- Cloud Run / deployment configuration

### Recommendations

1. **Update Firestore Rules** - See backend section
2. **Enable Firestore Monitoring** - Track document creation
3. **Set up Audit Logs** - Log Firestore changes
4. **Plan Cleanup** - Delete old "default" documents from testing

## Troubleshooting

### User Data Not Appearing in Firestore

**Symptom**: Signed up a user but can't find document in Firestore

**Possible Causes**:
1. Firebase not initialized in `.env`
2. Firestore not enabled in Firebase project
3. User creation failed silently

**Fix**:
```typescript
// Add logging to signUpWithFirebase()
try {
  await initializeUserData(uid, email, role);
  console.log("User initialized:", { uid, email, role });
} catch (error) {
  console.error("Failed to initialize user:", error);
  throw error; // Let signup fail with error message
}
```

### useAuthUserId() Returns Null

**Symptom**: Component using `useAuthUserId()` shows loading state forever

**Possible Causes**:
1. Firebase auth not initialized
2. User not actually logged in
3. Auth state listener removed

**Fix**:
```typescript
// Verify Firebase is configured
import { firebaseAuth } from "@/lib/firebase-client";
console.log("Firebase Auth initialized:", !!firebaseAuth);
console.log("Current user:", firebaseAuth?.currentUser);
```

### Dashboard Shows Empty Data

**Symptom**: Logged in but dashboard pages show "Document not found"

**Possible Causes**:
1. Seed data not created after signup
2. User document created but no page sub-collection
3. Firestore path mismatch

**Fix**:
1. Check Firestore: `/students/{uid}/pages/dashboard` exists?
2. Manually seed if needed:
   ```typescript
   const { seedStudentPages } = await import("@/lib/seed-student-pages");
   await seedStudentPages(userId);
   ```

## FAQ

**Q: Can I still use default IDs for testing?**
A: Yes, you can still manually create data with default IDs and seed pages. Just don't use environment variables—create custom hooks if needed.

**Q: What about existing users before this change?**
A: They'll need to re-signup or an admin script should create their documents. We can add a migration script if needed.

**Q: Do I need to change Firestore Security Rules?**
A: Not required, but strongly recommended. See backend section for recommended rules.

**Q: Will this affect performance?**
A: Slightly improved—each user loads only their own data instead of shared dummy data. Firestore grows with users but scales well.

---

**Version**: 1.0  
**Date**: April 17, 2026  
**Status**: ✅ Ready for Development
