"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { routeGroups } from "@/app/routes";

const adminNav = [
  { label: "Overview", href: "/admin" },
  { label: "Attendance", href: "/admin/attendance" },
  { label: "Early Warning", href: "/admin/ews" },
  { label: "Roster", href: "/admin/roster" },
  { label: "Exams", href: "/admin/exams" },
];

export default function AdminHomePage() {
  const { identity, activeSchoolId, setActiveSchoolId } = useSchool();

  return (
    <RoleShell
      title="Admin console"
      subtitle="Daily school operations — Sankalp AEI"
      eyebrow="Platform Admin"
      navItems={adminNav}
      activePath="/admin"
      brandLabel="SANKALP AEI"
    >
      <Card title="School context" subtitle="Multi-school scope" style={{ gridColumn: "span 12" }}>
        <p className="section-copy" style={{ marginBottom: 12 }}>
          Signed in as {identity?.role ?? "admin"}. Active school: <strong>{activeSchoolId ?? "All schools"}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setActiveSchoolId("zero2dev")}>Zero2Dev</Button>
          <Button variant="secondary" onClick={() => setActiveSchoolId("sunrise")}>Sunrise</Button>
          <Button variant="ghost" onClick={() => setActiveSchoolId(null)}>All schools</Button>
        </div>
      </Card>

      <Card title="Daily tasks" subtitle="02dev critique §2.3 workflow" style={{ gridColumn: "span 6" }}>
        <ul className="list-clean" style={{ display: "grid", gap: 10 }}>
          {adminNav.slice(1).map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="min-h-[44px] inline-flex items-center text-blue-600 font-semibold">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Role routes" subtitle="Next.js deep links" style={{ gridColumn: "span 6" }}>
        <div className="flex flex-wrap gap-2">
          {routeGroups.student.slice(0, 4).map((r) => (
            <Badge key={r.path} tone="neutral">{r.label}</Badge>
          ))}
        </div>
      </Card>
    </RoleShell>
  );
}
