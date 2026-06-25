"use client";

import Link from "next/link";
import { Button, Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { routeGroups } from "@/app/routes";

const parentNav = routeGroups.parent.map((r) => ({ label: r.label, href: r.path }));

export default function ParentDashboardPage() {
  const { identity } = useSchool();
  const children = identity?.childBookingIds ?? [];

  return (
    <RoleShell
      title="Parent dashboard"
      subtitle={`${children.length} linked student(s)`}
      eyebrow="Parent"
      navItems={parentNav}
      activePath="/parent/dashboard"
      brandLabel="SANKALP AEI"
    >
      <Card title="Your children" subtitle="From custom claims / participants" style={{ gridColumn: "span 12" }}>
        {children.length === 0 ? (
          <p className="section-copy">No child bookings linked. Sign in with a parent email listed on a participant record.</p>
        ) : (
          <ul className="list-clean grid gap-2">
            {children.map((bid) => (
              <li key={bid} className="nm-surface-soft p-3 rounded-lg flex justify-between items-center min-h-[44px]">
                <span>{bid}</span>
                <Link href="/parent/inbox"><Button variant="secondary" size="sm">Inbox</Button></Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Academic summary" subtitle="AcademicPortalSummary port" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Reads published report cards and attendance summaries from participant docs in zero2dev.</p>
      </Card>
    </RoleShell>
  );
}
