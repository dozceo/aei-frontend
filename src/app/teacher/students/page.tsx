"use client";

import { Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { routeGroups } from "@/app/routes";

const teacherNav = routeGroups.teacher.map((r) => ({ label: r.label, href: r.path }));

export default function TeacherStudentsPage() {
  return (
    <RoleShell title="Students" subtitle="Cohort roster" navItems={teacherNav} activePath="/teacher/students" brandLabel="SANKALP AEI">
      <Card title="Roster" subtitle="teacher_cohort/{classId}" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Reads teacher_cohort sessions keyed by subjectId after cohort publish.</p>
      </Card>
    </RoleShell>
  );
}
