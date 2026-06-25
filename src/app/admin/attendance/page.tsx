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

export default function AdminAttendancePage() {
  return (
    <RoleShell title="Attendance" subtitle="Official register" navItems={adminNav} activePath="/admin/attendance" brandLabel="SANKALP AEI">
      <Card title="School attendance" subtitle="Port of SchoolAttendance.jsx" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Use academic gateway via Express <code>/api/academic/attendance/*</code> for submit and lock flows.</p>
      </Card>
    </RoleShell>
  );
}
