"use client";

import { Badge, Button, Card, Progress } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParentPageContent } from "@/hooks/useRolePageContent";
import { getParentPagePath, parentFallbackNav, type ParentDashboardDoc } from "@/lib/role-content";

const pageKey = "dashboard" as const;

export default function ParentDashboardPage() {
  const { data, loading, error, roleId } = useParentPageContent<ParentDashboardDoc>(pageKey);
  const pathHint = getParentPagePath(roleId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Parent dashboard"}
      subtitle={data?.hero.subtitle ?? "Database-backed parent insights"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? parentFallbackNav}
      activePath="/parent/dashboard"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.sections.snapshotTitle} subtitle={data.sections.snapshotSubtitle} style={{ gridColumn: "span 5" }}>
            <div className="chip-row" style={{ marginBottom: 12 }}>
              {data.snapshotBadges.map((badge) => (
                <Badge key={badge.label} tone={badge.tone}>
                  {badge.label}
                </Badge>
              ))}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {data.snapshotMetrics.map((metric) => (
                <Progress
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  hint={metric.hint}
                  tone={metric.tone}
                />
              ))}
            </div>
          </Card>

          <Card title={data.sections.trendTitle} subtitle={data.sections.trendSubtitle} style={{ gridColumn: "span 7" }}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.weeklyTrend.map((point) => (
                <div
                  key={point.weekLabel}
                  style={{ display: "grid", gridTemplateColumns: "52px 1fr auto", gap: 10, alignItems: "center" }}
                >
                  <strong>{point.weekLabel}</strong>
                  <div className="nm-inset" style={{ height: 12, borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <span
                      style={{
                        width: `${point.score}%`,
                        height: "100%",
                        display: "block",
                        background: "linear-gradient(110deg, var(--color-primary), var(--color-primary-soft))",
                      }}
                    />
                  </div>
                  <span className="muted" style={{ fontSize: "var(--font-size-xs)" }}>
                    {point.score}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title={data.sections.notificationsTitle} subtitle={data.sections.notificationsSubtitle} style={{ gridColumn: "span 12" }}>
            <ul className="list-clean">
              {data.notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="nm-surface-soft"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>{notification.title}</strong>
                    <p className="section-copy" style={{ marginTop: 4 }}>
                      {notification.message}
                    </p>
                  </div>
                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <Badge tone={notification.read ? "neutral" : "primary"}>{notification.statusLabel}</Badge>
                    <span className="muted" style={{ fontSize: "var(--font-size-xs)" }}>
                      {notification.timestamp}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 14 }}>
              <Button variant="secondary">{data.reportButtonLabel}</Button>
            </div>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
