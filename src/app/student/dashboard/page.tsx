"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParticipant } from "@/hooks/useParticipant";
import { routeGroups } from "@/app/routes";

const studentNav = routeGroups.student.map((r) => ({ label: r.label, href: r.path }));

export default function StudentDashboardPage() {
  const { participant, loading, error, bookingId, schoolId } = useParticipant();

  return (
    <RoleShell
      title={participant?.name ?? "Student dashboard"}
      subtitle={`School: ${schoolId ?? "—"} · Booking ${bookingId || "—"}`}
      eyebrow="zero2dev"
      navItems={studentNav}
      activePath="/student/dashboard"
      actionLabel="Start loop"
      actionHref="/student/loop"
      brandLabel="SANKALP AEI"
    >
      {!participant ? (
        <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
      ) : (
        <>
          <Card title="Daily path" subtitle="One primary flow" style={{ gridColumn: "span 6" }}>
            <p className="section-copy" style={{ marginBottom: 16 }}>
              Complete the Sankalp Loop for spaced repetition, brain map updates, and ML insights.
            </p>
            <Link href="/student/loop"><Button variant="primary">Open Sankalp Loop</Button></Link>
          </Card>
          <Card title="Signals" subtitle="Live participant doc" style={{ gridColumn: "span 6" }}>
            <ul className="list-clean" style={{ display: "grid", gap: 8 }}>
              <li><strong>Percentile</strong> {participant.percentile ?? "—"}</li>
              <li><strong>Division</strong> {participant.divisionId ?? participant.classId ?? "—"}</li>
              <li><strong>Level</strong> {participant.level ?? 1}</li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/student/mind"><Button variant="secondary">Mind</Button></Link>
              <Link href="/student/insights"><Button variant="ghost">Insights</Button></Link>
            </div>
          </Card>
          <Card title="Quick actions" style={{ gridColumn: "span 12" }}>
            <div className="flex flex-wrap gap-2">
              <Link href="/student/queries"><Button variant="secondary">Ask AI</Button></Link>
              <Link href="/student/ai-companion"><Button variant="secondary">Companion</Button></Link>
              <Badge tone="primary">Firestore: zero2dev</Badge>
            </div>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
