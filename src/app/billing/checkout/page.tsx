"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { useAuthUser } from "@/hooks/useAuthUser";
import {
  completeBillingCheckoutSession,
  createBillingCheckoutSession,
  fetchBillingPlans,
  type BillingCheckoutSessionSummary,
  type BillingPaymentMethod,
  type BillingPlan,
  type BillingPlanId,
} from "@/lib/billing-api";

interface BillingDraft {
  billingName: string;
  billingEmail: string;
  discountCode: string;
  paymentMethod: BillingPaymentMethod;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const paymentLabels: Record<BillingPaymentMethod, string> = {
  CARD: "Card",
  UPI: "UPI",
  NETBANKING: "Net Banking",
};

function sanitizeInput(value: string, maxLength: number): string {
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength);
}

export default function BillingCheckoutPage() {
  const router = useRouter();
  const { user } = useAuthUser();

  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<BillingPlanId>("starter");
  const [draft, setDraft] = useState<BillingDraft>({
    billingName: "",
    billingEmail: "",
    discountCode: "",
    paymentMethod: "CARD",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });
  const [session, setSession] = useState<BillingCheckoutSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (user?.email && draft.billingEmail.length === 0) {
      setDraft((prev) => ({ ...prev, billingEmail: user.email || "" }));
    }
  }, [user, draft.billingEmail.length]);

  useEffect(() => {
    if (!user) {
      setLoading(authLoading);
      return;
    }

    let active = true;

    fetchBillingPlans()
      .then((nextPlans) => {
        if (!active) {
          return;
        }

        setPlans(nextPlans);
        if (!nextPlans.some((plan) => plan.id === selectedPlanId)) {
          setSelectedPlanId(nextPlans[0]?.id || "starter");
        }
        setLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load billing plans.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading, selectedPlanId]);

  const selectedPlan = useMemo(() => plans.find((item) => item.id === selectedPlanId) || null, [plans, selectedPlanId]);

  const mergedError = authError ?? error;

  const handleCheckout = async () => {
    if (!user) {
      setError("Sign in with Firebase to continue billing checkout.");
      return;
    }

    const billingName = sanitizeInput(draft.billingName, 120);
    const billingEmail = sanitizeInput(draft.billingEmail, 120);
    const line1 = sanitizeInput(draft.line1, 120);
    const line2 = sanitizeInput(draft.line2, 120);
    const city = sanitizeInput(draft.city, 80);
    const state = sanitizeInput(draft.state, 80);
    const postalCode = sanitizeInput(draft.postalCode, 24);
    const country = sanitizeInput(draft.country, 80);
    const discountCode = sanitizeInput(draft.discountCode, 40);

    if (!billingName || !billingEmail || !line1 || !city || !state || !postalCode || !country) {
      setError("Complete all required billing fields before checkout.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const nextSession = await createBillingCheckoutSession({
        planId: selectedPlanId,
        billingName,
        billingEmail,
        paymentMethod: draft.paymentMethod,
        discountCode: discountCode || undefined,
        billingAddress: {
          line1,
          line2,
          city,
          state,
          postalCode,
          country,
        },
      });

      setSession(nextSession);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create checkout session.");
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (status: "SUCCEEDED" | "FAILED") => {
    if (!session) {
      return;
    }

    setCompleting(true);
    setError(null);

    try {
      const updated = await completeBillingCheckoutSession(session.sessionId, { status });

      if (status === "SUCCEEDED") {
        router.push(`/billing/success?session=${updated.sessionId}`);
        return;
      }

      router.push(`/billing/failed?session=${updated.sessionId}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update payment status.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Billing navigation">
          <Link href="/billing/checkout" className="nav-link active">
            Checkout
          </Link>
          <Link href="/settings/profile" className="nav-link">
            Settings
          </Link>
          <Link href="/help" className="nav-link">
            Help
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Billing checkout">
        <DatabaseState loading={loading} error={mergedError} pathHint="api/billing/plans + api/billing/checkout" />

        {!loading && !mergedError ? (
          <>
            <Card className="hero-block reveal-up reveal-delay-1" variant="soft" title="Billing checkout" subtitle="Secure plan activation with authenticated backend checkout session">
              <div className="card-grid-3" style={{ gridColumn: "span 12", marginBottom: 12 }}>
                {plans.map((plan) => {
                  const active = selectedPlanId === plan.id;

                  return (
                    <Card key={plan.id} title={plan.name} subtitle={`INR ${plan.monthlyAmountInr}/month`} variant={active ? "soft" : "surface"}>
                      <p className="section-copy" style={{ marginBottom: 8 }}>
                        Seats: {plan.seatLimit}
                      </p>
                      <ul className="list-clean" style={{ marginBottom: 10 }}>
                        {plan.features.map((feature) => (
                          <li key={feature} className="section-copy">
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button type="button" variant={active ? "primary" : "secondary"} onClick={() => setSelectedPlanId(plan.id)}>
                        {active ? "Selected" : "Choose plan"}
                      </Button>
                    </Card>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input
                  label="Billing name"
                  name="billing-name"
                  value={draft.billingName}
                  onChange={(event) => setDraft((prev) => ({ ...prev, billingName: event.target.value }))}
                  placeholder="Account owner"
                />
                <Input
                  label="Billing email"
                  name="billing-email"
                  type="email"
                  value={draft.billingEmail}
                  onChange={(event) => setDraft((prev) => ({ ...prev, billingEmail: event.target.value }))}
                  placeholder="finance@school.edu"
                />
                <Input
                  label="Address line 1"
                  name="billing-line1"
                  value={draft.line1}
                  onChange={(event) => setDraft((prev) => ({ ...prev, line1: event.target.value }))}
                  placeholder="Street and building"
                />
                <Input
                  label="Address line 2"
                  name="billing-line2"
                  value={draft.line2}
                  onChange={(event) => setDraft((prev) => ({ ...prev, line2: event.target.value }))}
                  placeholder="Landmark (optional)"
                />
                <Input
                  label="City"
                  name="billing-city"
                  value={draft.city}
                  onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="Bengaluru"
                />
                <Input
                  label="State"
                  name="billing-state"
                  value={draft.state}
                  onChange={(event) => setDraft((prev) => ({ ...prev, state: event.target.value }))}
                  placeholder="Karnataka"
                />
                <Input
                  label="Postal code"
                  name="billing-postal-code"
                  value={draft.postalCode}
                  onChange={(event) => setDraft((prev) => ({ ...prev, postalCode: event.target.value }))}
                  placeholder="560001"
                />
                <Input
                  label="Country"
                  name="billing-country"
                  value={draft.country}
                  onChange={(event) => setDraft((prev) => ({ ...prev, country: event.target.value }))}
                  placeholder="India"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <Input
                  label="Discount code"
                  name="discount-code"
                  value={draft.discountCode}
                  onChange={(event) => setDraft((prev) => ({ ...prev, discountCode: event.target.value.toUpperCase() }))}
                  placeholder="SANKALP10"
                />
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Payment method</span>
                  <select
                    value={draft.paymentMethod}
                    onChange={(event) => setDraft((prev) => ({ ...prev, paymentMethod: event.target.value as BillingPaymentMethod }))}
                    style={{
                      width: "100%",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      padding: "10px 12px",
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </label>
              </div>

              {selectedPlan ? (
                <div className="chip-row" style={{ marginTop: 12 }}>
                  <Badge tone="primary">Plan: {selectedPlan.name}</Badge>
                  <Badge tone="neutral">Method: {paymentLabels[draft.paymentMethod]}</Badge>
                </div>
              ) : null}

              {error ? (
                <p style={{ margin: "10px 0 0", color: "var(--color-error)", fontSize: "var(--font-size-xs)", fontWeight: 700 }}>{error}</p>
              ) : null}

              <div className="chip-row" style={{ marginTop: 14 }}>
                <Button type="button" variant="primary" loading={processing} onClick={handleCheckout}>
                  Proceed to Secure Checkout
                </Button>
                <Link href="/help" aria-label="Billing help">
                  <Button type="button" variant="ghost">
                    Need Help
                  </Button>
                </Link>
              </div>
            </Card>

            {session ? (
              <Card className="reveal-up reveal-delay-2" style={{ gridColumn: "span 12" }} title="Checkout session created" subtitle={`Session ${session.sessionId}`}>
                <div className="chip-row" style={{ marginBottom: 10 }}>
                  <Badge tone="success">Subtotal INR {session.subtotalAmountInr}</Badge>
                  <Badge tone="warning">Discount INR {session.discountAmountInr}</Badge>
                  <Badge tone="primary">Payable INR {session.totalAmountInr}</Badge>
                </div>
                <p className="section-copy" style={{ marginBottom: 10 }}>
                  Provider: {session.checkoutProvider}. This environment currently uses simulated completion to verify end-to-end billing wiring before external gateway rollout.
                </p>
                <div className="chip-row">
                  <Button type="button" variant="primary" loading={completing} onClick={() => handleComplete("SUCCEEDED")}>
                    Simulate Payment Success
                  </Button>
                  <Button type="button" variant="danger" loading={completing} onClick={() => handleComplete("FAILED")}>
                    Simulate Payment Failure
                  </Button>
                </div>
              </Card>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
