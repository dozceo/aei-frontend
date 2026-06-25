"use client";

import Link from "next/link";
import { Button, Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { routeGroups } from "@/app/routes";

const teacherNav = routeGroups.teacher.map((r) => ({ label: r.label, href: r.path }));

export default function TeacherDashboardPage() {
  const { identity, activeSchoolId } = useSchool();

  return (
    <RoleShell
      title="Teacher dashboard"
      subtitle={`School ${activeSchoolId ?? identity?.primarySchoolId ?? "—"}`}
      eyebrow="Teacher"
      navItems={teacherNav}
      activePath="/teacher/dashboard"
      brandLabel="SANKALP AEI"
    >
      <Card title="Class intelligence" subtitle="Split from TeacherDashboard.jsx" style={{ gridColumn: "span 12" }}>
        <div className="flex flex-wrap gap-2">
          <Link href="/teacher/students"><Button variant="primary">Students</Button></Link>
          <Link href="/teacher/heatmap"><Button variant="secondary">Chapter heatmap</Button></Link>
          <Link href="/teacher/attendance"><Button variant="secondary">Attendance</Button></Link>
          <Link href="/teacher/interventions"><Button variant="ghost">Interventions</Button></Link>
        </div>
      </Card>
    </RoleShell>
  );
}
