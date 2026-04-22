"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { updateProfile } from "firebase/auth";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getProfileDefaults, loadUserProfileSettings, saveUserProfileSettings, type UserProfileSettings } from "@/lib/user-settings-db";

const profileNav = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/preferences", label: "Preferences" },
  { href: "/support/ticket", label: "Support" },
  { href: "/help", label: "Help" },
];

function sanitizePhone(value: string): string {
  return value.replace(/[^+\d\s()-]/g, "").slice(0, 24);
}

export default function ProfileSettingsPage() {
  const { user } = useAuthUser();

  const [form, setForm] = useState<UserProfileSettings>(getProfileDefaults());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(authLoading);
      return;
    }

    let active = true;

    loadUserProfileSettings(user.uid)
      .then((payload) => {
        if (!active) {
          return;
        }

        setForm(payload);
        setLoading(false);
      })
      .catch((nextError) => {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load profile settings.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const mergedError = authError ?? error;

  const handleSave = async () => {
    if (!user) {
      setError("You must be signed in to save profile settings.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: UserProfileSettings = {
      fullName: form.fullName.trim().slice(0, 80),
      phone: sanitizePhone(form.phone),
      timezone: form.timezone.trim().slice(0, 60),
      notificationsEnabled: form.notificationsEnabled,
      privacyMode: form.privacyMode,
    };

    try {
      await saveUserProfileSettings(user.uid, payload);

      if (payload.fullName.length > 0 && user.displayName !== payload.fullName) {
        await updateProfile(user, { displayName: payload.fullName });
      }

      setForm(payload);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Settings navigation">
          {profileNav.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link${item.href === "/settings/profile" ? " active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Profile settings">
        <DatabaseState loading={loading} error={mergedError} pathHint={user ? `users/${user.uid}/settings/profile` : "users/{uid}/settings/profile"} />

        {!loading && !mergedError ? (
          <>
            <Card className="hero-block reveal-up reveal-delay-1" variant="soft" title="Profile settings" subtitle="Identity, notification, and privacy controls synced to Firestore">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input
                  label="Full name"
                  name="full-name"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Your display name"
                />
                <Input
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: sanitizePhone(event.target.value) }))}
                  placeholder="+91..."
                />
                <Input
                  label="Timezone"
                  name="timezone"
                  value={form.timezone}
                  onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                  placeholder="Asia/Kolkata"
                />
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Privacy mode</span>
                  <select
                    value={form.privacyMode}
                    onChange={(event) => setForm((prev) => ({ ...prev, privacyMode: event.target.value as UserProfileSettings["privacyMode"] }))}
                    style={{
                      width: "100%",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      padding: "10px 12px",
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <input
                  type="checkbox"
                  checked={form.notificationsEnabled}
                  onChange={(event) => setForm((prev) => ({ ...prev, notificationsEnabled: event.target.checked }))}
                  aria-label="Email notification preference"
                />
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  Allow email notifications for progress, interventions, and alerts.
                </span>
              </label>

              <div className="chip-row" style={{ marginTop: 16 }}>
                <Button type="button" variant="primary" loading={saving} onClick={handleSave}>
                  Save Profile
                </Button>
                <Link href="/settings/preferences" aria-label="Open preference settings">
                  <Button type="button" variant="secondary">
                    Go to Preferences
                  </Button>
                </Link>
              </div>

              {savedAt ? (
                <p style={{ marginTop: 12, marginBottom: 0, color: "var(--color-success)", fontSize: "var(--font-size-xs)", fontWeight: 700 }}>
                  Saved at {savedAt}
                </p>
              ) : null}
            </Card>

            <Card style={{ gridColumn: "span 12" }} className="reveal-up reveal-delay-2" title="Security notes" subtitle="Low-latency and safe defaults">
              <div className="chip-row">
                <Badge tone="primary">Input sanitized</Badge>
                <Badge tone="success">Firestore merge writes</Badge>
                <Badge tone="warning">Auth required</Badge>
              </div>
              <p className="section-copy" style={{ marginTop: 10 }}>
                This page only writes user-scoped documents and trims unsafe characters from profile inputs before persistence.
              </p>
            </Card>
          </>
        ) : null}
      </section>
    </main>
  );
}
