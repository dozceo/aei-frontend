"use client";

import { Badge, Button, Card, Progress } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useStudentPageContent } from "@/hooks/useStudentPageContent";
import { getStudentPagePath, studentFallbackNav, type StudentDashboardDoc } from "@/lib/student-content";

const pageKey = "dashboard" as const;

export default function StudentDashboardPage() {
  const { data, loading, error, studentId } = useStudentPageContent<StudentDashboardDoc>(pageKey);
  const pathHint = getStudentPagePath(studentId, pageKey);

  const shellTitle = data?.hero.title ?? "Student dashboard";
  const shellSubtitle = data?.hero.subtitle ?? "Database-backed student overview";

  return (
    <RoleShell
      title={shellTitle}
      subtitle={shellSubtitle}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? studentFallbackNav}
      activePath="/student/dashboard"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.mission.title} subtitle={data.mission.subtitle} style={{ gridColumn: "span 8" }}>
            <div className="chip-row" style={{ marginBottom: 12 }}>
              {data.mission.badges.map((badge) => (
                <Badge key={badge} tone="primary">
                  {badge}
                </Badge>
              ))}
            </div>
            <p className="section-copy" style={{ marginBottom: 16 }}>
              {data.mission.description}
            </p>
            <Progress
              label={data.mission.progress.label}
              value={data.mission.progress.value}
              hint={data.mission.progress.hint}
              tone="primary"
            />
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button variant="primary">{data.mission.actions.primary}</Button>
              <Button variant="secondary">{data.mission.actions.secondary}</Button>
            </div>
          </Card>

          <Card title={data.sections.signalsTitle} subtitle={data.sections.signalsSubtitle} style={{ gridColumn: "span 4" }}>
            <ul className="list-clean">
              {data.signals.map((signal) => (
                <li key={signal.title} className="nm-surface-soft" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  <strong>{signal.title}</strong>
                  <p className="section-copy" style={{ marginTop: 4 }}>
                    {signal.value}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={data.sections.masteryTitle} subtitle={data.sections.masterySubtitle} style={{ gridColumn: "span 6" }}>
            <div style={{ display: "grid", gap: 12 }}>
              {data.subjectMastery.map((metric) => (
                <Progress
                  key={metric.subject}
                  label={metric.subject}
                  value={metric.mastery}
                  tone={metric.mastery >= 80 ? "success" : metric.mastery <= 60 ? "warning" : "primary"}
                />
              ))}
            </div>
          </Card>

          <Card title={data.nextSteps.title} subtitle={data.nextSteps.subtitle} style={{ gridColumn: "span 6" }}>
            <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {data.nextSteps.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <Button variant="secondary">{data.nextSteps.actions.primary}</Button>
              <Button variant="ghost">{data.nextSteps.actions.secondary}</Button>
            </div>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
