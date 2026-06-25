"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Badge, Button, Card, StatCard } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { routeGroups } from "@/app/routes";

const navIcon: Record<string, string> = {
  "/parent/dashboard": "◆",
  "/parent/inbox": "✉",
};

const parentNav = routeGroups.parent.map((r) => ({ label: r.label, href: r.path, icon: navIcon[r.path] }));

function cell(span: number, i: number): CSSProperties {
  return { gridColumn: `span ${span}`, ["--i" as string]: i } as CSSProperties;
}

export default function ParentDashboardPage() {
  const { identity } = useSchool();
  const children = identity?.childBookingIds ?? [];

  return (
    <RoleShell
      title="Parent dashboard"
      subtitle={`${children.length} linked student${children.length === 1 ? "" : "s"}`}
      eyebrow="Family portal"
      navItems={parentNav}
      activePath="/parent/dashboard"
      actionLabel="Open inbox →"
      actionHref="/parent/inbox"
      accent="sage"
    >
      <div style={cell(4, 0)}>
        <StatCard label="Linked students" value={children.length} accent="sage" icon="❏" />
      </div>
      <div style={cell(4, 1)}>
        <StatCard label="School" value={identity?.primarySchoolId ?? "—"} accent="sky" icon="⌂" />
      </div>
      <div style={cell(4, 2)}>
        <StatCard label="Role" value={identity?.role ?? "parent"} accent="aub" icon="✶" />
      </div>

      <Card title="Your children" subtitle="Linked from participant records" accent="sage" style={cell(7, 3)}>
        {children.length === 0 ? (
          <div style={{ display: "grid", gap: 12, placeItems: "center", padding: "24px 0" }}>
            <span className="animate-float" aria-hidden="true" style={{ fontSize: 40 }}>❏</span>
            <p className="section-copy" style={{ textAlign: "center" }}>
              No child bookings linked yet. Sign in with a parent email listed on a participant record.
            </p>
          </div>
        ) : (
          <ul className="list-clean">
            {children.map((bid, i) => (
              <li
                key={bid}
                className="nm-inset"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "var(--radius-md)", minHeight: 48, ["--i" as string]: i } as CSSProperties}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", width: 30, height: 30, borderRadius: "var(--radius-sm)", background: "var(--sage)", color: "var(--sage-deep)", fontWeight: 700 }}>
                    {bid.slice(0, 1).toUpperCase()}
                  </span>
                  <strong className="nums">{bid}</strong>
                </span>
                <Link href="/parent/inbox"><Button variant="secondary" size="sm">Inbox</Button></Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Academic summary" subtitle="Report cards & attendance" accent="sky" style={cell(5, 4)}>
        <p className="section-copy" style={{ marginBottom: 16 }}>
          Published report cards and attendance summaries appear here, read live from the participant documents in
          zero2dev.
        </p>
        <div className="chip-row">
          <Badge tone="sky" dot>Reports</Badge>
          <Badge tone="sage" dot>Attendance</Badge>
          <Badge tone="honey" dot>Progress</Badge>
        </div>
      </Card>
    </RoleShell>
  );
}
