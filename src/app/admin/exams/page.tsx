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

export default function AdminExamsPage() {
  return (
    <RoleShell title="Exams & marks" subtitle="Publish workflow" navItems={adminNav} activePath="/admin/exams" brandLabel="SANKALP AEI">
      <Card title="Exam marks" subtitle="Express /api/academic/exams/publish" style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Port ExamMarks.jsx — create exams, enter marks, publish to participants.publishedExams.</p>
      </Card>
    </RoleShell>
  );
}
