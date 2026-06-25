"use client";

import { Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { routeGroups } from "@/app/routes";

const teacherNav = routeGroups.teacher.map((r) => ({ label: r.label, href: r.path }));

export default function TeacherHeatmapPage() {
  return (
    <RoleShell title="Chapter heatmap" subtitle="EWS chapter cubes" navItems={teacherNav} activePath="/teacher/heatmap" brandLabel="SANKALP AEI">
      <Card title="Heatmap" subtitle="chapter-heatmap.js" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Visualizes teacher_cohort/&#123;classId&#125;/subjects/&#123;subjectId&#125; from zero2dev.</p>
      </Card>
    </RoleShell>
  );
}
