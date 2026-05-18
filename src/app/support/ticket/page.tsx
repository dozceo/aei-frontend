"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSupportTicketsQuery, useCreateSupportTicketMutation } from "@/hooks/queries";
import type { SupportCategory, SupportPriority } from "@/lib/support-ticket-db";

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
  if (!seconds) return "Pending timestamp";
  return new Date(seconds * 1000).toLocaleString();
}

export default function SupportTicketPage() {
  const { user, loading: authLoading, error: authError } = useAuthUser();
  const { tickets, loading: queryLoading, error: queryError } = useSupportTicketsQuery(user?.uid);
  const createTicket = useCreateSupportTicketMutation(user?.uid);

  const [draft, setDraft] = useState<TicketDraft>(defaultDraft);
  const [success, setSuccess] = useState<string | null>(null);

  const loading = authLoading || queryLoading;
  const mergedError = authError ?? queryError;

  const handleCreateTicket = async () => {
    if (!user || !user.email) return;

    setSuccess(null);
    const subject = sanitizeText(draft.subject, 120);
    const message = sanitizeText(draft.message, 1600);

    if (!subject || !message) return; // Note: You'd want real validation here.

    try {
      await createTicket.mutateAsync({
        email: user.email,
        subject,
        message,
        priority: draft.priority,
        category: draft.category,
      });

      setDraft(defaultDraft);
      setSuccess("Support ticket created successfully.");
    } catch {
      // Use createTicket.error below
    }
  };

  const selectStyle = {
    width: "100%",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    padding: "10px 12px",
    background: "var(--color-surface-elevated)",
    color: "var(--color-text-primary)",
  };

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Support navigation">
          <Link href="/help" className="nav-link">Help</Link>
          <Link href="/settings/profile" className="nav-link">Profile</Link>
          <Link href="/support/ticket" className="nav-link active">Tickets</Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Support ticket workspace">
        <DatabaseState loading={loading} error={mergedError ?? createTicket.error?.message ?? null} pathHint={user ? `support_tickets where uid=${user.uid}` : "support_tickets"} />

        {!loading && !mergedError ? (
          <>
            <Card className="hero-block reveal-up reveal-delay-1" variant="soft" title="Support ticket system" subtitle="Create issues, track statuses, and keep intervention flows unblocked">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Subject" name="ticket-subject" value={draft.subject}
                  onChange={(e) => setDraft((p) => ({ ...p, subject: e.target.value }))} placeholder="Short issue title" />
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Category</span>
                  <select value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value as SupportCategory }))} style={selectStyle}>
                    <option value="TECHNICAL">Technical</option>
                    <option value="BILLING">Billing</option>
                    <option value="ACADEMIC">Academic Flow</option>
                    <option value="ACCESS">Access Control</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Priority</span>
                  <select value={draft.priority} onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value as SupportPriority }))} style={selectStyle}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Description</span>
                <textarea value={draft.message} onChange={(e) => setDraft((p) => ({ ...p, message: e.target.value }))} rows={5} placeholder="Describe what happened, expected result, and steps to reproduce"
                  style={{ ...selectStyle, resize: "vertical" }} />
              </label>

              {createTicket.isError ? (
                <p style={{ margin: "10px 0 0", color: "var(--color-error)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>{createTicket.error?.message}</p>
              ) : null}
              {success ? (
                <p style={{ margin: "10px 0 0", color: "var(--color-success)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>{success}</p>
              ) : null}

              <div className="chip-row" style={{ marginTop: 14 }}>
                <Button type="button" variant="primary" loading={createTicket.isPending} onClick={handleCreateTicket}>
                  Create Ticket
                </Button>
                <Link href="/help" aria-label="Open help center">
                  <Button type="button" variant="secondary">Open Help Center</Button>
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
