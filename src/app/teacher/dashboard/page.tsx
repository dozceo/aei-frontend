"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Badge, Button, Card, StatCard } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { routeGroups } from "@/app/routes";

const navIcon: Record<string, string> = {
  "/teacher/dashboard": "◆",
  "/teacher/students": "❏",
  "/teacher/heatmap": "▦",
  "/teacher/attendance": "✓",
  "/teacher/interventions": "✦",
};

const teacherNav = routeGroups.teacher.map((r) => ({ label: r.label, href: r.path, icon: navIcon[r.path] }));

function cell(span: number, i: number): CSSProperties {
  return { gridColumn: `span ${span}`, ["--i" as string]: i } as CSSProperties;
}

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
      actionLabel="Open heatmap →"
      actionHref="/teacher/heatmap"
      accent="honey"
    >
      <div style={cell(3, 0)}>
        <StatCard label="Active school" value={school} accent="aub" icon="⌂" />
      </div>
      <div style={cell(3, 1)}>
        <StatCard label="Role" value={identity?.role ?? "teacher"} accent="sky" icon="✶" />
      </div>
      <div style={cell(3, 2)}>
        <StatCard label="Divisions" value={identity?.schoolIds?.length ?? 1} accent="sage" icon="▤" hint="In your scope" />
      </div>
      <div style={cell(3, 3)}>
        <StatCard label="Mode" value="Live" accent="coral" icon="●" hint="zero2dev" />
      </div>

      {workflows.map((w, idx) => (
        <Card key={w.href} title={w.title} accent={w.accent} interactive style={cell(6, 4 + idx)}>
          <p className="section-copy" style={{ marginBottom: 16 }}>{w.copy}</p>
          <Link href={w.href}>
            <Button variant="secondary" leftIcon={<span aria-hidden="true">{w.icon}</span>}>
              Open {w.title.toLowerCase()}
            </Button>
          </Link>
        </Card>
      ))}

      <Card title="Today" subtitle="Suggested teaching focus" style={cell(12, 8)}>
        <div className="chip-row">
          <Badge tone="honey" dot>Review fractions — Div A</Badge>
          <Badge tone="coral" dot>3 students flagged</Badge>
          <Badge tone="sage" dot>Attendance pending</Badge>
        </div>
      </Card>
    </RoleShell>
  );
}
