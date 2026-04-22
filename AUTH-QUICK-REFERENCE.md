# Quick Reference: Authentication & Firestore

## The Problem We Fixed

Previously, authentication worked but data wasn't being saved to Firestore. Users would sign up, the account would be created in Firebase Auth, but the necessary Firestore documents weren't being created. This caused dashboard pages to show "Database document missing" errors.

## The Solution

We now automatically save user data to Firestore during signup:

1. **User signs up** → Email & password to Firebase Auth
2. **Auth succeeds** → User document created in Firestore
3. **Page content seeded** → Dashboard and other pages populated with data
4. **User logged in** → Dashboard loads with data immediately

## Testing

### Quick Test (1 minute)
```
1. Go to http://localhost:3000/auth/signup
2. Fill in form with unique email and password
3. Check browser console for ✓ success logs
4. Verify redirect to dashboard
```

### Full Verification (5 minutes)
```javascript
// In browser console
import { verifyUserRoleData } from "@/lib/firestore-verify";
await verifyUserRoleData("your-user-uid", "STUDENT");
// Should show all true values
```

### Problems?
Visit http://localhost:3000/diagnostics to debug.

## Files Changed

### Core Authentication
- `src/lib/auth-client.ts` - Enhanced error handling and logging

### Firestore Integration
- `src/lib/user-initialization-db.ts` - Now calls seed functions
- `src/lib/firestore-verify.ts` - New verification utilities
- `src/lib/firestore-seed-utility.ts` - New manual seeding tools

### UI Improvements
- `src/app/auth/signup/page.tsx` - Better error messages
- `src/app/diagnostics/page.tsx` - New self-service diagnostics
- `src/app/login/page.tsx` - Enhanced Firebase error messages

### Documentation
- `AUTH-FIRESTORE-INTEGRATION.md` - Complete integration guide
- `FIRESTORE-SETUP-VERIFICATION.md` - Setup and verification guide

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Firebase is not configured" | Check `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` vars |
| "Permission denied" | Update Firestore Rules (see AUTH-FIRESTORE-INTEGRATION.md) |
| User created but no data in Firestore | Run: `await seedStudentPages("user-uid")` in console |
| Dashboard shows "Database document missing" | Same as above - manual seed |
| Sign-in fails with "user not found" | Create new account at `/auth/signup` |

## How to Debug

1. **Browser Console** (F12)
   - Look for ✓ and ✗ messages during signup
   - Shows exactly where it fails (Auth vs Firestore)

2. **Diagnostics Page** (/diagnostics)
   - Automated system health checks
   - Shows Firebase config status
   - Lists collections and document counts

3. **Firebase Console**
   - Verify documents appear in Firestore
   - Check Security Rules allow reads/writes
   - Monitor Auth user list

## For Developers

### Adding Logging
Error messages now include helpful hints:
```
✗ Account created but failed to initialize user data in Firestore
  └─ If you see this, Firestore rules or config are likely the issue
```

### Manual Seeding (if needed)
```javascript
import { reseedUserPages } from "@/lib/firestore-seed-utility";
await reseedUserPages("user-uid-here", "STUDENT");  // or TEACHER or PARENT
```

### Bulk Seeding
```javascript
import { seedAllUsersByRole } from "@/lib/firestore-seed-utility";
await seedAllUsersByRole("students");  // seeds all existing students
```

## Before You Deploy

1. ✅ Test signup at `/auth/signup`
2. ✅ Check diagnostics at `/diagnostics`
3. ✅ Verify Firestore Rules are correct
4. ✅ Set all env vars in Firebase App Hosting config
5. ✅ Verify collections have sample data

## Key Files to Understand

| File | Purpose |
|------|---------|
| `firestore-ops.ts` | Low-level CRUD operations |
| `user-initialization-db.ts` | Creates user on signup |
| `seed-role-pages.ts` | Seeds teacher/parent pages |
| `seed-student-pages.ts` | Seeds student pages |
| `firestore-verify.ts` | Verification utilities |
| `firestore-seed-utility.ts` | Manual seeding tools |

## Firestore Collections Created

```
users/
  {uid}/
    uid: string
    email: string
    role: "STUDENT" | "TEACHER" | "PARENT"
    createdAt: Timestamp
    updatedAt: Timestamp

teachers/ | parents/ | students/
  {uid}/
    uid: string
    email: string
    role: string
    createdAt: Timestamp
    updatedAt: Timestamp
    pages/
      {pageKey}/
        ... (dashboard, inbox, interventions, etc)
```

## Support

- **Auth issues?** See `AUTH-FIRESTORE-INTEGRATION.md`
- **Firestore issues?** See `FIRESTORE-SETUP-VERIFICATION.md`
- **Diagnostic help?** Visit `/diagnostics` in your browser

---

**Status:** ✅ Authentication and Firestore fully integrated

The flow is automatic during signup. No manual intervention needed for new users.
