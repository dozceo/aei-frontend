import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";
import type { ParentPageKey, TeacherPageKey } from "@/lib/role-content";

function subscribeToPage<T extends object>(
  collectionName: "teachers" | "parents",
  entityId: string,
  pageKey: string,
  onData: (value: T | null) => void,
  onError: (error: string | null) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    onData(null);
    onError("Firebase environment variables are not configured.");
    return () => undefined;
  }

  const pageRef = doc(db, collectionName, entityId, "pages", pageKey);

  return onSnapshot(
    pageRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        onError(`Database document missing at ${collectionName}/${entityId}/pages/${pageKey}`);
        return;
      }

      onData(snapshot.data() as T);
      onError(null);
    },
    (error) => {
      onData(null);
      onError(error.message);
    },
  );
}

export function subscribeToTeacherPage<T extends object>(
  teacherId: string,
  pageKey: TeacherPageKey,
  onData: (value: T | null) => void,
  onError: (error: string | null) => void,
): () => void {
  return subscribeToPage<T>("teachers", teacherId, pageKey, onData, onError);
}

export function subscribeToParentPage<T extends object>(
  parentId: string,
  pageKey: ParentPageKey,
  onData: (value: T | null) => void,
  onError: (error: string | null) => void,
): () => void {
  return subscribeToPage<T>("parents", parentId, pageKey, onData, onError);
}