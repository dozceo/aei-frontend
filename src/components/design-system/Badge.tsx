import type { ReactNode } from "react";

type BadgeTone = "primary" | "neutral" | "success" | "warning" | "error";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  const toneStyles: Record<BadgeTone, React.CSSProperties> = {
    primary: { color: "var(--color-primary)", background: "rgba(111, 60, 244, 0.12)" },
    neutral: { color: "var(--color-text-secondary)", background: "rgba(122, 132, 152, 0.12)" },
    success: { color: "var(--color-success)", background: "rgba(23, 155, 107, 0.12)" },
    warning: { color: "var(--color-warning)", background: "rgba(242, 155, 56, 0.12)" },
    error: { color: "var(--color-error)", background: "rgba(232, 92, 106, 0.12)" },
  };

  return (
    <span
      style={{
        ...toneStyles[tone],
        padding: "4px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--font-size-xs)",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}
