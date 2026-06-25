"use client";

import { RoleShell } from "@/components/layout/RoleShell";
import { Card } from "@/components/design-system";
import { backendPost } from "@/lib/backend-client";
import { useSchool } from "@/components/providers/SchoolProvider";

const adminNav = [
  { label: "Overview", href: "/admin" },
  { label: "Attendance", href: "/admin/attendance" },
  { label: "Early Warning", href: "/admin/ews" },
  { label: "Roster", href: "/admin/roster" },
  { label: "Exams", href: "/admin/exams" },
];

export default function AdminEwsPage() {
  const { activeSchoolId } = useSchool();

  async function publishCohort() {
    await backendPost("/api/cohort/publish", {
      schoolId: activeSchoolId || "zero2dev",
      classId: "8A",
      subjectId: "math",
    });
    alert("Cohort publish queued (sessions keyed by subjectId).");
  }

  return (
    <RoleShell title="Early Warning" subtitle="Cohort risk publish" navItems={adminNav} activePath="/admin/ews" brandLabel="SANKALP AEI">
      <Card title="Publish teacher cohort" subtitle="Server-side EWS build" style={{ gridColumn: "span 12" }}>
        <p className="section-copy" style={{ marginBottom: 16 }}>
          Queues a cohort job writing <code>teacher_cohort/&#123;classId&#125;/sessions/&#123;subjectId&#125;</code>.
        </p>
        <button type="button" className="nm-btn nm-btn-primary min-h-[44px]" onClick={() => void publishCohort()}>
          Queue cohort publish
        </button>
      </Card>
    </RoleShell>
  );
}
