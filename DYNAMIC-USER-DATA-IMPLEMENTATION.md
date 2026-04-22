# Dynamic User Data Creation - Implementation Summary

## Overview
This implementation replaces hardcoded role-based user IDs with dynamic authentication-based paths, ensuring each user's data is created under `/users/{uid}`, `/students/{uid}`, `/teachers/{uid}`, or `/parents/{uid}` directories.

## Changes Made

### 1. Backend Changes (Frontend Firestore Operations)

#### New File: `src/lib/user-initialization-db.ts`
- **Purpose**: Initialize user documents when a new account is created
- **Function**: `initializeUserData(uid, email, role)`
- **Creates**:
  - Main user document at `/users/{uid}` 
  - Role-specific document at `/{role_collection}/{uid}` (e.g., `/students/{uid}`)
  - Both documents include: uid, email, role, createdAt, updatedAt timestamps

#### Modified: `src/lib/auth-client.ts`
- **Change**: Updated `signUpWithFirebase()` to call `initializeUserData()` after user account creation
- **Flow**: 
  1. Create Firebase Auth user
  2. Initialize Firestore documents with user's UID
  3. Set role session
  4. Return sign-in result

### 2. Frontend Hook Changes

#### New File: `src/hooks/useAuthUserId.ts`
- **Purpose**: Get the currently authenticated user's UID
- **Returns**: `string | null` - user's UID or null if not authenticated
- **Behavior**: Returns null while auth state is loading, then returns the UID once authenticated

#### Modified: `src/hooks/useStudentPageContent.ts`
- **Before**: Used `process.env.NEXT_PUBLIC_STUDENT_ID ?? "default-student"`
- **After**: Uses `useAuthUserId()` hook to get current user's UID
- **Benefit**: Each student accesses their own `/students/{uid}/pages/{pageKey}` data

#### Modified: `src/hooks/useRolePageContent.ts`
- **Before**: Used `NEXT_PUBLIC_TEACHER_ID` or `NEXT_PUBLIC_PARENT_ID` environment variables
- **After**: Uses `useAuthUserId()` hook for both teacher and parent pages
- **Benefit**: Each teacher/parent accesses their own `/teachers/{uid}/pages/{pageKey}` or `/parents/{uid}/pages/{pageKey}` data

### 3. Configuration Changes

#### Updated: `.env`
- **Change**: Commented out hardcoded role IDs
- **Status**: These are now DEPRECATED but kept for backward compatibility
- **Note**: New code uses auth.currentUser.uid

#### Updated: `apphosting.yaml`
- **Change**: Commented out hardcoded role ID environment variables
- **Status**: No longer required for deployment

## Data Structure

### Before (Hardcoded)
```
/students/default-student/pages/{pageKey}
/teachers/default-teacher/pages/{pageKey}
/parents/default-parent/pages/{pageKey}
```

### After (Dynamic per User)
```
/users/{uid}/ (basic user info)
/students/{uid}/pages/{pageKey} (student-specific data)
/teachers/{uid}/pages/{pageKey} (teacher-specific data)
/parents/{uid}/pages/{pageKey} (parent-specific data)
```

## Signup Flow

1. User enters email, password, and selects role on `/auth/signup`
2. `handleSignup()` calls `signUpWithFirebase(email, password, role)`
3. In `signUpWithFirebase()`:
   - Create Firebase Auth user
   - Call `initializeUserData(uid, email, role)` to create:
     - `/users/{uid}` document
     - `/{roleCollection}/{uid}` document  
   - Set session cookies
4. User is redirected to their role's dashboard

## Page Content Loading

1. Dashboard component mounts and renders hooks (e.g., `useStudentPageContent()`)
2. `useAuthUserId()` checks Firebase Auth state:
   - If loading: returns `null`, hook shows loading state
   - If authenticated: returns user's UID
3. Hook subscribes to real-time Firestore data at dynamic path:
   - `/students/{currentUserUid}/pages/{pageKey}`
4. Data is loaded and displayed once available

## Backward Compatibility

- Old environment variables are still defined but commented out in `.env`
- Code no longer uses these variables
- If needed for testing/development, they can be uncommented and custom hooks created

## Migration Notes

- **Existing Data**: Users signing up for the first time will have data auto-created
- **Legacy Data**: Seed functions still support manual seeding with custom IDs
- **Testing**: Remove environment variable dependencies when writing tests - use `useAuthUserId()` instead

## Files Modified

1. ✅ `src/lib/user-initialization-db.ts` - NEW
2. ✅ `src/hooks/useAuthUserId.ts` - NEW
3. ✅ `src/lib/auth-client.ts` - Modified
4. ✅ `src/hooks/useStudentPageContent.ts` - Modified
5. ✅ `src/hooks/useRolePageContent.ts` - Modified
6. ✅ `.env` - Updated comments
7. ✅ `apphosting.yaml` - Updated comments
