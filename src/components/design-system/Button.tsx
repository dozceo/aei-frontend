import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeMap: Record<ButtonSize, string> = {
  sm: "8px 14px",
  md: "11px 18px",
  lg: "14px 24px",
};

const fontMap: Record<ButtonSize, string> = {
  sm: "13px",
  md: "14px",
  lg: "16px",
};

function variantStyle(variant: ButtonVariant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        color: "var(--paper)",
        background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
        boxShadow: "var(--neu-raised-sm)",
        border: "1px solid color-mix(in srgb, var(--color-primary-strong) 60%, transparent)",
      };
    case "danger":
      return {
        color: "#fff",
        background: "linear-gradient(135deg, var(--coral-deep), color-mix(in srgb, var(--coral-deep) 80%, #000))",
        boxShadow: "var(--neu-raised-sm)",
        border: "1px solid color-mix(in srgb, var(--coral-deep) 55%, transparent)",
      };
    case "ghost":
      return {
        color: "var(--color-text-secondary)",
        background: "transparent",
        border: "1px solid transparent",
      };
    case "secondary":
    default:
      return {
        color: "var(--color-primary)",
        background: "var(--paper)",
        boxShadow: "var(--neu-raised-sm)",
        border: "1px solid rgba(255,255,255,0.55)",
      };
  }
}

export function Button({
  children,
  className,
  variant = "secondary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  rightIcon,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn("press", className)}
      style={{
        ...variantStyle(variant),
        padding: sizeMap[size],
        // optical: trim the icon side by 2px
        paddingRight: rightIcon ? `calc(${sizeMap[size].split(" ")[1]} - 2px)` : undefined,
        paddingLeft: leftIcon ? `calc(${sizeMap[size].split(" ")[1]} - 2px)` : undefined,
        borderRadius: "var(--radius-full)",
        fontWeight: 700,
        fontSize: fontMap[size],
        letterSpacing: "-0.01em",
        cursor: isDisabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled ? 0.55 : 1,
        minHeight: 40,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transitionProperty: "transform, box-shadow, filter",
        transitionDuration: "150ms",
        transitionTimingFunction: "cubic-bezier(0.2,0,0,1)",
      }}
      disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: 13,
            height: 13,
            borderRadius: 9999,
            border: "2px solid rgba(255,255,255,0.4)",
            borderTopColor: "currentColor",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}
