"use client";

import { Badge, Button, Card, Progress } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useTeacherPageContent } from "@/hooks/useRolePageContent";
import { getTeacherPagePath, teacherFallbackNav, type TeacherDashboardDoc } from "@/lib/role-content";
import { getSeverityTone } from "@/lib/tone-utils";

const pageKey = "dashboard" as const;

export default function TeacherDashboardPage() {
  const { data, loading, error, roleId } = useTeacherPageContent<TeacherDashboardDoc>(pageKey);
  const pathHint = getTeacherPagePath(roleId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Teacher dashboard"}
      subtitle={data?.hero.subtitle ?? "Database-backed teacher operations"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? teacherFallbackNav}
      activePath="/teacher/dashboard"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.sections.snapshotTitle} subtitle={data.sections.snapshotSubtitle} style={{ gridColumn: "span 4" }}>
            <div style={{ display: "grid", gap: 12 }}>
              {data.classSnapshot.map((metric) => (
                <Progress key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} tone={metric.tone} />
              ))}
            </div>
          </Card>

          <Card title={data.sections.riskTitle} subtitle={data.sections.riskSubtitle} style={{ gridColumn: "span 8" }}>
            <ul className="list-clean">
              {data.atRiskLearners.map((item) => (
                <li
                  key={item.id}
                  className="nm-surface-soft"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    padding: 12,
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <strong>{item.learner}</strong>
                    <p className="section-copy" style={{ marginTop: 4 }}>
                      {item.concept}
                    </p>
                  </div>
                  <p className="section-copy" style={{ margin: 0 }}>
                    {item.trend}
                  </p>
                  <Badge tone={getSeverityTone(item.severity)}>{item.severity}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={data.sections.actionsTitle} subtitle={data.sections.actionsSubtitle} style={{ gridColumn: "span 7" }}>
            <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10 }}>
              {data.recommendedActions.items.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ol>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Button variant="primary">{data.recommendedActions.primaryActionLabel}</Button>
              <Button variant="secondary">{data.recommendedActions.secondaryActionLabel}</Button>
            </div>
          </Card>

          <Card title={data.sections.noticesTitle} subtitle={data.sections.noticesSubtitle} style={{ gridColumn: "span 5" }}>
            <ul className="list-clean">
              {data.liveNotices.map((notice) => (
                <li key={notice} className="nm-inset" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  {notice}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
