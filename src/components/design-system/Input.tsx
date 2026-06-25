import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, style, ...rest }: InputProps) {
  const inputId = id ?? rest.name;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label ? (
        <label
          htmlFor={inputId}
          style={{
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
          }}
        >
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn("nm-inset", className)}
        style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-primary)",
          background: "var(--paper)",
          outline: "none",
          minHeight: 44,
          ...style,
        }}
        {...rest}
      />
      {hint ? <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>{hint}</span> : null}
    </div>
  );
}
