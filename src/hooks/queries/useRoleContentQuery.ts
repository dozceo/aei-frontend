"use client";

import { useAuthUserId } from "@/hooks/useAuthUserId";
import { subscribeToTeacherPage, subscribeToParentPage } from "@/lib/role-content-db";
import type { TeacherPageKey, ParentPageKey } from "@/lib/role-content";
import { queryKeys } from "./query-keys";
import { useFirestoreSubscription } from "./useFirestoreSubscription";

/**
 * Cached React Query hook for teacher page content.
 * Replaces useTeacherPageContent with cached subscription bridge.
 */
export function useTeacherContentQuery<T extends object>(pageKey: TeacherPageKey) {
  const teacherId = useAuthUserId();
  const resolvedId = teacherId ?? "";

  const result = useFirestoreSubscription<T>({
    queryKey: queryKeys.teacherPage(resolvedId, pageKey),
    enabled: !!teacherId,
    subscribeFn: (onData, onError) =>
      subscribeToTeacherPage<T>(resolvedId, pageKey, onData, onError),
  });

  return {
    data: result.data ?? null,
    loading: teacherId === undefined || result.isLoading,
    error: result.error?.message ?? null,
    roleId: resolvedId,
  };
}

/**
 * Cached React Query hook for parent page content.
 * Replaces useParentPageContent with cached subscription bridge.
 */
export function useParentContentQuery<T extends object>(pageKey: ParentPageKey) {
  const parentId = useAuthUserId();
  const resolvedId = parentId ?? "";

  const result = useFirestoreSubscription<T>({
    queryKey: queryKeys.parentPage(resolvedId, pageKey),
    enabled: !!parentId,
    subscribeFn: (onData, onError) =>
      subscribeToParentPage<T>(resolvedId, pageKey, onData, onError),
  });

  return {
    data: result.data ?? null,
    loading: parentId === undefined || result.isLoading,
    error: result.error?.message ?? null,
    roleId: resolvedId,
  };
}
