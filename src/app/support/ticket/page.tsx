"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  createSupportTicket,
  subscribeToSupportTickets,
  type SupportCategory,
  type SupportPriority,
  type SupportTicket,
} from "@/lib/support-ticket-db";

interface TicketDraft {
  subject: string;
  message: string;
  priority: SupportPriority;
  category: SupportCategory;
}

const defaultDraft: TicketDraft = {
  subject: "",
  message: "",
  priority: "MEDIUM",
  category: "TECHNICAL",
};

function sanitizeText(input: string, maxLength: number): string {
  return input.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function formatTimestamp(seconds: number | undefined): string {
  if (!seconds) {
    return "Pending timestamp";
  }

  return new Date(seconds * 1000).toLocaleString();
}

export default function SupportTicketPage() {
  const { user, loading: authLoading, error: authError } = useAuthUser();

  const [draft, setDraft] = useState<TicketDraft>(defaultDraft);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(authLoading);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToSupportTickets(
      user.uid,
      (nextTickets) => {
        setTickets(nextTickets);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const mergedError = authError ?? error;

  const handleCreateTicket = async () => {
    if (!user || !user.email) {
      setError("You must be authenticated to create a support ticket.");
      return;
    }

    setError(null);
    setSuccess(null);

    const subject = sanitizeText(draft.subject, 120);
    const message = sanitizeText(draft.message, 1600);

    if (!subject || !message) {
      setError("Subject and message are required.");
      return;
    }

    setSubmitting(true);

    try {
      await createSupportTicket(user.uid, user.email, {
        subject,
        message,
        priority: draft.priority,
        category: draft.category,
      });

      setDraft(defaultDraft);
      setSuccess("Support ticket created successfully.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create support ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Support navigation">
          <Link href="/help" className="nav-link">
            Help
          </Link>
          <Link href="/settings/profile" className="nav-link">
            Profile
          </Link>
          <Link href="/support/ticket" className="nav-link active">
            Tickets
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Support ticket workspace">
        <DatabaseState loading={loading} error={mergedError} pathHint={user ? `support_tickets where uid=${user.uid}` : "support_tickets"} />

        {!loading && !mergedError ? (
          <>
            <Card className="hero-block reveal-up reveal-delay-1" variant="soft" title="Support ticket system" subtitle="Create issues, track statuses, and keep intervention flows unblocked">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input
                  label="Subject"
                  name="ticket-subject"
                  value={draft.subject}
                  onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))}
                  placeholder="Short issue title"
                />
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Category</span>
                  <select
                    value={draft.category}
                    onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value as SupportCategory }))}
                    style={{
                      width: "100%",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      padding: "10px 12px",
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="TECHNICAL">Technical</option>
                    <option value="BILLING">Billing</option>
                    <option value="ACADEMIC">Academic Flow</option>
                    <option value="ACCESS">Access Control</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Priority</span>
                  <select
                    value={draft.priority}
                    onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value as SupportPriority }))}
                    style={{
                      width: "100%",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      padding: "10px 12px",
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Description</span>
                <textarea
                  value={draft.message}
                  onChange={(event) => setDraft((prev) => ({ ...prev, message: event.target.value }))}
                  rows={5}
                  placeholder="Describe what happened, expected result, and steps to reproduce"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    padding: "10px 12px",
                    background: "var(--color-surface-elevated)",
                    color: "var(--color-text-primary)",
                    resize: "vertical",
                  }}
                />
              </label>

              {error ? (
                <p style={{ margin: "10px 0 0", color: "var(--color-error)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>{error}</p>
              ) : null}
              {success ? (
                <p style={{ margin: "10px 0 0", color: "var(--color-success)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>{success}</p>
              ) : null}

              <div className="chip-row" style={{ marginTop: 14 }}>
                <Button type="button" variant="primary" loading={submitting} onClick={handleCreateTicket}>
                  Create Ticket
                </Button>
                <Link href="/help" aria-label="Open help center">
                  <Button type="button" variant="secondary">
                    Open Help Center
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="reveal-up reveal-delay-2" style={{ gridColumn: "span 12" }} title="My tickets" subtitle="Realtime Firestore stream ordered by latest updates">
              {tickets.length === 0 ? (
                <p className="section-copy">No tickets yet. Create one to start support tracking.</p>
              ) : (
                <ul className="list-clean">
                  {tickets.map((ticket) => (
                    <li key={ticket.id} className="nm-surface-soft" style={{ padding: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>{ticket.subject}</p>
                          <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{ticket.message}</p>
                        </div>
                        <div className="chip-row" style={{ justifyContent: "flex-end" }}>
                          <Badge tone="primary">{ticket.category}</Badge>
                          <Badge tone={ticket.priority === "HIGH" ? "warning" : "neutral"}>{ticket.priority}</Badge>
                          <Badge tone="success">{ticket.status}</Badge>
                        </div>
                      </div>
                      <p style={{ margin: "8px 0 0", color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>
                        Created: {formatTimestamp(ticket.createdAt?.seconds)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        ) : null}
      </section>
    </main>
  );
}
