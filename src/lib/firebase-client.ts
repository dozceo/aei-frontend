'use client'

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID?.trim() || 'zero2dev'

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp()
  return initializeApp(firebaseConfig)
}

let authInstance: Auth | null = null
let firestoreInstance: Firestore | null = null

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp())
  }
  return authInstance
}

/** Named Firestore database — same `zero2dev` instance as 02dev production. */
export function getFirestoreDb(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getFirebaseApp(), FIRESTORE_DATABASE_ID)
  }
  return firestoreInstance
}

export const googleProvider = new GoogleAuthProvider()
