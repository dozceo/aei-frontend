import type { ReactNode } from "react";
import type { Accent } from "./Card";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  icon?: ReactNode;
  accent?: Accent;
}

const accentDeep: Record<Accent, string> = {
  sky: "var(--sky-deep)",
  honey: "var(--honey-deep)",
  sage: "var(--sage-deep)",
  coral: "var(--coral-deep)",
  aub: "var(--aub-deep)",
};

const accentTint: Record<Accent, string> = {
  sky: "var(--sky)",
  honey: "var(--honey)",
  sage: "var(--sage)",
  coral: "var(--coral)",
  aub: "var(--aub)",
};

const deltaColor = {
  up: "var(--sage-deep)",
  down: "var(--coral-deep)",
  flat: "var(--ink-faint)",
} as const;

const deltaGlyph = { up: "↑", down: "↓", flat: "→" } as const;

export function StatCard({ label, value, hint, delta, icon, accent = "aub" }: StatCardProps) {
  return (
    <article
      className="nm-surface nm-hover"
      style={{ padding: 18, borderRadius: "var(--radius-lg)", display: "grid", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </span>
        {icon ? (
          <span
            aria-hidden="true"
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              background: accentTint[accent],
              color: accentDeep[accent],
              boxShadow: "var(--neu-raised-xs)",
              fontSize: 18,
            }}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span className="stat-value" style={{ color: accentDeep[accent] }}>
          {value}
        </span>
        {delta ? (
          <span className="nums" style={{ fontSize: "13px", fontWeight: 700, color: deltaColor[delta.direction] }}>
            {deltaGlyph[delta.direction]} {delta.value}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>{hint}</span>
      ) : null}
    </article>
  );
}
