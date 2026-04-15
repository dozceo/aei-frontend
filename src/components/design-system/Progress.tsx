export interface ProgressProps {
  label: string;
  value: number;
  hint?: string;
  tone?: "primary" | "success" | "warning";
}

function clamp(num: number): number {
  return Math.max(0, Math.min(100, num));
}

export function Progress({ label, value, hint, tone = "primary" }: ProgressProps) {
  const safeValue = clamp(value);
  const color = tone === "success" ? "var(--color-success)" : tone === "warning" ? "var(--color-warning)" : "var(--color-primary)";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: "var(--font-size-sm)" }}>{label}</strong>
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>{safeValue}%</span>
      </div>
      <div className="nm-inset" style={{ height: 12, borderRadius: "var(--radius-full)", overflow: "hidden" }}>
        <span
          aria-hidden="true"
          style={{
            display: "block",
            height: "100%",
            width: `${safeValue}%`,
            background: `linear-gradient(110deg, ${color}, var(--color-primary-soft))`,
            transition: "width var(--transition-slow)",
          }}
        />
      </div>
      {hint ? <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>{hint}</span> : null}
    </div>
  );
}
