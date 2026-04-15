# Frontend Firebase App Hosting Runbook

This frontend is ready to be hosted on Firebase App Hosting with Firebase Auth login enabled.

## 1. What is already wired

- Login now uses Firebase email/password auth in `src/app/login/page.tsx`.
- Role is resolved from Firebase custom claims (`role`) with selected-role fallback.
- Session cookies (`aei-auth`, `aei-role`) are still used for Next.js route middleware checks.
- Backend API helper in `src/lib/backend-client.ts` automatically attaches `Authorization: Bearer <Firebase ID token>`.

## 2. Firebase Console setup

1. Open Firebase Console for your project.
2. Go to Authentication -> Sign-in method.
3. Enable `Email/Password` provider.
4. Create test users (or migrate your users).

## 3. Set custom claims for roles

Custom role claim is optional but recommended so role routing is authoritative:

1. In backend repo, set env vars (`FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_PROJECT_ID`).
2. Run command:

```bash
npm run auth:set-claims -- <firebase_uid> <STUDENT|TEACHER|PARENT>
```

If claim is missing, login falls back to role chosen in UI.

## 4. App Hosting deployment (connected Git repo)

1. In Firebase Console, open App Hosting.
2. Create backend -> Connect this frontend repo (`sankalp-frontend`).
3. Set root directory to repository root.
4. Ensure `apphosting.yaml` is present (already added in this repo).
5. Configure secrets/environment values used by `apphosting.yaml`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_STUDENT_ID`
   - `NEXT_PUBLIC_TEACHER_ID`
   - `NEXT_PUBLIC_PARENT_ID`
6. Trigger first deploy.

## 5. Connect hosted frontend to hosted backend

Set `NEXT_PUBLIC_API_BASE_URL` in App Hosting to your deployed backend base URL (example: `https://sankalp-backend-xxxxx-uc.a.run.app`).

After deployment:

1. Open hosted frontend URL.
2. Login with Firebase user.
3. Call any backend endpoint through `backendRequest`/`backendGet`/`backendPost`.
4. Verify backend receives bearer token and passes `verifyAuth` middleware.

## 6. Local parity env

Keep `.env.local` aligned with hosted env values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_STUDENT_ID=default-student
NEXT_PUBLIC_TEACHER_ID=default-teacher
NEXT_PUBLIC_PARENT_ID=default-parent
```