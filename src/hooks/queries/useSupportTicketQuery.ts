"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSupportTicket,
  subscribeToSupportTickets,
  type SupportTicket,
} from "@/lib/support-ticket-db";
import { queryKeys } from "./query-keys";
import { useFirestoreSubscription } from "./useFirestoreSubscription";

/**
 * Cached React Query hook for the user's support tickets.
 * Firestore onSnapshot pushes updates into the query cache.
 */
export function useSupportTicketsQuery(uid: string | undefined) {
  const resolvedUid = uid ?? "";

  const result = useFirestoreSubscription<SupportTicket[]>({
    queryKey: queryKeys.supportTickets(resolvedUid),
    enabled: !!uid,
    subscribeFn: (onData, onError) =>
      subscribeToSupportTickets(resolvedUid, onData, onError),
  });

  return {
    tickets: result.data ?? [],
    loading: result.isLoading,
    error: result.error?.message ?? null,
  };
}

/**
 * Mutation hook for creating a new support ticket.
 * Invalidates the ticket list cache on success so the subscription re-syncs.
 */
export function useCreateSupportTicketMutation(uid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      email: string;
      subject: string;
      message: string;
      priority: "LOW" | "MEDIUM" | "HIGH";
      category: "TECHNICAL" | "BILLING" | "ACADEMIC" | "ACCESS";
    }) => {
      if (!uid) throw new Error("User not authenticated.");
      return createSupportTicket(uid, payload.email, {
        subject: payload.subject,
        message: payload.message,
        priority: payload.priority,
        category: payload.category,
      });
    },
    onSuccess: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets(uid) });
      }
    },
  });
}
