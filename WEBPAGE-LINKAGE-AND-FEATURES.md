# Webpage Linkage And Features Guide

## Scope
This document describes the currently implemented frontend pages in the Next.js app, including:
- What each page does
- Who can access it
- How users get to the page
- Where users can go next
- What major UI features are present
- Which data source each page uses

## Global Navigation And Access Rules
- Route-level access rules are defined in src/app/routes.ts.
- Middleware enforces auth and role using cookies:
  - aei-auth for authenticated state
  - aei-role for role state
- If a protected page is requested without auth, user is redirected to /login with a next query.
- If a protected page is requested with a wrong role, user is redirected to that role's home page.
- If an authenticated user opens /login, /auth/signup, or /auth/forgot-password, middleware redirects to role home.

## Data Source Model (Important)
- Student pages read Firestore directly from:
  - students/{studentId}/pages/{pageKey}
- Teacher pages read Firestore directly from:
  - teachers/{teacherId}/pages/{pageKey}
- Parent pages read Firestore directly from:
  - parents/{parentId}/pages/{pageKey}
- Profile settings are persisted at:
  - users/{uid}/settings/profile
- Preference settings are persisted at:
  - users/{uid}/settings/preferences
- Support tickets are persisted at:
  - support_tickets (filtered by uid)
- IDs are currently taken from environment variables with defaults:
  - NEXT_PUBLIC_STUDENT_ID (default-student)
  - NEXT_PUBLIC_TEACHER_ID (default-teacher)
  - NEXT_PUBLIC_PARENT_ID (default-parent)
- If data is missing or Firebase is not configured, pages show the DatabaseState loading/error fallback.

## Page Directory Summary
- / (Plan Hub)
- /login
- /auth/signup
- /auth/forgot-password
- /onboarding
- /settings/profile
- /settings/preferences
- /help
- /support/ticket
- /billing/checkout
- /billing/success
- /billing/failed
- /student/dashboard
- /student/insights
- /student/curriculum
- /student/assessments
- /student/ai-companion
- /teacher/dashboard
- /teacher/interventions
- /parent/dashboard
- /parent/inbox
- Global not found page: /not-found behavior via app/not-found.tsx
- Global error fallback: app/error.tsx

## 1) Plan Hub
Route: /
- Purpose: Landing hub for planned output flows across Student, Teacher, and Parent experiences.
- Access: Public.
- Incoming links: Browser entry, nav links from other public pages.
- Outgoing links:
  - /login
  - /onboarding
  - /billing/checkout
  - /student/dashboard
  - /teacher/dashboard
  - /parent/dashboard
- Core features:
  - Hero section describing generated execution pages
  - Cards for Student, Teacher, Parent flows with Open page actions
  - Route coverage snapshot generated from appRoutes
  - Evaluation criteria chips
- Data dependency: No live Firestore dependency for the page content itself.

## 2) Login
Route: /login
- Purpose: Authenticate user with Firebase and route user to the correct role destination.
- Access: Public. If already authenticated, middleware redirects to role home.
- Incoming links:
  - / nav link
  - /onboarding nav link
  - middleware redirect when unauthorized user accesses protected route
- Outgoing links:
  - Role home after successful login
  - /onboarding via CTA card
- Core features:
  - Email and password form
  - Role selector (Student, Teacher, Parent)
  - Sign In action using Firebase Auth
  - Error handling for invalid input/auth failure
  - Destination resolver that respects next path only if role is allowed
- Data dependency:
  - Firebase Auth sign-in and token claims
  - Cookie session state written after sign-in

## 3) Onboarding
Route: /onboarding
- Purpose: Let user choose a role profile and continue directly to that role dashboard.
- Access: Requires authenticated cookie state.
- Incoming links:
  - /login CTA
  - direct route when authenticated
- Outgoing links:
  - /student/dashboard
  - /teacher/dashboard
  - /parent/dashboard
  - / and /login via top nav
