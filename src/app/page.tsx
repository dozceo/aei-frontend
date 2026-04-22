"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppRole } from "@/app/routes";
import { Button } from "@/components/design-system";
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

export default function LandingAndLoginPage() {
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
    const nextPath = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("next") : null;
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
    const nextPath = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("next") : null;
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
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Left side: Hero / Branding */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm font-semibold tracking-wide uppercase mb-6">
            Cognitive Access Fabric
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              SANKALP AEI
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-lg leading-relaxed">
            The next-generation intelligence workspace orchestrating seamless learning, teaching, and parenting experiences.
          </p>
          
          <div className="flex items-center gap-6 mt-12 text-slate-400">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">3</span>
              <span className="text-sm">Core Roles</span>
            </div>
            <div className="w-px h-10 bg-slate-700/50" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white">AI</span>
              <span className="text-sm">Powered Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full md:w-[480px] lg:w-[540px] flex flex-col justify-center p-8 lg:p-12 bg-white relative text-slate-900 shadow-2xl">
        <div className="w-full max-w-md mx-auto">
          {user ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Account Active</h2>
                <p className="text-slate-500">You are currently signed in as {user.email}</p>
              </div>
              <Button variant="primary" fullWidth onClick={() => {
                const home = getRoleHome("STUDENT"); // Fallback, could resolve properly
                router.push(home);
              }}>
                Go to Dashboard
              </Button>
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-100 text-sm">
                <span className="text-slate-500">Not you?</span>
                <button 
                  onClick={signOutFromFirebase}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center md:text-left mb-8">
                <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">Sign In</h2>
                <p className="text-slate-500">Access your personalized intelligence workspace.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSignIn}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Role Selection</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AppRole | "")}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
                  >
                    <option value="">Auto-detect from profile</option>
                    {roleOptions.map((opt) => (
                      <option key={opt.role} value={opt.role}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 italic">Select only for your first Google sign-in.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Institution Email</label>
                  <input
                    type="email"
                    placeholder="name@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none"
                  />
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-start">
                    <svg className="w-5 h-5 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={emailSubmitting || googleSubmitting}
                    className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-70"
                  >
                    {emailSubmitting ? "Signing in..." : "Sign In"}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={handleGoogleSignIn}
                    disabled={googleSubmitting || emailSubmitting}
                    className="w-full py-3 px-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 hover:border-slate-300 focus:ring-4 focus:ring-slate-200/50 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                    Continue with Google
                  </button>
                </div>

                <div className="flex justify-between items-center pt-6 text-sm font-medium border-t border-slate-100 mt-6">
                  <Link href="/auth/forgot-password" className="text-slate-500 hover:text-slate-800 transition-colors">
                    Forgot Password?
                  </Link>
                  <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 transition-colors">
                    Create Account
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
