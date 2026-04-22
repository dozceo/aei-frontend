"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getBillingCheckoutSession, type BillingCheckoutSessionSummary } from "@/lib/billing-api";

export default function BillingSuccessPage() {
  const { user } = useAuthUser();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<BillingCheckoutSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session"));
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(authLoading);
      return;
    }

    let active = true;

    getBillingCheckoutSession(sessionId)
      .then((nextSession) => {
        if (!active) {
          return;
        }

        setSession(nextSession);
        setLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load checkout session.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId, user, authLoading]);

  const mergedError = authError ?? error;

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <section className="dashboard-grid" aria-label="Billing success">
        <DatabaseState loading={loading} error={mergedError} pathHint="api/billing/checkout/{sessionId}" />

        {!loading && !mergedError ? (
          <Card className="hero-block reveal-up" variant="soft" title="Payment successful" subtitle="Your plan activation has been recorded">
            {session ? (
              <>
                <div className="chip-row" style={{ marginBottom: 10 }}>
                  <Badge tone="success">Status: {session.status}</Badge>
                  <Badge tone="primary">Plan: {session.plan.name}</Badge>
                  <Badge tone="warning">INR {session.totalAmountInr}</Badge>
                </div>
                <p className="section-copy" style={{ marginBottom: 10 }}>
                  Session: {session.sessionId}. Billing profile: {session.billingEmail}.
                </p>
              </>
            ) : (
              <p className="section-copy" style={{ marginBottom: 10 }}>
                Session details were not found in the URL. Open checkout again to start a fresh payment flow.
              </p>
            )}

            <div className="chip-row">
              <Link href="/student/dashboard" aria-label="Go to student dashboard">
                <Button type="button" variant="primary">
                  Continue to Dashboard
                </Button>
              </Link>
              <Link href="/billing/checkout" aria-label="Open billing checkout">
                <Button type="button" variant="secondary">
                  Open Checkout
                </Button>
              </Link>
            </div>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
