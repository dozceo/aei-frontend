import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";

export interface UserProfileSettings {
  fullName: string;
  phone: string;
  timezone: string;
  notificationsEnabled: boolean;
  privacyMode: "standard" | "high";
}

export interface UserPreferenceSettings {
  learningGoal: string;
  notificationFrequency: "immediate" | "daily" | "weekly";
  language: string;
  theme: "system" | "light" | "dark";
  timezone: string;
  largeText: boolean;
  highContrast: boolean;
}

const defaultProfile: UserProfileSettings = {
  fullName: "",
  phone: "",
  timezone: "Asia/Kolkata",
  notificationsEnabled: true,
  privacyMode: "standard",
};

const defaultPreferences: UserPreferenceSettings = {
  learningGoal: "Balanced improvement across subjects",
  notificationFrequency: "daily",
  language: "English",
  theme: "system",
  timezone: "Asia/Kolkata",
  largeText: false,
  highContrast: false,
};

function ensureDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured.");
  }
}

export function getProfileDefaults(): UserProfileSettings {
  return { ...defaultProfile };
}

export function getPreferenceDefaults(): UserPreferenceSettings {
  return { ...defaultPreferences };
}

export async function loadUserProfileSettings(uid: string): Promise<UserProfileSettings> {
  ensureDatabase();
  const ref = doc(db!, "users", uid, "settings", "profile");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return getProfileDefaults();
  }

  return { ...defaultProfile, ...(snapshot.data() as Partial<UserProfileSettings>) };
}

export async function saveUserProfileSettings(uid: string, payload: UserProfileSettings): Promise<void> {
  ensureDatabase();
  const ref = doc(db!, "users", uid, "settings", "profile");

  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function loadUserPreferenceSettings(uid: string): Promise<UserPreferenceSettings> {
  ensureDatabase();
  const ref = doc(db!, "users", uid, "settings", "preferences");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return getPreferenceDefaults();
  }

  return { ...defaultPreferences, ...(snapshot.data() as Partial<UserPreferenceSettings>) };
}

export async function saveUserPreferenceSettings(uid: string, payload: UserPreferenceSettings): Promise<void> {
  ensureDatabase();
  const ref = doc(db!, "users", uid, "settings", "preferences");

  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
