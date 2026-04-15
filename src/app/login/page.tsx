"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { getRoleHome } from "@/lib/auth";
import { signInWithFirebase } from "@/lib/auth-client";
import { isRoleAllowedForPath, normalizePath } from "@/lib/route-auth";

const roleCards = ["Student", "Teacher", "Parent"];

const roleOptions: Array<{ role: AppRole; label: string }> = [
  { role: "STUDENT", label: "Student" },
  { role: "TEACHER", label: "Teacher" },
  { role: "PARENT", label: "Parent" },
];

function resolveDestination(role: AppRole, nextPath: string | null): string {
  if (!nextPath) {
    return getRoleHome(role);
  }

  const normalizedNextPath = normalizePath(nextPath);
  if (!normalizedNextPath.startsWith("/") || normalizedNextPath === "/login") {
    return getRoleHome(role);
  }

  if (!isRoleAllowedForPath(normalizedNextPath, role)) {
    return getRoleHome(role);
  }

  return normalizedNextPath;
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<AppRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    const nextPath = new URLSearchParams(window.location.search).get("next");
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Enter both email and password to continue.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await signInWithFirebase(email.trim(), password, selectedRole);
      router.push(resolveDestination(result.role, nextPath));
    } catch (error) {
      const fallbackMessage = "Sign-in failed. Check credentials and Firebase project setup.";
      setErrorMessage(error instanceof Error && error.message ? error.message : fallbackMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell" style={{ marginTop: 20 }}>
      <header className="top-nav nm-surface">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Login shortcuts">
          <Link href="/" className="nav-link">
            Plan Hub
          </Link>
          <a href="#support" className="nav-link">
            Support
          </a>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Login and identity access">
        <Card
          variant="soft"
          className="hero-block"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "var(--space-lg)",
          }}
        >
          <section
            style={{
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-xl)",
              minHeight: 520,
              background:
                "radial-gradient(circle at 12% 10%, rgba(155,131,248,0.38), transparent 38%), linear-gradient(130deg, #4e1fc8 0%, #6735ea 48%, #7f5af5 100%)",
              color: "white",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <Badge tone="primary">Cognitive Access Fabric</Badge>
            <h1 style={{ margin: "16px 0 10px", fontSize: "clamp(30px, 4.2vw, 52px)", lineHeight: 1.1 }}>
              Enter your role-specific intelligence workspace.
            </h1>
            <p style={{ opacity: 0.88, maxWidth: 460 }}>
              Identity-aware routes provide personalized dashboards, intervention controls, and parent insights with one secure login flow.
            </p>
            <div className="chip-row" style={{ marginTop: 26 }}>
              {roleCards.map((role) => (
                <span
                  key={role}
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    borderRadius: "var(--radius-full)",
                    padding: "8px 12px",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "var(--space-md)", alignContent: "start" }}>
            <Card title="Welcome Back" subtitle="Sign in to continue your planned flow.">
              <div style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>
                    Role
                  </span>
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
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {errorMessage ? (
                  <p style={{ margin: 0, color: "var(--color-danger)", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                    {errorMessage}
                  </p>
                ) : null}
                <Button variant="primary" type="button" fullWidth loading={submitting} onClick={handleSignIn}>
                  Sign In to Dashboard
                </Button>
                <Button variant="ghost" type="button" fullWidth onClick={handleSignIn} loading={submitting}>
                  Continue with SSO
                </Button>
              </div>
            </Card>

            <Card title="Need first-time setup?" subtitle="Begin with role selection and profile configuration.">
              <Link href="/onboarding" aria-label="Go to onboarding">
                <Button variant="secondary" type="button" fullWidth>
                  Open Onboarding
                </Button>
              </Link>
            </Card>
          </section>
        </Card>
      </section>
    </main>
  );
}
