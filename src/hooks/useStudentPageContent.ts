"use client";

import { useEffect, useState } from "react";
import { useAuthUserId } from "@/hooks/useAuthUserId";
import type { StudentPageKey } from "@/lib/student-content";
import { subscribeToStudentPage } from "@/lib/student-content-db";

export function useStudentPageContent<T extends object>(pageKey: StudentPageKey) {
  const studentId = useAuthUserId();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId === undefined) {
      setLoading(true);
      setError(null);
      return;
    }

    if (!studentId) {
      setData(null);
      setLoading(false);
      setError("Sign in required.");
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToStudentPage<T>(
      studentId,
      pageKey,
      (nextValue) => {
        setData(nextValue);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [pageKey, studentId]);

  return { data, loading, error, studentId: studentId ?? "" };
}
