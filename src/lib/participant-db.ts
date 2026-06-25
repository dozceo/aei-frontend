import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export interface ParticipantDoc {
  email?: string;
  name?: string;
  schoolId?: string;
  divisionId?: string;
  classId?: string;
  percentile?: number;
  xp?: number;
  level?: number;
  streak?: number;
  parentEmails?: string[];
}

export function subscribeToParticipant(
  bookingId: string,
  onData: (data: ParticipantDoc | null) => void,
  onError: (error: string | null) => void,
): Unsubscribe | undefined {
  if (!db || !bookingId) {
    onError("Firestore is not configured.");
    return undefined;
  }

  return onSnapshot(
    doc(db, "participants", bookingId),
    (snap) => onData(snap.exists() ? (snap.data() as ParticipantDoc) : null),
    (err) => onError(err.message),
  );
}
