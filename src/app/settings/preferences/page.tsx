"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useUserPreferencesQuery, useSaveUserPreferencesMutation } from "@/hooks/queries";
import { getPreferenceDefaults, type UserPreferenceSettings } from "@/lib/user-settings-db";

const prefNav = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/preferences", label: "Preferences" },
  { href: "/support/ticket", label: "Support" },
  { href: "/help", label: "Help" },
];

export default function PreferenceSettingsPage() {
  const { user, loading: authLoading, error: authError } = useAuthUser();
  const { data: prefData, isLoading: queryLoading, error: queryError } = useUserPreferencesQuery(user?.uid);
  const savePreferences = useSaveUserPreferencesMutation(user?.uid);

  const [form, setForm] = useState<UserPreferenceSettings>(getPreferenceDefaults());
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (prefData) setForm(prefData);
  }, [prefData]);

  const loading = authLoading || queryLoading;
  const mergedError = authError ?? (queryError ? queryError.message : null);

  const handleSave = async () => {
    if (!user) return;

    const payload: UserPreferenceSettings = {
      learningGoal: form.learningGoal.trim().slice(0, 160),
      notificationFrequency: form.notificationFrequency,
      language: form.language.trim().slice(0, 40),
      theme: form.theme,
      timezone: form.timezone.trim().slice(0, 60),
      largeText: form.largeText,
      highContrast: form.highContrast,
    };

    try {
      await savePreferences.mutateAsync(payload);
      setForm(payload);
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      // mutation error accessible via savePreferences.error
    }
  };

  const selectStyle = {
    width: "100%",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    padding: "10px 12px",
    background: "var(--color-surface-elevated)",
    color: "var(--color-text-primary)",
  };

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Preference navigation">
          {prefNav.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link${item.href === "/settings/preferences" ? " active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Preference settings">
        <DatabaseState
          loading={loading}
          error={mergedError ?? (savePreferences.error ? savePreferences.error.message : null)}
          pathHint={user ? `users/${user.uid}/settings/preferences` : "users/{uid}/settings/preferences"}
        />

        {!loading && !mergedError ? (
          <>
            <Card className="hero-block reveal-up reveal-delay-1" variant="soft" title="Preference settings" subtitle="Personalized learning and accessibility controls">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Learning goal" name="learning-goal" value={form.learningGoal}
                  onChange={(e) => setForm((p) => ({ ...p, learningGoal: e.target.value }))} placeholder="Describe your top outcome" />
                <Input label="Language" name="language" value={form.language}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} placeholder="English" />
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Notification frequency</span>
                  <select value={form.notificationFrequency}
                    onChange={(e) => setForm((p) => ({ ...p, notificationFrequency: e.target.value as UserPreferenceSettings["notificationFrequency"] }))}
                    style={selectStyle}>
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 700 }}>Theme</span>
                  <select value={form.theme}
                    onChange={(e) => setForm((p) => ({ ...p, theme: e.target.value as UserPreferenceSettings["theme"] }))}
                    style={selectStyle}>
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <Input label="Timezone" name="timezone" value={form.timezone}
                  onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} placeholder="Asia/Kolkata" />
              </div>

              <div className="chip-row" style={{ marginTop: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.largeText}
                    onChange={(e) => setForm((p) => ({ ...p, largeText: e.target.checked }))} aria-label="Large text toggle" />
                  <span style={{ fontSize: "var(--font-size-sm)" }}>Large text mode</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={form.highContrast}
                    onChange={(e) => setForm((p) => ({ ...p, highContrast: e.target.checked }))} aria-label="High contrast toggle" />
                  <span style={{ fontSize: "var(--font-size-sm)" }}>High contrast mode</span>
                </label>
              </div>

              <div className="chip-row" style={{ marginTop: 16 }}>
                <Button type="button" variant="primary" loading={savePreferences.isPending} onClick={handleSave}>Save Preferences</Button>
                <Link href="/settings/profile" aria-label="Back to profile settings">
                  <Button type="button" variant="secondary">Back to Profile</Button>
                </Link>
              </div>

              {savedAt ? (
                <p style={{ marginTop: 12, marginBottom: 0, color: "var(--color-success)", fontSize: "var(--font-size-xs)", fontWeight: 700 }}>
                  Saved at {savedAt}
                </p>
              ) : null}
            </Card>

            <Card style={{ gridColumn: "span 12" }} className="reveal-up reveal-delay-2" title="Performance notes" subtitle="Low-latency preference persistence">
              <div className="chip-row">
                <Badge tone="primary">Merge writes</Badge>
                <Badge tone="success">Small payloads</Badge>
                <Badge tone="warning">Role-agnostic</Badge>
              </div>
              <p className="section-copy" style={{ marginTop: 10 }}>
                Preference saves are compact single-document writes to reduce latency and avoid heavy fetch cycles.
              </p>
            </Card>
          </>
        ) : null}
      </section>
    </main>
  );
}
