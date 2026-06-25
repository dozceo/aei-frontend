import type { ReactNode } from "react";

export interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: ReactNode;
}

export function SectionTitle({ eyebrow, title, copy, action }: SectionTitleProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "grid", gap: 6 }}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="font-serif-brand" style={{ margin: 0, fontSize: "var(--font-size-xl)", letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        {copy ? <p className="section-copy">{copy}</p> : null}
      </div>
      {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
    </div>
  );
}
