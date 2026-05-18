"use client";

import { useEffect } from "react";
import { useQueryClient, useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Bridge between Firestore `onSnapshot` subscriptions and React Query cache.
 *
 * Problem: onSnapshot is callback-based (push), React Query is promise-based (pull).
 * Solution: This hook starts the subscription, pushes every snapshot into the
 * React Query cache via `queryClient.setQueryData`, and returns the cached value
 * through `useQuery`.
 *
 * The `subscribeFn` receives two callbacks (onData, onError) and must return an
 * unsubscribe function. This matches the signature of the existing `-db.ts` files.
 */
export function useFirestoreSubscription<T>(options: {
  queryKey: QueryKey;
  subscribeFn: (
    onData: (data: T | null) => void,
    onError: (error: string | null) => void,
  ) => (() => void) | undefined;
  enabled?: boolean;
}) {
  const { queryKey, subscribeFn, enabled = true } = options;
  const queryClient = useQueryClient();

  // Subscription side-effect — writes data directly into the cache
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeFn(
      (data) => {
        queryClient.setQueryData(queryKey, data);
      },
      (error) => {
        if (error) {
          queryClient.setQueryData(queryKey, undefined);
        }
      },
    );

    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...queryKey]);

  // Read from the cache (never fetches on its own — the subscription feeds it)
  return useQuery<T | null>({
    queryKey,
    queryFn: () => queryClient.getQueryData(queryKey) as T | null ?? null,
    enabled,
    staleTime: Infinity,              // subscription keeps it fresh
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
