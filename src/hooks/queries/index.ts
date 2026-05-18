/**
 * Barrel export for all React Query hooks.
 * Import from "@/hooks/queries" across the app.
 */
export { queryKeys } from "./query-keys";
export { useFirestoreSubscription } from "./useFirestoreSubscription";
export { useUserProfileQuery, useSaveUserProfileMutation, useUserPreferencesQuery, useSaveUserPreferencesMutation } from "./useUserSettingsQueries";
export { useStudentContentQuery } from "./useStudentContentQuery";
export { useTeacherContentQuery, useParentContentQuery } from "./useRoleContentQuery";
export { useSupportTicketsQuery, useCreateSupportTicketMutation } from "./useSupportTicketQuery";