- Core features:
  - Three role cards with Continue actions
  - Stores selected role into session cookies
  - Navigates to role-specific target page
- Data dependency: No Firestore dependency for page rendering.

## 4) Signup
Route: /auth/signup
- Purpose: Create user account with Firebase Auth and role-aware post-signup routing.
- Access: Public. If already authenticated, middleware redirects to role home.
- Incoming links:
  - /login
  - direct route entry
- Outgoing links:
  - Role destination dashboard after successful signup
  - /auth/forgot-password
  - /help
- Core features:
  - Email/password registration form
  - Role selector (Student, Teacher, Parent)
  - Policy acceptance checkbox
  - Inline validation and Firebase error handling
- Data dependency:
  - Firebase Auth createUserWithEmailAndPassword
  - Cookie session state written after signup

## 5) Forgot Password
Route: /auth/forgot-password
- Purpose: Send secure password reset email through Firebase Auth.
- Access: Public. If already authenticated, middleware redirects to role home.
- Incoming links:
  - /login
  - /auth/signup
- Outgoing links:
  - /login
- Core features:
  - Email input form
  - Reset-email dispatch action
  - Success and failure state messaging
- Data dependency:
  - Firebase Auth sendPasswordResetEmail

## 6) Student Dashboard
Route: /student/dashboard
- Purpose: Main student overview for mission progress, signals, mastery, and next actions.
- Access: Auth required, role STUDENT.
- Incoming links:
  - /onboarding Student continue
  - /login successful student sign-in
  - Student nav from other student pages
- Outgoing links:
  - Student nav links (all student pages)
  - Optional hero action link from document content
- Core features:
  - Mission card with badges, progress, and action buttons
  - Signals list
  - Subject mastery progress bars
  - Next steps list and action buttons
- Data dependency:
  - students/{studentId}/pages/dashboard

## 7) Student Insights
Route: /student/insights
- Purpose: Show student performance highlights, trend trajectory, breakdowns, and narratives.
- Access: Auth required, role STUDENT.
- Incoming links: Student navigation.
- Outgoing links: Student navigation and optional hero action.
- Core features:
  - KPI highlights with delta tags
  - Trajectory timeline bars
  - Subject mastery breakdown
  - Narrative insight cards
  - Recommendation list
- Data dependency:
  - students/{studentId}/pages/insights

## 8) Student Curriculum
Route: /student/curriculum
- Purpose: Present active curriculum block, schedule, dependency risks, and guidance.
- Access: Auth required, role STUDENT.
- Incoming links: Student navigation.
- Outgoing links: Student navigation and optional hero action.
- Core features:
  - Current block progress
  - Schedule list with readiness tags
  - Dependency/risk progress list
  - Oracle insights summary with two action buttons
- Data dependency:
  - students/{studentId}/pages/curriculum

## 9) Student Assessments
Route: /student/assessments
- Purpose: Display active assessment question view, upcoming assessments, and history.
- Access: Auth required, role STUDENT.
- Incoming links: Student navigation.
- Outgoing links: Student navigation and optional hero action.
- Core features:
  - Active assessment prompt and options
  - Confidence progress indicator
  - Upcoming list with type badges
  - History cards with score/status labels
- Data dependency:
  - students/{studentId}/pages/assessments

## 10) Student AI Companion
Route: /student/ai-companion
- Purpose: Conversational support surface with context metrics and quick prompts.
- Access: Auth required, role STUDENT.
- Incoming links: Student navigation.
- Outgoing links: Student navigation and optional hero action.
- Core features:
  - Quick prompt chips
  - Message timeline with student vs assistant bubbles
  - Composer row with send action button
  - Context metric cards
- Data dependency:
  - students/{studentId}/pages/ai-companion

## 11) Teacher Dashboard
Route: /teacher/dashboard
- Purpose: Teacher operations overview with class metrics and at-risk learner monitoring.
- Access: Auth required, role TEACHER.
- Incoming links:
  - /onboarding Teacher continue
  - /login successful teacher sign-in
  - Teacher nav from interventions page
