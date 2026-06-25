"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Badge, Button, Card, StatCard } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";

const adminNav = [
  { label: "Overview", href: "/admin", icon: "◆" },
  { label: "Attendance", href: "/admin/attendance", icon: "✓" },
  { label: "Early Warning", href: "/admin/ews", icon: "▲" },
  { label: "Roster", href: "/admin/roster", icon: "❏" },
  { label: "Exams", href: "/admin/exams", icon: "✎" },
];

function cell(span: number, i: number): CSSProperties {
  return { gridColumn: `span ${span}`, ["--i" as string]: i } as CSSProperties;
}

const tasks = [
  { href: "/admin/attendance", title: "Attendance", copy: "Daily division attendance across the school.", accent: "sky" as const, icon: "✓" },
  { href: "/admin/ews", title: "Early Warning", copy: "Cohort risk tiers from the EWS engine.", accent: "coral" as const, icon: "▲" },
  { href: "/admin/roster", title: "Roster", copy: "Manage participants, divisions, and links.", accent: "sage" as const, icon: "❏" },
  { href: "/admin/exams", title: "Exams", copy: "Marks entry and report-card publishing.", accent: "honey" as const, icon: "✎" },
];

export default function AdminHomePage() {
  const { identity, activeSchoolId, setActiveSchoolId } = useSchool();

  return (
    <RoleShell
      title="Admin console"
      subtitle="Daily school operations"
      eyebrow="Platform admin"
      navItems={adminNav}
      activePath="/admin"
      accent="aub"
    >
      <Card title="School context" subtitle="Multi-school scope" accent="aub" style={cell(12, 0)}>
        <p className="section-copy" style={{ marginBottom: 14 }}>
          Signed in as <strong>{identity?.role ?? "admin"}</strong>. Active school:{" "}
          <strong>{activeSchoolId ?? "All schools"}</strong>
        </p>
        <div className="chip-row">
          <Button variant={activeSchoolId === "zero2dev" ? "primary" : "secondary"} size="sm" onClick={() => setActiveSchoolId("zero2dev")}>
            Zero2Dev
          </Button>
          <Button variant={activeSchoolId === "sunrise" ? "primary" : "secondary"} size="sm" onClick={() => setActiveSchoolId("sunrise")}>
            Sunrise
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setActiveSchoolId(null)}>All schools</Button>
        </div>
      </Card>

      <div style={cell(3, 1)}>
        <StatCard label="Active school" value={activeSchoolId ?? "All"} accent="aub" icon="⌂" />
      </div>
      <div style={cell(3, 2)}>
        <StatCard label="Schools" value={identity?.schoolIds?.length ?? 0} accent="sky" icon="▤" />
      </div>
      <div style={cell(3, 3)}>
        <StatCard label="Super admin" value={identity?.isSuper ? "Yes" : "No"} accent="sage" icon="✔" />
      </div>
      <div style={cell(3, 4)}>
        <StatCard label="Database" value="zero2dev" accent="coral" icon="●" />
      </div>

      {tasks.map((t, idx) => (
        <Card key={t.href} title={t.title} accent={t.accent} interactive style={cell(6, 5 + idx)}>
          <p className="section-copy" style={{ marginBottom: 16 }}>{t.copy}</p>
          <Link href={t.href}>
            <Button variant="secondary" leftIcon={<span aria-hidden="true">{t.icon}</span>}>Open {t.title.toLowerCase()}</Button>
          </Link>
        </Card>
      ))}

      <Card title="System" subtitle="Live status" style={cell(12, 9)}>
        <div className="chip-row">
          <Badge tone="sage" dot>Firestore connected</Badge>
          <Badge tone="sky" dot>ML service live</Badge>
          <Badge tone="honey" dot>Gateway v2.0.0</Badge>
        </div>
      </Card>
    </RoleShell>
  );
}
