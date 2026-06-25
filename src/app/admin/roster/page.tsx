"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/design-system";

const adminNav = [
  { label: "Overview", href: "/admin" },
  { label: "Attendance", href: "/admin/attendance" },
  { label: "Early Warning", href: "/admin/ews" },
  { label: "Roster", href: "/admin/roster" },
  { label: "Exams", href: "/admin/exams" },
];

export default function AdminRosterPage() {
  return (
    <RoleShell title="Student roster" subtitle="Participant list" navItems={adminNav} activePath="/admin/roster" brandLabel="SANKALP AEI">
      <Card title="Participants" subtitle="Reads participants collection from zero2dev" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Full ParticipantList port — paginated school-scoped queries via academic/participants-query.js.</p>
      </Card>
    </RoleShell>
  );
}
