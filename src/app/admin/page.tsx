"use client";

import Link from "next/link";
import { Button, Card, StatCard } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { adminNav } from "@/lib/role-nav";

const tasks = [
  { href: "/admin/attendance", title: "Attendance", copy: "Daily division attendance across the school.", accent: "sky" as const, icon: "✓" },
  { href: "/admin/ews", title: "Early Warning", copy: "Cohort risk tiers from the EWS engine.", accent: "coral" as const, icon: "▲" },
  { href: "/admin/roster", title: "Roster", copy: "Manage participants, divisions, and links.", accent: "sage" as const, icon: "❏" },
  { href: "/admin/exams", title: "Exams", copy: "Marks entry and report-card publishing.", accent: "honey" as const, icon: "✎" },
];

export default function AdminHomePage() {
  const { identity, activeSchoolId, setActiveSchoolId } = useSchool();

  return (
    <RoleShell title="Admin console" subtitle="Daily school operations" eyebrow="Platform admin" navItems={adminNav} activePath="/admin" accent="aub">
      <GridCell span={12} index={0}>
        <Card title="School context" subtitle="Multi-school scope" accent="aub">
          <p className="section-copy" style={{ marginBottom: 14 }}>
            Signed in as <strong>{identity?.role ?? "admin"}</strong>. Active school: <strong>{activeSchoolId ?? "All schools"}</strong>
          </p>
          <div className="chip-row">
            <Button variant={activeSchoolId === "zero2dev" ? "primary" : "secondary"} size="sm" onClick={() => setActiveSchoolId("zero2dev")}>Zero2Dev</Button>
            <Button variant={activeSchoolId === "sunrise" ? "primary" : "secondary"} size="sm" onClick={() => setActiveSchoolId("sunrise")}>Sunrise</Button>
            <Button variant="ghost" size="sm" onClick={() => setActiveSchoolId(null)}>All schools</Button>
          </div>
        </Card>
      </GridCell>
      <GridCell span={3} index={1}><StatCard label="Active school" value={activeSchoolId ?? "All"} accent="aub" icon="⌂" /></GridCell>
      <GridCell span={3} index={2}><StatCard label="Schools" value={identity?.schoolIds?.length ?? 0} accent="sky" icon="▤" /></GridCell>
      <GridCell span={3} index={3}><StatCard label="Super admin" value={identity?.isSuper ? "Yes" : "No"} accent="sage" icon="✔" /></GridCell>
      <GridCell span={3} index={4}><StatCard label="Database" value="zero2dev" accent="coral" icon="●" /></GridCell>
      {tasks.map((t, idx) => (
        <GridCell key={t.href} span={6} index={5 + idx}>
          <Card title={t.title} accent={t.accent} interactive>
            <p className="section-copy" style={{ marginBottom: 16 }}>{t.copy}</p>
            <Link href={t.href}><Button variant="secondary" leftIcon={<span aria-hidden="true">{t.icon}</span>}>Open {t.title.toLowerCase()}</Button></Link>
          </Card>
        </GridCell>
      ))}
    </RoleShell>
  );
}
