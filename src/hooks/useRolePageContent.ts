"use client";

import { useEffect, useMemo, useState } from "react";
import type { ParentPageKey, TeacherPageKey } from "@/lib/role-content";
import { subscribeToParentPage, subscribeToTeacherPage } from "@/lib/role-content-db";

export function useTeacherPageContent<T extends object>(pageKey: TeacherPageKey) {
  const teacherId = useMemo(() => process.env.NEXT_PUBLIC_TEACHER_ID ?? "default-teacher", []);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

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

  return { data, loading, error, roleId: teacherId };
}

export function useParentPageContent<T extends object>(pageKey: ParentPageKey) {
  const parentId = useMemo(() => process.env.NEXT_PUBLIC_PARENT_ID ?? "default-parent", []);

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

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

  return { data, loading, error, roleId: parentId };
}