import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";
import { studentSeedPages } from "@/lib/student-seed-data";

const studentPageEntries = Object.entries(studentSeedPages) as Array<
  [keyof typeof studentSeedPages, (typeof studentSeedPages)[keyof typeof studentSeedPages]]
>;

export async function seedStudentPages(studentId: string): Promise<void> {
  const firestore = db;

  if (!isFirebaseConfigured || !firestore) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* variables first.");
  }

  await Promise.all(
    studentPageEntries.map(([pageKey, pageData]) =>
      setDoc(doc(firestore, "students", studentId, "pages", pageKey), pageData, { merge: true }),
    ),
  );
}
