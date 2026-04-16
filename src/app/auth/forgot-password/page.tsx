"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Input } from "@/components/design-system";
import { sendResetEmail } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Enter your email to receive a password reset link.");
      return;
    }

    setSubmitting(true);

    try {
      await sendResetEmail(email.trim());
      setSuccess("Reset email sent. Check your inbox and spam folder.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to send reset email.");
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
        <nav className="nav-links" aria-label="Forgot password navigation">
          <Link href="/login" className="nav-link">
            Login
          </Link>
          <Link href="/auth/signup" className="nav-link">
            Signup
          </Link>
          <Link href="/help" className="nav-link">
            Help
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Reset password form">
        <Card
          className="hero-block reveal-up reveal-delay-1"
          variant="soft"
          title="Reset password"
          subtitle="Secure email-based reset for your Sankalp account"
        >
          <div style={{ maxWidth: 560, display: "grid", gap: 12 }}>
            <Input
              label="Account email"
              type="email"
              name="reset-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@institution.edu"
            />
            {error ? (
              <p style={{ margin: 0, color: "var(--color-error)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>{error}</p>
            ) : null}
            {success ? (
              <p style={{ margin: 0, color: "var(--color-success)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>{success}</p>
            ) : null}
            <div className="chip-row">
              <Button type="button" variant="primary" loading={submitting} onClick={handleReset}>
                Send Reset Link
              </Button>
              <Link href="/login" aria-label="Return to login">
                <Button type="button" variant="secondary">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}
