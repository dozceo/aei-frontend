"use client";

import Link from "next/link";
import { Badge, Button, Card, Progress, StatCard } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParticipant } from "@/hooks/useParticipant";
import { studentNav } from "@/lib/role-nav";

export default function StudentDashboardPage() {
  const { participant, loading, error, bookingId, schoolId } = useParticipant();
  const level = participant?.level ?? 1;
  const percentile = participant?.percentile;
  const division = participant?.divisionId ?? participant?.classId ?? "—";
  const mastery = typeof percentile === "number" ? percentile : 0;

  return (
    <RoleShell
      title={participant?.name ?? "Welcome back"}
      subtitle={`School ${schoolId ?? "—"} · Booking ${bookingId || "—"}`}
      eyebrow="Student studio"
      navItems={studentNav}
      activePath="/student/dashboard"
      actionLabel="Start loop"
      actionHref="/student/loop"
      accent="sky"
    >
      {!participant ? (
        <GridCell span={12} index={0}>
          <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
        </GridCell>
      ) : (
        <>
          <GridCell span={3} index={0}><StatCard label="Percentile" value={typeof percentile === "number" ? percentile : "—"} accent="sky" icon="▲" hint="Class standing" /></GridCell>
          <GridCell span={3} index={1}><StatCard label="Level" value={level} accent="honey" icon="✦" hint="Progress tier" /></GridCell>
          <GridCell span={3} index={2}><StatCard label="Division" value={division} accent="sage" icon="▤" hint="Cohort" /></GridCell>
          <GridCell span={3} index={3}><StatCard label="Streak" value={participant?.streak ?? 0} accent="coral" icon="↻" hint="Days active" /></GridCell>
          <GridCell span={7} index={4}>
            <Card title="Your daily path" subtitle="One primary flow keeps momentum" accent="sky">
              <p className="section-copy" style={{ marginBottom: 18 }}>Run the Sankalp Loop for spaced repetition, brain-map updates, and fresh ML insights.</p>
              <div style={{ marginBottom: 18 }}><Progress label="Mastery this week" value={mastery} tone="sky" /></div>
              <div className="chip-row">
                <Link href="/student/loop"><Button variant="primary">Open Sankalp Loop</Button></Link>
                <Link href="/student/mind"><Button variant="secondary">Brain map</Button></Link>
              </div>
            </Card>
          </GridCell>
          <GridCell span={5} index={5}>
            <Card title="Live signals" subtitle="From your participant record">
              <ul className="list-clean">
                {[{ k: "Percentile", v: percentile ?? "—" }, { k: "Division", v: division }, { k: "Level", v: level }].map((row) => (
                  <li key={row.k} className="nm-inset" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }}>
                    <span className="muted">{row.k}</span>
                    <strong className="nums">{row.v}</strong>
                  </li>
                ))}
              </ul>
            </Card>
          </GridCell>
          <GridCell span={12} index={6}>
            <Card title="Quick actions">
              <div className="chip-row">
                <Link href="/student/queries"><Button variant="secondary">Ask AI</Button></Link>
                <Link href="/student/ai-companion"><Button variant="secondary">AI companion</Button></Link>
                <Badge tone="sky" dot>Firestore zero2dev</Badge>
              </div>
            </Card>
          </GridCell>
        </>
      )}
    </RoleShell>
  );
}
