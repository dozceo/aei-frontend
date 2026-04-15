"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudentPageKey } from "@/lib/student-content";
import { subscribeToStudentPage } from "@/lib/student-content-db";

export function useStudentPageContent<T extends object>(pageKey: StudentPageKey) {
  const studentId = useMemo(() => process.env.NEXT_PUBLIC_STUDENT_ID ?? "default-student", []);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

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

  return { data, loading, error, studentId };
}
