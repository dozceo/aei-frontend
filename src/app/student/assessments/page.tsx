"use client";

import { Badge, Button, Card, Progress } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useStudentPageContent } from "@/hooks/useStudentPageContent";
import { getStudentPagePath, studentFallbackNav, type StudentAssessmentsDoc } from "@/lib/student-content";

const pageKey = "assessments" as const;

export default function StudentAssessmentsPage() {
  const { data, loading, error, studentId } = useStudentPageContent<StudentAssessmentsDoc>(pageKey);
  const pathHint = getStudentPagePath(studentId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Student assessments"}
      subtitle={data?.hero.subtitle ?? "Database-backed assessment state"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? studentFallbackNav}
      activePath="/student/assessments"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.activeAssessment.title} subtitle={data.activeAssessment.progressLabel} style={{ gridColumn: "span 8" }}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>{data.activeAssessment.questionLabel}</p>
            <h2 style={{ margin: "0 0 16px", fontSize: "var(--font-size-xl)", lineHeight: "var(--line-height-tight)" }}>
              {data.activeAssessment.questionText}
            </h2>
            <ul className="list-clean" style={{ marginBottom: 16 }}>
              {data.activeAssessment.options.map((option) => (
                <li
                  key={option.id}
                  className={option.selected ? "nm-surface" : "nm-surface-soft"}
                  style={{
                    padding: 12,
                    borderRadius: "var(--radius-full)",
                    border: option.selected ? "1px solid rgba(111, 60, 244, 0.35)" : "1px solid var(--color-border)",
                  }}
                >
                  <strong style={{ marginRight: 8 }}>{option.id}</strong>
                  {option.text}
                </li>
              ))}
            </ul>
            <Progress label={data.activeAssessment.confidenceLabel} value={data.activeAssessment.confidenceValue} />
            <div style={{ marginTop: 14 }}>
              <Button variant="primary">{data.activeAssessment.submitLabel}</Button>
            </div>
          </Card>

          <Card title={data.sections.upcomingTitle} subtitle={data.sections.upcomingSubtitle} style={{ gridColumn: "span 4" }}>
            <ul className="list-clean">
              {data.upcoming.map((item) => (
                <li key={`${item.title}-${item.schedule}`} className="nm-surface-soft" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  <strong>{item.title}</strong>
                  <p className="section-copy" style={{ margin: "4px 0" }}>{item.schedule}</p>
                  <Badge tone="primary">{item.type}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={data.sections.historyTitle} subtitle={data.sections.historySubtitle} style={{ gridColumn: "span 12" }}>
            <ul className="list-clean" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {data.history.map((result) => (
                <li key={`${result.title}-${result.scoreLabel}`} className="nm-surface-soft" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  <strong>{result.title}</strong>
                  <p style={{ margin: "6px 0", fontWeight: 700 }}>{result.scoreLabel}</p>
                  <Badge tone="neutral">{result.statusLabel}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
