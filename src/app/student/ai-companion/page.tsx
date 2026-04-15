"use client";

import { Badge, Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useStudentPageContent } from "@/hooks/useStudentPageContent";
import { getStudentPagePath, studentFallbackNav, type StudentAiCompanionDoc } from "@/lib/student-content";

const pageKey = "ai-companion" as const;

export default function StudentAiCompanionPage() {
  const { data, loading, error, studentId } = useStudentPageContent<StudentAiCompanionDoc>(pageKey);
  const pathHint = getStudentPagePath(studentId, pageKey);

  return (
    <RoleShell
      title={data?.hero.title ?? "AI companion"}
      subtitle={data?.hero.subtitle ?? "Database-backed conversation stream"}
      eyebrow={data?.hero.eyebrow ?? "Database Content"}
      navItems={data?.navItems ?? studentFallbackNav}
      activePath="/student/ai-companion"
      actionLabel={data?.hero.actionLabel}
      actionHref={data?.hero.actionHref}
      brandLabel={data?.brandLabel ?? "SANKALP AEI"}
    >
      {!data ? (
        <DatabaseState loading={loading} error={error} pathHint={pathHint} />
      ) : (
        <>
          <Card title={data.session.title} subtitle={data.session.subtitle} style={{ gridColumn: "span 8" }}>
            <div className="chip-row" style={{ marginBottom: 12 }}>
              {data.quickPrompts.map((prompt) => (
                <Badge key={prompt} tone="primary">
                  {prompt}
                </Badge>
              ))}
            </div>
            <div className="nm-inset" style={{ padding: 14, borderRadius: "var(--radius-md)", display: "grid", gap: 10 }}>
              {data.messages.map((message, index) => (
                <div
                  key={`${message.timestamp}-${index}`}
                  className={message.role === "assistant" ? "nm-surface-soft" : "nm-surface"}
                  style={{
                    borderRadius: "var(--radius-sm)",
                    padding: 10,
                    justifySelf: message.role === "assistant" ? "start" : "end",
                    maxWidth: "82%",
                  }}
                >
                  <p style={{ margin: 0 }}>{message.content}</p>
                  <p className="muted" style={{ margin: "6px 0 0", fontSize: "var(--font-size-xs)" }}>
                    {message.timestamp}
                  </p>
                </div>
              ))}
            </div>
            <div className="nm-inset" style={{ marginTop: 12, borderRadius: "var(--radius-full)", padding: 8, display: "flex", gap: 8 }}>
              <input
                placeholder={data.composer.placeholder}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  color: "var(--color-text-primary)",
                  paddingInline: 8,
                }}
              />
              <Button variant="primary" size="sm">
                {data.composer.sendLabel}
              </Button>
            </div>
          </Card>

          <Card title={data.sections.contextTitle} subtitle={data.sections.contextSubtitle} style={{ gridColumn: "span 4" }}>
            <ul className="list-clean">
              {data.contextMetrics.map((metric) => (
                <li key={metric.label} className="nm-surface-soft" style={{ padding: 12, borderRadius: "var(--radius-sm)" }}>
                  <strong>{metric.label}</strong>
                  <p style={{ margin: "6px 0", fontWeight: 700 }}>{metric.value}</p>
                  <p className="section-copy" style={{ margin: 0 }}>{metric.hint}</p>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