- Outgoing links:
  - /teacher/interventions
  - /onboarding
  - /
  - Optional hero action link
- Core features:
  - Class snapshot progress metrics
  - At-risk learner queue with severity badges
  - Recommended actions list with CTA buttons
  - Live notice feed
- Data dependency:
  - teachers/{teacherId}/pages/dashboard

## 12) Teacher Interventions
Route: /teacher/interventions
- Purpose: Intervention command center for cases, protocol steps, and timeline updates.
- Access: Auth required, role TEACHER.
- Incoming links: Teacher navigation.
- Outgoing links:
  - /teacher/dashboard
  - /onboarding
  - /
  - Optional hero action link
- Core features:
  - Intervention queue list with severity and ownership
  - View/Resolve action buttons for each queue item
  - Protocol checklist panel
  - Timeline panel for activity updates
- Data dependency:
  - teachers/{teacherId}/pages/interventions

## 13) Parent Dashboard
Route: /parent/dashboard
- Purpose: Parent overview for child progress snapshot, weekly trend, and recent notifications.
- Access: Auth required, role PARENT.
- Incoming links:
  - /onboarding Parent continue
  - /login successful parent sign-in
  - Parent nav from inbox page
- Outgoing links:
  - /parent/inbox
  - /onboarding
  - /
  - Optional hero action link
- Core features:
  - Snapshot badges and progress metrics
  - Weekly trend bars
  - Notification summary list with read/unread label
  - Report action button
- Data dependency:
  - parents/{parentId}/pages/dashboard

## 14) Parent Inbox
Route: /parent/inbox
- Purpose: Message-focused page for parent notifications with type and status tagging.
- Access: Auth required, role PARENT.
- Incoming links: Parent navigation.
- Outgoing links:
  - /parent/dashboard
  - /onboarding
  - /
  - Optional hero action link
- Core features:
  - Message cards with notification type badge
  - Read/unread status badge
  - Timestamp and Open action button
- Data dependency:
  - parents/{parentId}/pages/inbox

## 15) Profile Settings
Route: /settings/profile
- Purpose: Manage identity-level account settings and privacy controls.
- Access: Auth required, all roles.
- Incoming links:
  - /settings/preferences
  - /support/ticket
  - /help
- Outgoing links:
  - /settings/preferences
  - /support/ticket
  - /help
- Core features:
  - Full name, phone, timezone editing
  - Privacy mode selector
  - Notification opt-in toggle
  - Save confirmation timestamp
- Data dependency:
  - users/{uid}/settings/profile

## 16) Preference Settings
Route: /settings/preferences
- Purpose: Store learning, notification, language, theme, timezone, and accessibility preferences.
- Access: Auth required, all roles.
- Incoming links:
  - /settings/profile
  - /support/ticket
  - /help
- Outgoing links:
  - /settings/profile
  - /support/ticket
  - /help
- Core features:
  - Learning goal field
  - Notification frequency selector
  - Theme and language options
  - Large-text and high-contrast toggles
- Data dependency:
  - users/{uid}/settings/preferences

## 17) Help Center
Route: /help
- Purpose: Search-first support hub for common student, teacher, parent, and platform issues.
- Access: Public.
- Incoming links:
  - /login
  - /auth/signup
  - /support/ticket
  - direct route entry
- Outgoing links:
  - /support/ticket
  - /login
  - /
- Core features:
  - Knowledge article cards
  - Client-side search filtering
  - One-click escalation to support tickets
- Data dependency:
  - No required Firestore reads for base content

## 18) Support Tickets
Route: /support/ticket
- Purpose: Create and track support requests with realtime Firestore updates.
- Access: Auth required, all roles.
- Incoming links:
  - /help
  - /settings/profile
  - /settings/preferences
