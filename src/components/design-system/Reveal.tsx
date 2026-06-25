"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.5, bounce: 0 },
  },
} as const;

/** Staggered enter container. Wrap a group of RevealItem children. */
export function Reveal({ children, className, style, ...rest }: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={container} className={className} style={style} {...rest}>
      {children}
    </motion.div>
  );
}

/** A single staggered child. Pass `span` to set its grid column span. */
export function RevealItem({
  children,
  span,
  className,
  style,
  ...rest
}: HTMLMotionProps<"div"> & { children: ReactNode; span?: number }) {
  return (
    <motion.div
      variants={item}
      className={className}
      style={{ gridColumn: span ? `span ${span}` : undefined, ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
