"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Badge, Button, Card } from "@/components/design-system";
import { useAuthUser } from "@/hooks/useAuthUser";
import { ensureCurrentUserSeedData, setRoleSession } from "@/lib/auth-client";

const roles = [
  {
    name: "Student",
    details: "Access adaptive learning paths, memory diagnostics, and guided challenge sessions.",
    role: "STUDENT" as AppRole,
    target: "/student/dashboard",
  },
  {
    name: "Teacher",
    details: "Manage class performance, interventions, and learner trajectories in real time.",
    role: "TEACHER" as AppRole,
    target: "/teacher/dashboard",
  },
  {
    name: "Parent",
    details: "Track weekly progress, receive interventions, and review child achievements.",
    role: "PARENT" as AppRole,
    target: "/parent/dashboard",
  },
];

export default function OnboardingPage() {
  const [submittingRole, setSubmittingRole] = useState<AppRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuthUser();
  const router = useRouter();

  const handleContinue = async (role: AppRole, targetPath: string) => {
    if (!user) {
      setErrorMessage("Sign in first to complete onboarding.");
      return;
    }

    setErrorMessage(null);
    setSubmittingRole(role);

    try {
      await ensureCurrentUserSeedData(role);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to prepare account data. Try again.");
      setSubmittingRole(null);
      return;
    }

    setRoleSession(role);
    router.push(targetPath);
  };

  return (
    <main className="app-shell">
      <header className="top-nav nm-surface">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links">
          <Link href="/" className="nav-link">
            Plan Hub
          </Link>
          <Link href="/login" className="nav-link">
            Login
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid">
        <Card className="hero-block" variant="surface">
          <span className="eyebrow">Step 01 / 04</span>
          <h1 style={{ margin: "12px 0 10px", fontSize: "clamp(30px, 4.5vw, 58px)", lineHeight: 1.06 }}>
            Choose your <span className="text-gradient">perspective</span> to continue.
          </h1>
          <p className="section-copy" style={{ maxWidth: 740 }}>
            This onboarding page is intentionally original while retaining the AEI visual language. Select a role
            below to open the corresponding planned dashboard flow.
          </p>
          {authError ? (
            <p style={{ margin: "8px 0 0", color: "var(--color-error)", fontWeight: 600, fontSize: "var(--font-size-xs)" }}>
              {authError}
            </p>
          ) : null}
          {errorMessage ? (
            <p style={{ margin: "8px 0 0", color: "var(--color-error)", fontWeight: 600, fontSize: "var(--font-size-xs)" }}>
              {errorMessage}
            </p>
          ) : null}
        </Card>

        <div className="card-grid-2" style={{ gridColumn: "span 12" }}>
          {roles.map((role, index) => (
            <Card key={role.name} variant={index === 0 ? "soft" : "surface"} title={role.name} subtitle={role.details}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Badge tone={index === 0 ? "primary" : "neutral"}>{index === 0 ? "Recommended" : "Role"}</Badge>
                <Button
                  variant={index === 0 ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => handleContinue(role.role, role.target)}
                  loading={submittingRole === role.role}
                  disabled={authLoading || submittingRole !== null}
                >
                  Continue
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
