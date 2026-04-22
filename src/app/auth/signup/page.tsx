"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { useAuthUser } from "@/hooks/useAuthUser";
import { signUpWithFirebase, signInWithGoogle, signOutFromFirebase } from "@/lib/auth-client";

const roleOptions: Array<{ role: AppRole; label: string; note: string }> = [
  { role: "STUDENT", label: "Student", note: "Adaptive missions and tracking" },
  { role: "TEACHER", label: "Teacher", note: "Class intelligence and commands" },
  { role: "PARENT", label: "Parent", note: "Progress and notifications" },
];

const roleDestination: Record<AppRole, string> = {
  STUDENT: "/student/dashboard",
  TEACHER: "/teacher/dashboard",
  PARENT: "/parent/dashboard",
};

export default function SignupPage() {
  const { user } = useAuthUser();
  const [selectedRole, setSelectedRole] = useState<AppRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const canSubmit = email.trim().length > 0 && password.length >= 8 && confirmPassword.length >= 8 && acceptPolicy;

  const handleSignup = async () => {
    setError(null);
    if (!canSubmit) {
      setError("Complete all fields and accept policy terms.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await signUpWithFirebase(email.trim(), password, selectedRole);
      setSuccess("Redirecting to dashboard...");
      router.push(roleDestination[selectedRole]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    if (!acceptPolicy) {
      setError("Please accept policy terms first.");
      return;
    }
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle(selectedRole);
      setSuccess("Redirecting to dashboard...");
      router.push(roleDestination[selectedRole]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Google signup failed.");
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
        <p className="text-slate-500 mt-2">Create Intelligence Account</p>
      </header>

      <div className="w-full max-w-lg">
        {user ? (
          <Card title="Account Active" subtitle={`Signed in as ${user.email}`}>
            <div className="space-y-4">
              <Button variant="primary" fullWidth onClick={() => router.push("/")}>
                Return to Home
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
          <Card title="Create Account" subtitle="Join the role-aware learning workspace.">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AppRole)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20"
                  >
                    {roleOptions.map((opt) => (
                      <option key={opt.role} value={opt.role}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Password"
                  type="password"
                  placeholder="Min. 8 chars"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Input
                  label="Confirm"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {roleOptions.map((opt) => (
                  <Badge key={opt.role} tone={selectedRole === opt.role ? "primary" : "neutral"}>
                    {opt.label}: {opt.note}
                  </Badge>
                ))}
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPolicy}
                  onChange={(e) => setAcceptPolicy(e.target.checked)}
                  className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I accept platform Terms and Privacy conditions including real-time event-driven tracking.
                </span>
              </label>

              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 rounded-md bg-green-50 text-green-600 text-xs font-medium border border-green-100">
                  {success}
                </div>
              )}

              <div className="space-y-3 pt-2 border-t">
                <Button variant="primary" type="button" fullWidth loading={submitting} disabled={googleSubmitting} onClick={handleSignup}>
                  Create Account
                </Button>
                <Button variant="ghost" type="button" fullWidth onClick={handleGoogleSignup} loading={googleSubmitting} disabled={submitting}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2 inline" alt="" />
                  Sign up with Google
                </Button>
              </div>

              <div className="text-center pt-2 text-sm font-medium">
                <span className="text-slate-500">Already have an account? </span>
                <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-8 text-center space-x-6 text-sm font-medium text-slate-400">
          <Link href="/" className="hover:text-slate-600">Home</Link>
          <Link href="/help" className="hover:text-slate-600">Help Center</Link>
        </div>
      </div>
    </main>
  );
}
