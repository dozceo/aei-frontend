"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { AdminAttendancePortal } from "@/components/portals/admin/AdminPortalPanels";
import { teacherNav } from "@/lib/role-nav";

export default function TeacherAttendancePage() {
  return (
    <RoleShell title="Attendance" subtitle="Mark division register" eyebrow="Teacher" navItems={teacherNav} activePath="/teacher/attendance" accent="sage">
      <AdminAttendancePortal />
    </RoleShell>
  );
}
