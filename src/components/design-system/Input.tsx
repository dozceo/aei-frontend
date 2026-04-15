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
        <label htmlFor={inputId} style={{ fontWeight: 600, fontSize: "var(--font-size-xs)", letterSpacing: "0.12em" }}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn("nm-inset", className)}
        style={{
          border: "1px solid var(--color-border)",
          padding: "12px 14px",
          borderRadius: "var(--radius-full)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-primary)",
          outline: "none",
          ...style,
        }}
        {...rest}
      />
      {hint ? <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)" }}>{hint}</span> : null}
    </div>
  );
}
