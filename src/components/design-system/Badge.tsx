import type { ReactNode } from "react";

type BadgeTone = "primary" | "neutral" | "success" | "warning" | "error" | "sky" | "honey" | "sage" | "coral" | "aub";

const toneColor: Record<BadgeTone, { fg: string; bg: string }> = {
  primary: { fg: "var(--color-primary)", bg: "color-mix(in srgb, var(--color-primary) 14%, transparent)" },
  neutral: { fg: "var(--color-text-secondary)", bg: "color-mix(in srgb, var(--ink-faint) 16%, transparent)" },
  success: { fg: "var(--sage-deep)", bg: "color-mix(in srgb, var(--sage-deep) 16%, transparent)" },
  warning: { fg: "var(--honey-deep)", bg: "color-mix(in srgb, var(--honey-deep) 18%, transparent)" },
  error: { fg: "var(--coral-deep)", bg: "color-mix(in srgb, var(--coral-deep) 16%, transparent)" },
  sky: { fg: "var(--sky-deep)", bg: "color-mix(in srgb, var(--sky-deep) 16%, transparent)" },
  honey: { fg: "var(--honey-deep)", bg: "color-mix(in srgb, var(--honey-deep) 18%, transparent)" },
  sage: { fg: "var(--sage-deep)", bg: "color-mix(in srgb, var(--sage-deep) 16%, transparent)" },
  coral: { fg: "var(--coral-deep)", bg: "color-mix(in srgb, var(--coral-deep) 16%, transparent)" },
  aub: { fg: "var(--aub-deep)", bg: "color-mix(in srgb, var(--aub-deep) 16%, transparent)" },
};

export function Badge({ tone = "neutral", dot = false, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  const c = toneColor[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: c.fg,
        background: c.bg,
        padding: "4px 11px",
        borderRadius: "var(--radius-full)",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        lineHeight: 1.5,
      }}
    >
      {dot ? (
        <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: 9999, background: "currentColor" }} />
      ) : null}
      {children}
    </span>
  );
}
