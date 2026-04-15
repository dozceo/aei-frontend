"use client";

import { Badge, Card, Progress } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useStudentPageContent } from "@/hooks/useStudentPageContent";
import { getStudentPagePath, studentFallbackNav, type StudentInsightsDoc } from "@/lib/student-content";

const pageKey = "insights" as const;

export default function StudentInsightsPage() {
  const { data, loading, error, studentId } = useStudentPageContent<StudentInsightsDoc>(pageKey);
  const pathHint = getStudentPagePath(studentId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Student insights"}
      subtitle={data?.hero.subtitle ?? "Database-backed insight stream"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? studentFallbackNav}
      activePath="/student/insights"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.sections.highlightsTitle} subtitle={data.sections.highlightsSubtitle} style={{ gridColumn: "span 12" }}>
            <div className="card-grid-3" style={{ gridColumn: "span 12" }}>
              {data.highlights.map((highlight) => (
                <article key={highlight.label} className="nm-surface-soft" style={{ padding: 14, borderRadius: "var(--radius-sm)" }}>
                  <p className="muted" style={{ margin: 0 }}>{highlight.label}</p>
                  <p style={{ margin: "8px 0", fontSize: "28px", fontWeight: 800 }}>{highlight.value}</p>
                  <Badge tone="primary">{highlight.delta}</Badge>
                </article>
              ))}
            </div>
          </Card>

          <Card title={data.trajectory.title} subtitle={data.trajectory.subtitle} style={{ gridColumn: "span 7" }}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.trajectory.points.map((point) => (
                <div key={point.label} style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 10, alignItems: "center" }}>
                  <strong>{point.label}</strong>
                  <div className="nm-inset" style={{ height: 12, borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <span
                      style={{
                        display: "block",
                        width: `${point.value}%`,
                        height: "100%",
                        background: "linear-gradient(110deg, var(--color-primary), var(--color-primary-soft))",
                      }}
                    />
                  </div>
                  <span className="muted" style={{ fontSize: "var(--font-size-xs)" }}>{point.value}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title={data.sections.breakdownTitle} subtitle={data.sections.breakdownSubtitle} style={{ gridColumn: "span 5" }}>
            <div style={{ display: "grid", gap: 10 }}>
              {data.subjectBreakdown.map((subject) => (
                <Progress
                  key={subject.subject}
                  label={subject.subject}
                  value={subject.mastery}
                  tone={subject.mastery >= 80 ? "success" : subject.mastery <= 60 ? "warning" : "primary"}
                />
              ))}
            </div>
          </Card>

          <Card title={data.sections.narrativesTitle} subtitle={data.sections.narrativesSubtitle} style={{ gridColumn: "span 6" }}>
            <ul className="list-clean">
              {data.narratives.map((story) => (
                <li key={story.title} className="nm-surface-soft" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  <strong>{story.title}</strong>
                  <p className="section-copy" style={{ marginTop: 4 }}>{story.body}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={data.recommendations.title} subtitle="AI-prioritized next actions" style={{ gridColumn: "span 6" }}>
            <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {data.recommendations.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
