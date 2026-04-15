"use client";

import { Badge, Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParentPageContent } from "@/hooks/useRolePageContent";
import { getParentPagePath, parentFallbackNav, type ParentInboxDoc } from "@/lib/role-content";
import { getNotificationTone } from "@/lib/tone-utils";

const pageKey = "inbox" as const;

export default function ParentInboxPage() {
  const { data, loading, error, roleId } = useParentPageContent<ParentInboxDoc>(pageKey);
  const pathHint = getParentPagePath(roleId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Parent inbox"}
      subtitle={data?.hero.subtitle ?? "Database-backed parent messages"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? parentFallbackNav}
      activePath="/parent/inbox"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <Card title={data.sections.messagesTitle} subtitle={data.sections.messagesSubtitle} style={{ gridColumn: "span 12" }}>
          <ul className="list-clean">
            {data.messages.map((notification) => (
              <li
                key={notification.id}
                className="nm-surface-soft"
                style={{
                  borderRadius: "var(--radius-sm)",
                  padding: 14,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "start",
                  gap: 12,
                }}
              >
                <div>
                  <div className="chip-row" style={{ marginBottom: 8 }}>
                    <Badge tone={getNotificationTone(notification.type)}>{notification.type}</Badge>
                    <Badge tone={notification.read ? "neutral" : "primary"}>{notification.statusLabel}</Badge>
                  </div>
                  <strong style={{ fontSize: "var(--font-size-md)" }}>{notification.title}</strong>
                  <p className="section-copy" style={{ marginTop: 6 }}>
                    {notification.message}
                  </p>
                </div>
                <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                  <span className="muted" style={{ fontSize: "var(--font-size-xs)" }}>
                    {notification.timestamp}
                  </span>
                  <Button variant="secondary" size="sm">
                    {notification.openLabel}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </RoleShell>
  );
}
