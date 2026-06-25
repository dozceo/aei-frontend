"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { TeacherHeatmapPortal } from "@/components/portals/teacher/TeacherPortalPanels";
import { teacherNav } from "@/lib/role-nav";

export default function TeacherHeatmapPage() {
  return (
    <RoleShell title="Chapter heatmap" subtitle="Topic mastery from published cohort" eyebrow="Teacher" navItems={teacherNav} activePath="/teacher/heatmap" accent="honey">
      <TeacherHeatmapPortal />
    </RoleShell>
  );
}
