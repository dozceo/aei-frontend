import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase-client";

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH";
export type SupportCategory = "TECHNICAL" | "BILLING" | "ACADEMIC" | "ACCESS";

export interface SupportTicket {
  id: string;
  uid: string;
  email: string;
  subject: string;
  message: string;
  priority: SupportPriority;
  category: SupportCategory;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt?: { seconds: number; nanoseconds: number };
}

interface CreateSupportTicketPayload {
  subject: string;
  message: string;
  priority: SupportPriority;
  category: SupportCategory;
}

function ensureDatabase() {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase Firestore is not configured.");
  }
}

export async function createSupportTicket(uid: string, email: string, payload: CreateSupportTicketPayload): Promise<void> {
  ensureDatabase();

  await addDoc(collection(db!, "support_tickets"), {
    uid,
    email,
    subject: payload.subject,
    message: payload.message,
    priority: payload.priority,
    category: payload.category,
    status: "OPEN",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToSupportTickets(
  uid: string,
  onData: (tickets: SupportTicket[]) => void,
  onError: (error: string | null) => void,
): () => void {
  if (!isFirebaseConfigured || !db) {
    onData([]);
    onError("Firebase Firestore is not configured.");
    return () => undefined;
  }

  const ticketsQuery = query(collection(db, "support_tickets"), where("uid", "==", uid));

  return onSnapshot(
    ticketsQuery,
    (snapshot) => {
      const tickets = snapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...(docSnapshot.data() as Omit<SupportTicket, "id">) }))
        .sort((a, b) => {
          const aSeconds = a.createdAt?.seconds ?? 0;
          const bSeconds = b.createdAt?.seconds ?? 0;
          return bSeconds - aSeconds;
        });

      onData(tickets);
      onError(null);
    },
    (error) => {
      onData([]);
      onError(error.message);
    },
  );
}
