"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getRoleHome } from "@/lib/auth";
import { signInWithFirebase, signInWithGoogle, signOutFromFirebase } from "@/lib/auth-client";
import { isRoleAllowedForPath, normalizePath } from "@/lib/route-auth";

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

export default function LoginPage() {
  const { user } = useAuthUser();
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

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
      router.push(resolveDestination(result.role, nextPath));
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
      router.push(resolveDestination(result.role, nextPath));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <main className="app-shell min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <header className="brand mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          SANKALP <span className="text-blue-600">AEI</span>
        </h1>
        <p className="text-slate-500 mt-2">Cognitive Access Fabric</p>
      </header>

      <div className="w-full max-w-md">
        {user ? (
          <Card title="Account Active" subtitle={`Signed in as ${user.email}`}>
            <div className="space-y-4">
              <Button variant="primary" fullWidth onClick={() => router.push("/")}>
                Return to Plan Hub
              </Button>
              <div className="flex items-center justify-center gap-2 pt-2 border-t text-sm">
                <span className="text-slate-500">Not you?</span>
                <button 
                  onClick={signOutFromFirebase}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Welcome Back" subtitle="Please sign in to your intelligence workspace.">
            <form className="space-y-5" onSubmit={handleSignIn}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Role Selection</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as AppRole | "")}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Auto-detect from profile</option>
                  {roleOptions.map((opt) => (
                    <option key={opt.role} value={opt.role}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 italic">Select only for your first Google sign-in.</p>
              </div>

              <Input
                label="Institution Email"
                type="email"
                placeholder="name@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {errorMessage && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <Button variant="primary" type="submit" fullWidth loading={emailSubmitting} disabled={googleSubmitting}>
                  Sign In
                </Button>
                <Button variant="ghost" type="button" fullWidth onClick={handleGoogleSignIn} loading={googleSubmitting} disabled={emailSubmitting}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2 inline" alt="" />
                  Continue with Google
                </Button>
              </div>

              <div className="flex justify-between items-center pt-4 text-sm font-medium">
                <Link href="/auth/forgot-password" size="sm" className="text-slate-500 hover:text-slate-800 transition-colors">
                  Forgot Password?
                </Link>
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Create Account
                </Link>
              </div>
            </form>
          </Card>
        )}
        
        <div className="mt-8 text-center space-x-6 text-sm font-medium text-slate-400">
          <Link href="/" className="hover:text-slate-600">Plan Hub</Link>
          <Link href="/help" className="hover:text-slate-600">Help Center</Link>
        </div>
      </div>
    </main>
  );
}
