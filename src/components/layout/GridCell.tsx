import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface GridCellProps {
  children: ReactNode;
  /** Desktop column span (12-col grid). Defaults to 12 on mobile/tablet. */
  span?: number;
  /** Optional tablet span; defaults to min(span, 6) or 12. */
  spanMd?: number;
  className?: string;
  style?: CSSProperties;
  /** Stagger index for `.stagger` parent */
  index?: number;
}

export function GridCell({ children, span = 12, spanMd, className, style, index = 0 }: GridCellProps) {
  const md = spanMd ?? (span >= 6 ? 6 : span);
  return (
    <div
      className={cn("grid-cell", className)}
      style={
        {
          "--cell-span": span,
          "--cell-span-md": md,
          "--i": index,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
