"use client";

import { useEffect, useState } from "react";
import { useQueryClient, useQuery, type QueryKey } from "@tanstack/react-query";

/**
 * Bridge between Firestore `onSnapshot` subscriptions and React Query cache.
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
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSubscriptionError(null);
      return;
    }

    const unsubscribe = subscribeFn(
      (data) => {
        setSubscriptionError(null);
        queryClient.setQueryData(queryKey, data);
      },
      (error) => {
        setSubscriptionError(error);
        if (error) {
          queryClient.setQueryData(queryKey, null);
        }
      },
    );

    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...queryKey]);

  const result = useQuery<T | null>({
    queryKey,
    queryFn: () => (queryClient.getQueryData(queryKey) as T | null) ?? null,
    enabled,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    ...result,
    error: subscriptionError ? new Error(subscriptionError) : result.error,
    isError: Boolean(subscriptionError) || result.isError,
  };
}
