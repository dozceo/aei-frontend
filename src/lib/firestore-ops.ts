/**
 * Firestore CRUD Operations
 * Frontend utility for create, read, update, delete operations
 */

import {
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Query,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";

function ensureDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured");
  }
}

/**
 * Create a new document with auto-generated ID
 */
export async function createDocument(collectionPath: string, data: any) {
  ensureDatabase();
  
  const collectionRef = collection(db!, collectionPath);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return docRef.id;
}

/**
 * Create a document with a specific ID
 */
export async function setDocument(collectionPath: string, docId: string, data: any) {
  ensureDatabase();
  
  const docRef = doc(db!, collectionPath, docId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Read a single document
 */
export async function getDocument(collectionPath: string, docId: string) {
  ensureDatabase();
  
  const docRef = doc(db!, collectionPath, docId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  
  return null;
}

/**
 * Update a document (merges with existing data)
 */
export async function updateDocument(collectionPath: string, docId: string, data: any) {
  ensureDatabase();
  
  const docRef = doc(db!, collectionPath, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a document
 */
export async function deleteDocument(collectionPath: string, docId: string) {
  ensureDatabase();
  
  const docRef = doc(db!, collectionPath, docId);
  await deleteDoc(docRef);
}

/**
 * Get all documents in a collection
 */
export async function getAllDocuments(collectionPath: string) {
  ensureDatabase();
  
  const collectionRef = collection(db!, collectionPath);
  const snapshot = await getDocs(collectionRef);
  
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Query documents with conditions
 */
export async function queryDocuments(
  collectionPath: string,
  conditions: Array<{
    field: string;
    operator: "<" | "<=" | "==" | "!=" | ">=" | ">" | "array-contains" | "in";
    value: any;
  }>
) {
  ensureDatabase();
  
  let queryRef: Query = collection(db!, collectionPath);
  
  // Type assertion needed due to firestore query complexity
  const constraints = conditions.map(({ field, operator, value }) => 
    where(field, operator as any, value)
  );
  
  if (constraints.length > 0) {
    queryRef = query(queryRef, ...constraints);
  }
  
  const snapshot = await getDocs(queryRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Batch update multiple fields in a document
 */
export async function patchDocument(collectionPath: string, docId: string, updates: Record<string, any>) {
  ensureDatabase();
  
  const docRef = doc(db!, collectionPath, docId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Check if a document exists
 */
export async function documentExists(collectionPath: string, docId: string): Promise<boolean> {
  ensureDatabase();
  
  const docRef = doc(db!, collectionPath, docId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
}