- Outgoing links:
  - /help
  - /settings/profile
  - /settings/preferences
- Core features:
  - Ticket create form with category/priority controls
  - Input sanitization before persistence
  - Realtime list of user-scoped tickets and status badges
- Data dependency:
  - support_tickets filtered by uid

## 19) Global Error And Not Found Pages
- app/not-found.tsx:
  - Branded 404 with recovery links and search field.
- app/error.tsx:
  - Runtime fallback page with retry and support escalation CTA.

## 20) Billing Checkout
Route: /billing/checkout
- Purpose: Create authenticated checkout sessions for selected plan, discount, and billing profile.
- Access: Auth required, all roles.
- Incoming links:
  - / (Plan Hub)
  - direct route when authenticated
- Outgoing links:
  - /billing/success
  - /billing/failed
  - /settings/profile
  - /help
- Core features:
  - Plan selection cards from backend API
  - Billing address and profile form
  - Discount code and payment method selection
  - Session creation + completion actions
  - Order summary with subtotal, discount, and payable amount
- Data dependency:
  - GET /api/billing/plans
  - POST /api/billing/checkout
  - POST /api/billing/checkout/{sessionId}/complete

## 21) Billing Success
Route: /billing/success
- Purpose: Confirm successful billing status and show checkout summary.
- Access: Auth required, all roles.
- Incoming links:
  - /billing/checkout
- Outgoing links:
  - /student/dashboard
  - /billing/checkout
- Core features:
  - Session status and plan badge display
  - Amount summary and billing email confirmation
  - Return CTAs for continuation or new checkout
- Data dependency:
  - GET /api/billing/checkout/{sessionId}

## 22) Billing Failed
Route: /billing/failed
- Purpose: Show failed checkout outcome and guide user to retry safely.
- Access: Auth required, all roles.
- Incoming links:
  - /billing/checkout
- Outgoing links:
  - /billing/checkout
  - /help
- Core features:
  - Failed status presentation with session context
  - Retry checkout action
  - Support escalation link
- Data dependency:
  - GET /api/billing/checkout/{sessionId}

## Shared UI System Features
- All role pages use RoleShell for:
  - Top nav
  - Active nav highlighting
  - Hero title/subtitle/eyebrow
  - Optional hero action button
- All role pages use DatabaseState for:
  - Loading fallback
  - Missing doc/Firebase config fallback
- Styling and composition are based on reusable design-system components:
  - Card
  - Button
  - Badge
  - Input
  - Progress

## Practical Linkage Matrix
- Public pages:
  - / -> /login, /auth/signup, /help, /onboarding, role dashboards
  - /login -> role dashboard, /onboarding, /auth/signup, /auth/forgot-password
  - /auth/signup -> role dashboard, /auth/forgot-password, /help
  - /auth/forgot-password -> /login
- Role bootstrap:
  - /onboarding -> one of role dashboards
- Student group:
  - /student/dashboard <-> /student/insights <-> /student/curriculum <-> /student/assessments <-> /student/ai-companion
- Teacher group:
  - /teacher/dashboard <-> /teacher/interventions
- Parent group:
  - /parent/dashboard <-> /parent/inbox
- Settings and support group:
  - /settings/profile <-> /settings/preferences <-> /support/ticket <-> /help
- Billing group:
  - /billing/checkout -> /billing/success or /billing/failed
  - /billing/failed -> /billing/checkout
- Teacher and Parent fallback navs also include:
  - /onboarding
  - /

## Notes For Backend/API Linkage
- Backend request helpers exist in src/lib/backend-client.ts and include Firebase ID token in Authorization header.
- Current page implementations above are primarily Firestore-listener driven (direct client reads) rather than backend API-fetch driven for content blocks.
- Day 6 billing pages use authenticated backend routes and Firestore-backed checkout sessions rather than direct client database writes.
- If needed, a second document can map each future page action button to a concrete backend endpoint contract.
