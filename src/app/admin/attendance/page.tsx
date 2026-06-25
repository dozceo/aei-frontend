"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { AdminAttendancePortal } from "@/components/portals/admin/AdminPortalPanels";
import { adminNav } from "@/lib/role-nav";

export default function AdminAttendancePage() {
  return (
    <RoleShell title="Attendance" subtitle="Daily division register" eyebrow="Admin" navItems={adminNav} activePath="/admin/attendance" accent="sky">
      <AdminAttendancePortal />
    </RoleShell>
  );
}
