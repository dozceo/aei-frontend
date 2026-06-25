"use client";

import { Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { routeGroups } from "@/app/routes";

const teacherNav = routeGroups.teacher.map((r) => ({ label: r.label, href: r.path }));

export default function TeacherAttendancePage() {
  return (
    <RoleShell title="Attendance" subtitle="Class register" navItems={teacherNav} activePath="/teacher/attendance" brandLabel="SANKALP AEI">
      <Card title="Attendance tab" subtitle="SchoolAttendance teacher mode" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Submit-only attendance via Express /api/academic/attendance/submit.</p>
      </Card>
    </RoleShell>
  );
}
