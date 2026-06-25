export interface ProgressProps {
  label?: string;
  value: number;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "sky" | "coral" | "aub" | "sage" | "honey";
}

function clamp(num: number): number {
  return Math.max(0, Math.min(100, Math.round(num)));
}

const toneColor: Record<NonNullable<ProgressProps["tone"]>, string> = {
  primary: "var(--color-primary)",
  success: "var(--sage-deep)",
  warning: "var(--honey-deep)",
  sky: "var(--sky-deep)",
  coral: "var(--coral-deep)",
  aub: "var(--aub-deep)",
  sage: "var(--sage-deep)",
  honey: "var(--honey-deep)",
};

export function Progress({ label, value, hint, tone = "primary" }: ProgressProps) {
  const safeValue = clamp(value);
  const color = toneColor[tone];

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {(label || hint) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {label ? <strong style={{ fontSize: "var(--font-size-sm)" }}>{label}</strong> : <span />}
          <span className="nums" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
            {safeValue}%
          </span>
        </div>
      )}
      <div className="nm-inset" style={{ height: 10, borderRadius: "var(--radius-full)", overflow: "hidden", padding: 0 }}>
        <span
          aria-hidden="true"
          style={{
            display: "block",
            height: "100%",
            width: `${safeValue}%`,
            borderRadius: "var(--radius-full)",
            background: `linear-gradient(110deg, ${color}, color-mix(in srgb, ${color} 55%, var(--paper)))`,
            transition: "width var(--transition-slow)",
          }}
        />
      </div>
      {hint && !label ? (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>{hint}</span>
      ) : null}
    </div>
  );
}
