"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParticipant } from "@/hooks/useParticipant";
import { routeGroups } from "@/app/routes";

const studentNav = routeGroups.student.map((r) => ({ label: r.label, href: r.path }));

export default function StudentLoopPage() {
  const { participant, loading, error, bookingId } = useParticipant();

  return (
    <RoleShell
      title="Sankalp Loop"
      subtitle="7-step daily study path"
      eyebrow="Student"
      navItems={studentNav}
      activePath="/student/loop"
      brandLabel="SANKALP AEI"
    >
      {!participant ? (
        <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
      ) : (
        <>
          <Card title="Today's loop" subtitle="Primary daily path" style={{ gridColumn: "span 8" }}>
            <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 8 }}>
              {["Energy check-in", "Plan quiz", "Recall session", "Brain dump", "Resource study", "Loop attendance", "Reflection"].map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/student/mind"><Button variant="primary">Open Student Mind</Button></Link>
              <Link href="/student/assessments"><Button variant="secondary">Start recall</Button></Link>
            </div>
          </Card>
          <Card title="Progress" subtitle={participant.name ?? bookingId} style={{ gridColumn: "span 4" }}>
            <Badge tone="success">Level {participant.level ?? 1}</Badge>
            <p className="section-copy mt-2">XP: {participant.xp ?? 0}</p>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
