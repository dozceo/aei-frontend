import { doc, onSnapshot } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";
import type { StudentPageKey } from "@/lib/student-content";

export function subscribeToStudentPage<T extends object>(
  studentId: string,
  pageKey: StudentPageKey,
  onData: (value: T | null) => void,
  onError: (error: string | null) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    onData(null);
    onError("Firebase environment variables are not configured.");
    return () => undefined;
  }

  const pageRef = doc(db, "students", studentId, "pages", pageKey);

  return onSnapshot(
    pageRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        onError(`Database document missing at students/${studentId}/pages/${pageKey}`);
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
