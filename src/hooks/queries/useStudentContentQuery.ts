"use client";

import { useAuthUserId } from "@/hooks/useAuthUserId";
import { subscribeToStudentPage } from "@/lib/student-content-db";
import type { StudentPageKey } from "@/lib/student-content";
import { queryKeys } from "./query-keys";
import { useFirestoreSubscription } from "./useFirestoreSubscription";

/**
 * Cached React Query hook for student page content.
 * Replaces the manual useState/useEffect pattern in useStudentPageContent.
 *
 * Data is streamed via Firestore onSnapshot and stored in the React Query cache.
 * Navigating away and back will show the cached data instantly (no re-fetch).
 */
export function useStudentContentQuery<T extends object>(pageKey: StudentPageKey) {
  const studentId = useAuthUserId();
  const resolvedId = studentId ?? "";

  const result = useFirestoreSubscription<T>({
    queryKey: queryKeys.studentPage(resolvedId, pageKey),
    enabled: !!studentId,
    subscribeFn: (onData, onError) =>
      subscribeToStudentPage<T>(resolvedId, pageKey, onData, onError),
  });

  return {
    data: result.data ?? null,
    loading: studentId === undefined || result.isLoading,
    error: result.error?.message ?? null,
    studentId: resolvedId,
  };
}
