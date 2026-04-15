import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeMap: Record<ButtonSize, string> = {
  sm: "8px 12px",
  md: "10px 16px",
  lg: "14px 22px",
};

const fontMap: Record<ButtonSize, string> = {
  sm: "var(--font-size-xs)",
  md: "var(--font-size-sm)",
  lg: "var(--font-size-md)",
};

function getVariantStyle(variant: ButtonVariant): React.CSSProperties {
  if (variant === "primary") {
    return {
      color: "#fff",
      background: "linear-gradient(110deg, var(--color-primary-strong), var(--color-primary))",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid rgba(101, 62, 232, 0.32)",
    };
  }

  if (variant === "secondary") {
    return {
      color: "var(--color-primary)",
      background: "linear-gradient(145deg, #edf2f9, #d6dce6)",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid var(--color-border)",
    };
  }

  if (variant === "danger") {
    return {
      color: "#fff",
      background: "linear-gradient(110deg, #f56d7a, var(--color-error))",
      boxShadow: "var(--shadow-sm)",
      border: "1px solid rgba(204, 72, 88, 0.3)",
    };
  }

  return {
    color: "var(--color-text-secondary)",
    background: "transparent",
    border: "1px solid var(--color-border)",
  };
}

export function Button({
  children,
  className,
  variant = "secondary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn("button-root", className)}
      style={{
        ...getVariantStyle(variant),
        padding: sizeMap[size],
        borderRadius: "var(--radius-full)",
        fontWeight: 700,
        fontSize: fontMap[size],
        cursor: isDisabled ? "not-allowed" : "pointer",
        width: fullWidth ? "100%" : undefined,
        opacity: isDisabled ? 0.58 : 1,
        transition: "transform var(--transition-fast), filter var(--transition-default)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
      disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          style={{
            width: 12,
            height: 12,
            borderRadius: 9999,
            border: "2px solid rgba(255,255,255,0.42)",
            borderTopColor: "currentColor",
          }}
        />
      ) : null}
      {children}
    </button>
  );
}
