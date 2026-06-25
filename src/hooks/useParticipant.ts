"use client";

import { useSchool } from "@/components/providers/SchoolProvider";
import { subscribeToParticipant, type ParticipantDoc } from "@/lib/participant-db";
import { useFirestoreSubscription } from "@/hooks/queries/useFirestoreSubscription";
import { queryKeys } from "@/hooks/queries/query-keys";

export function useParticipant() {
  const { identity, ready } = useSchool();
  const bookingId = identity?.linkedId ?? "";

  const result = useFirestoreSubscription<ParticipantDoc>({
    queryKey: queryKeys.participant(bookingId),
    enabled: ready && Boolean(bookingId),
    subscribeFn: (onData, onError) => subscribeToParticipant(bookingId, onData, onError),
  });

  return {
    participant: result.data,
    loading: !ready || result.isLoading,
    error: result.error?.message ?? null,
    bookingId,
    schoolId: identity?.primarySchoolId ?? null,
  };
}
