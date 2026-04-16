"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { signUpWithFirebase } from "@/lib/auth-client";

const roleOptions: Array<{ role: AppRole; label: string; note: string }> = [
  { role: "STUDENT", label: "Student", note: "Adaptive missions and mastery tracking" },
  { role: "TEACHER", label: "Teacher", note: "Intervention command and class intelligence" },
  { role: "PARENT", label: "Parent", note: "Progress monitoring and parent notifications" },
];

const roleDestination: Record<AppRole, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
};

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<AppRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const canSubmit = email.trim().length > 0 && password.length >= 8 && confirmPassword.length >= 8 && acceptPolicy;

  const handleSignup = async () => {
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError("Complete all fields, use a minimum 8-character password, and accept policy terms.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirmation do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await signUpWithFirebase(email.trim(), password, selectedRole);
      setSuccess("Account created successfully. Redirecting to your dashboard...");
      router.push(roleDestination[selectedRole]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Signup failed. Try again.");
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
        <nav className="nav-links" aria-label="Signup navigation">
          <Link href="/" className="nav-link">
            Plan Hub
          </Link>
          <Link href="/login" className="nav-link">
            Login
          </Link>
          <Link href="/help" className="nav-link">
            Help
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Signup form">
        <Card
          className="hero-block reveal-up reveal-delay-1"
          variant="soft"
          title="Create your Sankalp account"
          subtitle="Role-aware registration with secure Firebase authentication"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@institution.edu"
            />
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-secondary)" }}>Role</span>
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as AppRole)}
                style={{
                  width: "100%",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  padding: "10px 12px",
                  background: "var(--color-surface-elevated)",
                  color: "var(--color-text-primary)",
                }}
              >
                {roleOptions.map((option) => (
                  <option key={option.role} value={option.role}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
            />
            <Input
              label="Confirm password"
              type="password"
              name="confirm-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
            />
          </div>

          <div className="chip-row" style={{ marginTop: 14 }}>
            {roleOptions.map((option) => (
              <Badge key={option.role} tone={selectedRole === option.role ? "primary" : "neutral"}>
                {option.label}: {option.note}
              </Badge>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
            <input
              type="checkbox"
              checked={acceptPolicy}
              onChange={(event) => setAcceptPolicy(event.target.checked)}
              aria-label="Accept terms"
            />
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              I accept platform Terms and Privacy conditions.
            </span>
          </label>

          {error ? (
            <p style={{ marginTop: 10, marginBottom: 0, color: "var(--color-error)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
              {error}
            </p>
          ) : null}
          {success ? (
            <p style={{ marginTop: 10, marginBottom: 0, color: "var(--color-success)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
              {success}
            </p>
          ) : null}

          <div className="chip-row" style={{ marginTop: 16 }}>
            <Button type="button" variant="primary" loading={submitting} onClick={handleSignup}>
              Create Account
            </Button>
            <Link href="/auth/forgot-password" aria-label="Forgot password">
              <Button type="button" variant="ghost">
                Forgot Password
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
