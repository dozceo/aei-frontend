# Firestore Structure - User Data & Roles

## Collection Hierarchy

After a user signs up, the following documents are created in Firestore:

```
firestore-root/
├── users/
│   └── {uid}/
│       ├── uid: "abc123def456"
│       ├── email: "student@example.com"
│       ├── role: "STUDENT"
│       ├── createdAt: Timestamp
│       └── updatedAt: Timestamp
│
├── students/
│   └── {uid}/
│       ├── uid: "abc123def456"
│       ├── email: "student@example.com"
│       ├── role: "STUDENT"
│       ├── createdAt: Timestamp
│       ├── updatedAt: Timestamp
│       └── pages/ (sub-collection) ← Dashboard content seeded here
│           ├── dashboard
│           ├── missions
│           ├── progress
│           └── ...
│
├── teachers/
│   └── {uid}/
│       ├── uid: "def789ghi012"
│       ├── email: "teacher@example.com"
│       ├── role: "TEACHER"
│       ├── createdAt: Timestamp
│       ├── updatedAt: Timestamp
│       └── pages/ (sub-collection) ← Dashboard content seeded here
│           ├── dashboard
│           ├── interventions
│           ├── classperformance
│           └── ...
│
└── parents/
    └── {uid}/
        ├── uid: "ghi012jkl345"
        ├── email: "parent@example.com"
        ├── role: "PARENT"
        ├── createdAt: Timestamp
        ├── updatedAt: Timestamp
        └── pages/ (sub-collection) ← Dashboard content seeded here
            ├── dashboard
            ├── monitoring
            ├── notifications
            └── ...
```

## Data Creation Timeline

### Step 1: User Signs Up (Frontend)
```typescript
// User fills form: email, password, role
// Clicks "Sign up"
await signUpWithFirebase(email, password, "STUDENT")
```

### Step 2: Firebase Auth User Created
```typescript
// Firebase creates a user with UID
const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
// credential.user.uid = "abc123def456"
```

### Step 3: Firestore Documents Created
```typescript
// initializeUserData() is called automatically
await initializeUserData(
  "abc123def456",
  "student@example.com", 
  "STUDENT"
)
```

**Documents created:**
1. `/users/abc123def456` - Main user record
2. `/students/abc123def456` - Role-specific record

Both contain:
```json
{
  "uid": "abc123def456",
  "email": "student@example.com",
  "role": "STUDENT",
  "createdAt": 2024-04-17T10:30:00Z,
  "updatedAt": 2024-04-17T10:30:00Z
}
```

### Step 4: Session Set & Redirect
```typescript
// Role cookie set
setRoleSession("STUDENT")

// Redirect to dashboard
window.location.href = "/student/dashboard"
```

### Step 5: Dashboard Loads Data
When the student dashboard loads:

```typescript
// useStudentPageContent("dashboard") is called
// 1. useAuthUserId() checks Firebase Auth state
// 2. Gets "abc123def456" from firebaseAuth.currentUser.uid
// 3. Subscribes to /students/abc123def456/pages/dashboard
// 4. Firestore returns the page content document
```

## Frontend Content Access Pattern

### Before (Hardcoded)
```typescript
// All users regardless of login status accessed this:
const studentId = "default-student"; // Hardcoded
const path = `students/${studentId}/pages/dashboard`;
// Result: All students see the same hardcoded student's data
```

### After (Dynamic)
```typescript
// Each user accesses their own data:
const studentId = useAuthUserId(); // "abc123def456" from Auth
const path = `students/${studentId}/pages/dashboard`;
// Result: Each student sees ONLY their own data
```

## Security Benefits

1. **Data Isolation**: Each user can only access `/{collection}/{theirUid}/*`
2. **Firestore Rules**: Can enforce `uid == request.auth.uid` in rules
3. **No Default IDs**: No risk of exposing default/test data
4. **Per-User Paths**: URL structures reflect actual user ownership

## Backend Context Building

When a logged-in user makes a backend request:

```typescript
// Frontend
const token = await getCurrentIdToken(); // Firebase JWT
fetch("/api/interventions", {
  headers: { "Authorization": `Bearer ${token}` }
})

// Backend - rbac.ts
const userId = token.claims.sub; // "abc123def456"
const userDoc = await db.collection("users").doc(userId).get();
const userData = userDoc.data(); // Gets role, email, etc.
// ✅ User context built successfully
// Backend now knows user's role and can enforce permissions
```

## Seed Data (Optional)

After signup, you may want to seed role-specific page content:

```typescript
import { seedStudentPages } from "@/lib/seed-student-pages";

// After user signs up:
await seedStudentPages(uid); // Creates /students/{uid}/pages/{pageKey} for each page

// Now the dashboard has initial content
```

## Example: Complete Signup → Data Flow

### Alan signs up as a STUDENT

1. **Form Submission**
   - Email: `alan@school.edu`
   - Password: `****`
   - Role: `STUDENT`

2. **Firebase Creates User**
   - UID: `user_alan_1234`

3. **User Initialization**
   - Creates `/users/user_alan_1234`
   - Creates `/students/user_alan_1234`

4. **Redirect to Dashboard**
   - URL: `/student/dashboard`

5. **Dashboard Page Loads**
   - `useStudentPageContent("dashboard")` mounts
   - `useAuthUserId()` returns `"user_alan_1234"`
   - Subscribes to `/students/user_alan_1234/pages/dashboard`
   - Real-time updates for Alan's dashboard content

6. **Backend API Call** (e.g., submit tracking event)
   - Request includes bearer token
   - Backend verifies JWT → uid = `user_alan_1234`
   - Creates tracking event for this student
   - Path: `/tracking_events` or `/students/user_alan_1234/tracking`

### Beatrice signs up as a TEACHER

Same flow, but:
- UID: `user_beatrice_5678`
- Role-specific doc: `/teachers/user_beatrice_5678`
- Hook: `useTeacherPageContent("dashboard")`
- Path: `/teachers/user_beatrice_5678/pages/dashboard`

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **User Data Path** | Hardcoded IDs | Dynamic UID-based |
| **Data Isolation** | Shared "default" data | Per-user isolation |
| **Security** | No user context | Full user context available |
| **Multi-user** | All see same data | Each sees own data |
| **Backend Support** | Expects `/users/{uid}` | Receives UID via JWT |
| **Scaling** | Doesn't scale | Scales to unlimited users |
