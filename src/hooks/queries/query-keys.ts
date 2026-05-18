/**
 * Centralized query key factory.
 * Every React Query cache key in the app is defined here so invalidation
 * and prefetching stay consistent across hooks and mutations.
 */
export const queryKeys = {
  /* ─── User Settings ─── */
  userProfile: (uid: string) => ["user-profile", uid] as const,
  userPreferences: (uid: string) => ["user-preferences", uid] as const,

  /* ─── Student Content ─── */
  studentPage: (studentId: string, pageKey: string) =>
    ["student-page", studentId, pageKey] as const,

  /* ─── Role Content (Teacher / Parent) ─── */
  teacherPage: (teacherId: string, pageKey: string) =>
    ["teacher-page", teacherId, pageKey] as const,
  parentPage: (parentId: string, pageKey: string) =>
    ["parent-page", parentId, pageKey] as const,

  /* ─── Support Tickets ─── */
  supportTickets: (uid: string) => ["support-tickets", uid] as const,
} as const;
