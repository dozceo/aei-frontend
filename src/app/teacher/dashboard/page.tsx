"use client";

import Link from "next/link";
import { Badge, Button, Card, StatCard } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { teacherNav } from "@/lib/role-nav";

const workflows = [
  { href: "/teacher/students", title: "Students", copy: "Roster, risk tiers, and ML predictions per learner.", accent: "sky" as const, icon: "❏" },
  { href: "/teacher/heatmap", title: "Chapter heatmap", copy: "Mastery gaps across the syllabus at a glance.", accent: "honey" as const, icon: "▦" },
  { href: "/teacher/attendance", title: "Attendance", copy: "Mark and review division attendance daily.", accent: "sage" as const, icon: "✓" },
  { href: "/teacher/interventions", title: "Interventions", copy: "Targeted nudges for at-risk students.", accent: "coral" as const, icon: "✦" },
];

export default function TeacherDashboardPage() {
  const { identity, activeSchoolId } = useSchool();
  const school = activeSchoolId ?? identity?.primarySchoolId ?? "—";

  return (
    <RoleShell
      title="Teacher dashboard"
      subtitle={`Class intelligence for school ${school}`}
      eyebrow="Teacher cockpit"
      navItems={teacherNav}
      activePath="/teacher/dashboard"
      actionLabel="Open heatmap"
      actionHref="/teacher/heatmap"
      accent="honey"
    >
      <GridCell span={3} index={0}><StatCard label="Active school" value={school} accent="aub" icon="⌂" /></GridCell>
      <GridCell span={3} index={1}><StatCard label="Role" value={identity?.role ?? "teacher"} accent="sky" icon="✶" /></GridCell>
      <GridCell span={3} index={2}><StatCard label="Divisions" value={identity?.schoolIds?.length ?? 1} accent="sage" icon="▤" /></GridCell>
      <GridCell span={3} index={3}><StatCard label="Mode" value="Live" accent="coral" icon="●" hint="zero2dev" /></GridCell>
      {workflows.map((w, idx) => (
        <GridCell key={w.href} span={6} index={4 + idx}>
          <Card title={w.title} accent={w.accent} interactive>
            <p className="section-copy" style={{ marginBottom: 16 }}>{w.copy}</p>
            <Link href={w.href}><Button variant="secondary" leftIcon={<span aria-hidden="true">{w.icon}</span>}>Open {w.title.toLowerCase()}</Button></Link>
          </Card>
        </GridCell>
      ))}
      <GridCell span={12} index={8}>
        <Card title="Today" subtitle="Suggested teaching focus">
          <div className="chip-row">
            <Badge tone="honey" dot>Review fractions — Div A</Badge>
            <Badge tone="coral" dot>3 students flagged</Badge>
            <Badge tone="sage" dot>Attendance pending</Badge>
          </div>
        </Card>
      </GridCell>
    </RoleShell>
  );
}
