"use client";

import { useEffect, useState } from "react";
import { useAuthUserId } from "@/hooks/useAuthUserId";
import type { ParentPageKey, TeacherPageKey } from "@/lib/role-content";
import { subscribeToParentPage, subscribeToTeacherPage } from "@/lib/role-content-db";

export function useTeacherPageContent<T extends object>(pageKey: TeacherPageKey) {
  const teacherId = useAuthUserId();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacherId === undefined) {
      setLoading(true);
      setError(null);
      return;
    }

    if (!teacherId) {
      setData(null);
      setLoading(false);
      setError("Sign in required.");
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTeacherPage<T>(
      teacherId,
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
  }, [pageKey, teacherId]);

  return { data, loading, error, roleId: teacherId ?? "" };
}

export function useParentPageContent<T extends object>(pageKey: ParentPageKey) {
  const parentId = useAuthUserId();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (parentId === undefined) {
      setLoading(true);
      setError(null);
      return;
    }

    if (!parentId) {
      setData(null);
      setLoading(false);
      setError("Sign in required.");
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToParentPage<T>(
      parentId,
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
  }, [pageKey, parentId]);

  return { data, loading, error, roleId: parentId ?? "" };
}