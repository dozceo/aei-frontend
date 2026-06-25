"use client";

import Link from "next/link";
import { Badge, Button, Card, StatCard } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { parentNav } from "@/lib/role-nav";

export default function ParentDashboardPage() {
  const { identity } = useSchool();
  const children = identity?.childBookingIds ?? [];

  return (
    <RoleShell title="Parent dashboard" subtitle={`${children.length} linked student${children.length === 1 ? "" : "s"}`} eyebrow="Family portal" navItems={parentNav} activePath="/parent/dashboard" actionLabel="Open inbox" actionHref="/parent/inbox" accent="sage">
      <GridCell span={4} index={0}><StatCard label="Linked students" value={children.length} accent="sage" icon="❏" /></GridCell>
      <GridCell span={4} index={1}><StatCard label="School" value={identity?.primarySchoolId ?? "—"} accent="sky" icon="⌂" /></GridCell>
      <GridCell span={4} index={2}><StatCard label="Role" value={identity?.role ?? "parent"} accent="aub" icon="✶" /></GridCell>
      <GridCell span={7} index={3}>
        <Card title="Your children" subtitle="Linked from participant records" accent="sage">
          {children.length === 0 ? (
            <p className="section-copy">No child bookings linked. Sign in with a parent email listed on a participant record.</p>
          ) : (
            <ul className="list-clean">
              {children.map((bid) => (
                <li key={bid} className="nm-inset" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "var(--radius-md)", minHeight: 48 }}>
                  <strong className="nums">{bid}</strong>
                  <Link href="/parent/inbox"><Button variant="secondary" size="sm">Inbox</Button></Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </GridCell>
      <GridCell span={5} index={4}>
        <Card title="Academic summary" subtitle="Report cards & attendance" accent="sky">
          <p className="section-copy" style={{ marginBottom: 16 }}>Published report cards and attendance summaries from participant docs in zero2dev.</p>
          <div className="chip-row">
            <Badge tone="sky" dot>Reports</Badge>
            <Badge tone="sage" dot>Attendance</Badge>
            <Badge tone="honey" dot>Progress</Badge>
          </div>
        </Card>
      </GridCell>
    </RoleShell>
  );
}
