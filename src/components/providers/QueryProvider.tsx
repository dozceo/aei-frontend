"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Global React Query provider.
 * Wraps the app in QueryClientProvider with sensible defaults:
 *  - 5 min staleTime so Firestore reads are not repeated on every mount
 *  - gcTime of 10 min to keep unused data in memory a bit longer
 *  - No automatic refetch on window focus (Firestore listeners handle freshness)
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,       // 5 minutes
            gcTime: 1000 * 60 * 10,          // 10 minutes (was cacheTime in v4)
            refetchOnWindowFocus: false,      // Firestore listeners handle real-time
            retry: 1,                         // 1 retry for transient network errors
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
