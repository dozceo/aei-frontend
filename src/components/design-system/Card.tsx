import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "surface" | "soft" | "inset";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  variant?: CardVariant;
  as?: "article" | "section" | "div";
}

export function Card({
  title,
  subtitle,
  children,
  className,
  variant = "surface",
  as = "article",
  style,
  ...rest
}: CardProps) {
  const Element = as;
  const variantClass = variant === "soft" ? "nm-surface-soft" : variant === "inset" ? "nm-inset" : "nm-surface";

  return (
    <Element className={cn(variantClass, className)} style={{ padding: 18, ...style }} {...rest}>
      {title ? (
        <header style={{ marginBottom: subtitle ? 10 : 14 }}>
          <h2 style={{ margin: 0, fontSize: "var(--font-size-lg)", lineHeight: "var(--line-height-tight)" }}>{title}</h2>
          {subtitle ? (
            <p style={{ margin: "6px 0 0", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </Element>
  );
}
