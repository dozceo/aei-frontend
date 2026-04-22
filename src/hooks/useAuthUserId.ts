import { useEffect, useState } from "react";
import { firebaseAuth } from "@/lib/firebase-client";

/**
 * Hook to get the current authenticated user's UID.
 * Returns undefined while auth is loading, then the UID or null.
 */
export function useAuthUserId(): string | null | undefined {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    // Check if user is already authenticated
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      setUid(currentUser.uid);
      setLoading(false);
      return;
    }

    // Subscribe to auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return loading ? undefined : uid;
}
