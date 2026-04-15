import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";
import { parentSeedPages, teacherSeedPages } from "@/lib/role-seed-data";

const teacherEntries = Object.entries(teacherSeedPages) as Array<
  [keyof typeof teacherSeedPages, (typeof teacherSeedPages)[keyof typeof teacherSeedPages]]
>;

const parentEntries = Object.entries(parentSeedPages) as Array<
  [keyof typeof parentSeedPages, (typeof parentSeedPages)[keyof typeof parentSeedPages]]
>;

export async function seedTeacherPages(teacherId: string): Promise<void> {
  const firestore = db;

  if (!isFirebaseConfigured || !firestore) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables first.");
  }

  await Promise.all(
    teacherEntries.map(([pageKey, pageData]) =>
      setDoc(doc(firestore, "teachers", teacherId, "pages", pageKey), pageData, { merge: true }),
    ),
  );
}

export async function seedParentPages(parentId: string): Promise<void> {
  const firestore = db;

  if (!isFirebaseConfigured || !firestore) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables first.");
  }

  await Promise.all(
    parentEntries.map(([pageKey, pageData]) =>
      setDoc(doc(firestore, "parents", parentId, "pages", pageKey), pageData, { merge: true }),
    ),
  );
}