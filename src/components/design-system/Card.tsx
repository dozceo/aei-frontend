import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "surface" | "soft" | "inset";
export type Accent = "sky" | "honey" | "sage" | "coral" | "aub";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  variant?: CardVariant;
  as?: "article" | "section" | "div";
  accent?: Accent;
  interactive?: boolean;
  action?: ReactNode;
}

const accentDeep: Record<Accent, string> = {
  sky: "var(--sky-deep)",
  honey: "var(--honey-deep)",
  sage: "var(--sage-deep)",
  coral: "var(--coral-deep)",
  aub: "var(--aub-deep)",
};

export function Card({
  title,
  subtitle,
  children,
  className,
  variant = "surface",
  as = "article",
  accent,
  interactive = false,
  action,
  style,
  ...rest
}: CardProps) {
  const Element = as;
  const variantClass = variant === "soft" ? "nm-surface-soft" : variant === "inset" ? "nm-inset" : "nm-surface";

  return (
    <Element
      className={cn(variantClass, interactive && "nm-hover", className)}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 20,
        borderRadius: "var(--radius-lg)",
        minWidth: 0,
        maxWidth: "100%",
        ...style,
      }}
      {...rest}
    >
      {accent ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            insetInlineStart: 0,
            insetBlock: 0,
            width: 4,
            background: accentDeep[accent],
            opacity: 0.85,
          }}
        />
      ) : null}
      {title || action ? (
        <header
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: subtitle ? 12 : 16,
          }}
        >
          <div>
            {title ? (
              <h2 style={{ margin: 0, fontSize: "var(--font-size-lg)", lineHeight: "var(--line-height-tight)", letterSpacing: "-0.01em" }}>
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p style={{ margin: "6px 0 0", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
        </header>
      ) : null}
      {children}
    </Element>
  );
}
