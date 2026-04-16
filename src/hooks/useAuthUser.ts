"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase-client";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      setError("Firebase Auth is not configured.");
      setLoading(false);
      return () => undefined;
    }

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}
