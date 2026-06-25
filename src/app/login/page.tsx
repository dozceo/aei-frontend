"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Button, Card, Input } from "@/components/design-system";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useSchool } from "@/components/providers/SchoolProvider";
import { getRoleHome, normalizeRole } from "@/lib/auth";
import { signInWithFirebase, signInWithGoogle, signOutFromFirebase } from "@/lib/auth-client";
import { isRoleAllowedForPath, normalizePath } from "@/lib/route-auth";
import { resolveAppRole } from "@/lib/resolve-app-role";
import { isAdminEmail } from "@/lib/admins";

const roleOptions: Array<{ role: AppRole; label: string }> = [
  { role: "STUDENT", label: "Student" },
  { role: "TEACHER", label: "Teacher" },
  { role: "PARENT", label: "Parent" },
];

function resolveDestination(role: AppRole, nextPath: string | null): string {
  if (!nextPath) return getRoleHome(role);
  const normalizedNextPath = normalizePath(nextPath);
  if (!normalizedNextPath.startsWith("/") || normalizedNextPath === "/login") return getRoleHome(role);
  if (!isRoleAllowedForPath(normalizedNextPath, role)) return getRoleHome(role);
  return normalizedNextPath;
}

function identityToRole(identity: { isSuper?: boolean; role?: string | null } | null, email: string | null): AppRole | null {
  if (isAdminEmail(email) || identity?.isSuper) return "ADMIN";
  const r = identity?.role?.trim().toUpperCase();
  if (r === "STUDENT" || r === "TEACHER" || r === "PARENT" || r === "ADMIN") return r;
  return null;
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuthUser();
  const { identity, ready: schoolReady } = useSchool();
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedRole, setResolvedRole] = useState<AppRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) return;

    void (async () => {
      const fromIdentity = schoolReady ? identityToRole(identity, user.email) : null;
      const fromCookie = normalizeRole(
        typeof document !== "undefined"
          ? decodeURIComponent(
              document.cookie
                .split(";")
                .map((e) => e.trim())
                .find((e) => e.startsWith("aei-role="))
                ?.slice("aei-role=".length) ?? "",
            )
          : null,
      );
      const role = fromIdentity ?? fromCookie ?? (await resolveAppRole(user));
      setResolvedRole(role);

      const nextPath = new URLSearchParams(window.location.search).get("next");
      if (role) {
        router.replace(resolveDestination(role, nextPath));
      }
    })();
  }, [user, authLoading, identity, schoolReady, router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPath = new URLSearchParams(window.location.search).get("next");
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage("Enter both email and password to continue.");
      return;
    }
    setEmailSubmitting(true);
    try {
      const result = await signInWithFirebase(email, password, selectedRole || undefined);
      window.location.assign(resolveDestination(result.role, nextPath));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setEmailSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const nextPath = new URLSearchParams(window.location.search).get("next");
    setErrorMessage(null);
    setGoogleSubmitting(true);
    try {
      const result = await signInWithGoogle(selectedRole || undefined);
      window.location.assign(resolveDestination(result.role, nextPath));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const dashboardHref = getRoleHome(resolvedRole);

  return (
    <main
      className="app-shell"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <header style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 className="brand font-serif-brand" style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: 0 }}>
          SANKALP <span>AEI</span>
        </h1>
        <p className="muted" style={{ marginTop: 8 }}>Cognitive Access Fabric</p>
      </header>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {user ? (
          <Card title="Account active" subtitle={`Signed in as ${user.email}`}>
            <div style={{ display: "grid", gap: 16 }}>
              {resolvedRole ? (
                <Button variant="primary" fullWidth onClick={() => router.push(dashboardHref)}>
                  Go to dashboard
                </Button>
              ) : (
                <Button variant="primary" fullWidth onClick={() => router.push("/onboarding")}>
                  Complete setup
                </Button>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 8, borderTop: "1px solid var(--color-border)", fontSize: 14 }}>
                <span className="muted">Not you?</span>
                <button type="button" onClick={() => void signOutFromFirebase()} style={{ background: "none", border: "none", color: "var(--color-primary)", fontWeight: 700, cursor: "pointer" }}>
                  Sign out
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Welcome back" subtitle="Sign in to your intelligence workspace.">
            <form style={{ display: "grid", gap: 20 }} onSubmit={handleSignIn}>
              <div style={{ display: "grid", gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
                  Role selection
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as AppRole | "")}
                  className="nm-inset"
                  style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", fontSize: 14, minHeight: 44, background: "var(--paper)", color: "var(--color-text-primary)" }}
                >
                  <option value="">Auto-detect from profile</option>
                  {roleOptions.map((opt) => (
                    <option key={opt.role} value={opt.role}>{opt.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11, color: "var(--ink-faint)", margin: 0, fontStyle: "italic" }}>Select only for your first Google sign-in.</p>
              </div>

              <Input label="Institution email" type="email" placeholder="name@institution.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

              {errorMessage ? (
                <div className="nm-inset" style={{ padding: 12, borderRadius: "var(--radius-md)", color: "var(--coral-deep)", fontSize: 13, fontWeight: 600 }}>
                  {errorMessage}
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 12 }}>
                <Button variant="primary" type="submit" fullWidth loading={emailSubmitting} disabled={googleSubmitting}>
                  Sign in
                </Button>
                <Button variant="ghost" type="button" fullWidth onClick={() => void handleGoogleSignIn()} loading={googleSubmitting} disabled={emailSubmitting}>
                  Continue with Google
                </Button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600 }}>
                <Link href="/auth/forgot-password" className="muted">Forgot password?</Link>
                <Link href="/auth/signup" style={{ color: "var(--color-primary)" }}>Create account</Link>
              </div>
            </form>
          </Card>
        )}

        <div style={{ marginTop: 32, textAlign: "center", display: "flex", justifyContent: "center", gap: 24, fontSize: 14, fontWeight: 600 }}>
          <Link href="/help" className="muted">Help center</Link>
        </div>
      </div>
    </main>
  );
}
