"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Badge, Button, Card, Progress, StatCard } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParticipant } from "@/hooks/useParticipant";
import { routeGroups } from "@/app/routes";

const navIcon: Record<string, string> = {
  "/student/dashboard": "◆",
  "/student/loop": "↻",
  "/student/mind": "✦",
  "/student/queries": "?",
  "/student/insights": "▲",
  "/student/curriculum": "▤",
  "/student/assessments": "✎",
  "/student/ai-companion": "✺",
};

const studentNav = routeGroups.student.map((r) => ({ label: r.label, href: r.path, icon: navIcon[r.path] }));

function cell(span: number, i: number): CSSProperties {
  return { gridColumn: `span ${span}`, ["--i" as string]: i } as CSSProperties;
}

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
      actionLabel="Start loop →"
      actionHref="/student/loop"
      accent="sky"
    >
      {!participant ? (
        <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
      ) : (
        <>
          <div style={cell(3, 0)}>
            <StatCard label="Percentile" value={typeof percentile === "number" ? percentile : "—"} accent="sky" icon="▲" hint="Class standing" />
          </div>
          <div style={cell(3, 1)}>
            <StatCard label="Level" value={level} accent="honey" icon="✦" hint="Progress tier" />
          </div>
          <div style={cell(3, 2)}>
            <StatCard label="Division" value={division} accent="sage" icon="▤" hint="Cohort" />
          </div>
          <div style={cell(3, 3)}>
            <StatCard label="Streak" value={participant?.streak ?? 0} accent="coral" icon="↻" hint="Days active" />
          </div>

          <Card
            title="Your daily path"
            subtitle="One primary flow keeps momentum"
            accent="sky"
            style={cell(7, 4)}
          >
            <p className="section-copy" style={{ marginBottom: 18 }}>
              Run the Sankalp Loop for spaced repetition, brain-map updates, and fresh ML insights. It only takes a few
              minutes and keeps your mastery curve climbing.
            </p>
            <div style={{ marginBottom: 18 }}>
              <Progress label="Mastery this week" value={mastery} tone="sky" />
            </div>
            <div className="chip-row">
              <Link href="/student/loop"><Button variant="primary">Open Sankalp Loop</Button></Link>
              <Link href="/student/mind"><Button variant="secondary">Brain map</Button></Link>
            </div>
          </Card>

          <Card title="Live signals" subtitle="From your participant record" style={cell(5, 5)}>
            <ul className="list-clean">
              {[
                { k: "Percentile", v: percentile ?? "—" },
                { k: "Division", v: division },
                { k: "Level", v: level },
              ].map((row) => (
                <li
                  key={row.k}
                  className="nm-inset"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }}
                >
                  <span className="muted" style={{ fontSize: "var(--font-size-sm)" }}>{row.k}</span>
                  <strong className="nums">{row.v}</strong>
                </li>
              ))}
            </ul>
            <div className="chip-row" style={{ marginTop: 16 }}>
              <Link href="/student/insights"><Button variant="ghost" size="sm">Insights</Button></Link>
              <Link href="/student/queries"><Button variant="ghost" size="sm">My queries</Button></Link>
            </div>
          </Card>

          <Card title="Quick actions" style={cell(12, 6)}>
            <div className="chip-row">
              <Link href="/student/queries"><Button variant="secondary">Ask AI</Button></Link>
              <Link href="/student/ai-companion"><Button variant="secondary">AI companion</Button></Link>
              <Link href="/student/curriculum"><Button variant="ghost">Curriculum</Button></Link>
              <Link href="/student/assessments"><Button variant="ghost">Assessments</Button></Link>
              <span style={{ marginLeft: "auto", alignSelf: "center" }}>
                <Badge tone="sky" dot>Firestore zero2dev</Badge>
              </span>
            </div>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
