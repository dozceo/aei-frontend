"use client";

import { Badge, Button, Card, Progress } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useStudentPageContent } from "@/hooks/useStudentPageContent";
import { getStudentPagePath, studentFallbackNav, type StudentCurriculumDoc } from "@/lib/student-content";

const pageKey = "curriculum" as const;

export default function StudentCurriculumPage() {
  const { data, loading, error, studentId } = useStudentPageContent<StudentCurriculumDoc>(pageKey);
  const pathHint = getStudentPagePath(studentId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Student curriculum"}
      subtitle={data?.hero.subtitle ?? "Database-backed curriculum plan"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? studentFallbackNav}
      activePath="/student/curriculum"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.currentBlock.title} subtitle={data.currentBlock.subtitle} style={{ gridColumn: "span 8" }}>
            <Progress label={data.currentBlock.progressLabel} value={data.currentBlock.progressValue} />
          </Card>

          <Card title={data.sections.scheduleTitle} subtitle={data.sections.scheduleSubtitle} style={{ gridColumn: "span 4" }}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.schedule.map((item) => (
                <div key={`${item.dateLabel}-${item.topic}`} className="nm-surface-soft" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  <p className="muted" style={{ margin: 0 }}>{item.dateLabel}</p>
                  <strong>{item.topic}</strong>
                  <div className="chip-row" style={{ marginTop: 8 }}>
                    <Badge tone="primary">{item.statusLabel}</Badge>
                    <Badge tone={item.readiness >= 80 ? "success" : item.readiness <= 60 ? "warning" : "primary"}>
                      {item.readiness}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={data.sections.dependencyTitle} subtitle={data.sections.dependencySubtitle} style={{ gridColumn: "span 7" }}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.dependencyRisks.map((risk) => (
                <Progress key={risk.title} label={`${risk.title} · ${risk.riskLevel}`} value={risk.progress} />
              ))}
            </div>
          </Card>

          <Card title={data.oracleInsights.title} subtitle={data.oracleInsights.impactLabel} style={{ gridColumn: "span 5" }}>
            <p className="section-copy" style={{ marginBottom: 16 }}>{data.oracleInsights.summary}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="primary">{data.oracleInsights.primaryAction}</Button>
              <Button variant="secondary">{data.oracleInsights.secondaryAction}</Button>
            </div>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
