"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { TeacherStudentsPortal } from "@/components/portals/teacher/TeacherPortalPanels";
import { teacherNav } from "@/lib/role-nav";

export default function TeacherStudentsPage() {
  return (
    <RoleShell title="Students" subtitle="Live roster with ML risk signals" eyebrow="Teacher" navItems={teacherNav} activePath="/teacher/students" accent="sky">
      <TeacherStudentsPortal />
    </RoleShell>
  );
}
