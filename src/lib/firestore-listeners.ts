/**
 * Firestore Real-time Listeners
 * Frontend utility for setting up real-time data listeners
 */

import { doc, collection, onSnapshot, Query, Unsubscribe } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";

interface ListenerOptions {
  onData: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Listen to a specific document in real-time
 */
export function setupDocumentListener(
  collectionPath: string,
  documentId: string,
  options: ListenerOptions
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) {
    console.error("Firebase not configured");
    options.onError?.("Firebase not configured");
    return null;
  }

  const docRef = doc(db, collectionPath, documentId);
  
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        options.onData({ id: snapshot.id, ...snapshot.data() });
      } else {
        options.onData(null);
      }
    },
    (error) => {
      console.error(`Error listening to ${collectionPath}/${documentId}:`, error);
      options.onError?.(error);
    }
  );
}

/**
 * Listen to a collection in real-time
 */
export function setupCollectionListener(
  collectionPath: string,
  options: ListenerOptions
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) {
    console.error("Firebase not configured");
    options.onError?.("Firebase not configured");
    return null;
  }

  const collectionRef = collection(db, collectionPath);
  
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      options.onData(data);
    },
    (error) => {
      console.error(`Error listening to ${collectionPath}:`, error);
      options.onError?.(error);
    }
  );
}

/**
 * Listen to a queried collection with real-time updates
 */
export function setupQueryListener(
  queryObj: Query,
  options: ListenerOptions
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) {
    console.error("Firebase not configured");
    options.onError?.("Firebase not configured");
    return null;
  }

  return onSnapshot(
    queryObj,
    (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      options.onData(data);
    },
    (error) => {
      console.error("Error listening to query:", error);
      options.onError?.(error);
    }
  );
}

/**
 * Helper to set up user-specific listeners
 */
export function setupUserProfileListener(
  uid: string,
  onData: (data: any) => void,
  onError?: (error: any) => void
): Unsubscribe | null {
  return setupDocumentListener("users", uid, { onData, onError });
}

/**
 * Helper to set up user settings listener
 */
export function setupUserSettingsListener(
  uid: string,
  settingsPath: string,
  onData: (data: any) => void,
  onError?: (error: any) => void
): Unsubscribe | null {
  return setupDocumentListener(`users/${uid}/settings`, settingsPath, { onData, onError });
}
