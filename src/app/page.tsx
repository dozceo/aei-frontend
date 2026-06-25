"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getRoleHome, normalizeRole } from "@/lib/auth";
import { resolveAppRole } from "@/lib/resolve-app-role";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie.split(";").map((e) => e.trim()).find((e) => e.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export default function HomePage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    void (async () => {
      const cookieRole = normalizeRole(getCookie("aei-role"));
      const role = cookieRole ?? (await resolveAppRole(user));
      router.replace(getRoleHome(role));
    })();
  }, [user, loading, router]);

  return (
    <main className="app-shell" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <p className="muted">Redirecting…</p>
    </main>
  );
}
