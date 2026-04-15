"use client";

import { Badge, Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useTeacherPageContent } from "@/hooks/useRolePageContent";
import { getTeacherPagePath, teacherFallbackNav, type TeacherInterventionsDoc } from "@/lib/role-content";
import { getSeverityTone } from "@/lib/tone-utils";

const pageKey = "interventions" as const;

export default function TeacherInterventionsPage() {
  const { data, loading, error, roleId } = useTeacherPageContent<TeacherInterventionsDoc>(pageKey);
  const pathHint = getTeacherPagePath(roleId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "Teacher interventions"}
      subtitle={data?.hero.subtitle ?? "Database-backed intervention command"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? teacherFallbackNav}
      activePath="/teacher/interventions"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.sections.queueTitle} subtitle={data.sections.queueSubtitle} style={{ gridColumn: "span 8" }}>
            <ul className="list-clean">
              {data.queue.map((item) => (
                <li key={item.id} className="nm-surface-soft" style={{ padding: 14, borderRadius: "var(--radius-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <strong>
                      {item.learner} - {item.concept}
                    </strong>
                    <Badge tone={getSeverityTone(item.severity)}>{item.severity}</Badge>
                  </div>
                  <p className="section-copy" style={{ margin: "8px 0 12px" }}>
                    {item.trend}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span className="muted" style={{ fontSize: "var(--font-size-xs)" }}>
                      {item.ownerLabel}: {item.owner} | {item.caseLabel}: {item.id}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="secondary" size="sm">
                        {item.viewLabel}
                      </Button>
                      <Button variant="primary" size="sm">
                        {item.resolveLabel}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={data.sections.protocolTitle} subtitle={data.sections.protocolSubtitle} style={{ gridColumn: "span 4" }}>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10 }}>
              {data.protocolSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </Card>

          <Card title={data.sections.timelineTitle} subtitle={data.sections.timelineSubtitle} style={{ gridColumn: "span 12" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {data.timeline.map((entry) => (
                <div key={`${entry.timeLabel}-${entry.detail}`} className="nm-inset" style={{ padding: 14, borderRadius: "var(--radius-sm)" }}>
                  <strong>{entry.timeLabel}</strong>
                  <p className="section-copy" style={{ marginTop: 6 }}>
                    {entry.detail}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
