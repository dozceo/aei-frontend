import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Accent } from "@/components/design-system";
import { ShellNav, type ShellNavItem } from "@/components/layout/ShellNav";

interface RoleShellProps {
  title: string;
  subtitle: string;
  brandLabel?: string;
  eyebrow?: string;
  navItems: ShellNavItem[];
  activePath: string;
  actionLabel?: string;
  actionHref?: string;
  actions?: ReactNode;
  accent?: Accent;
  children: ReactNode;
}

const accentTint: Record<Accent, string> = {
  sky: "var(--sky)",
  honey: "var(--honey)",
  sage: "var(--sage)",
  coral: "var(--coral)",
  aub: "var(--aub)",
};

export function RoleShell({
  title,
  subtitle,
  brandLabel = "SANKALP AEI",
  eyebrow = "Operational View",
  navItems,
  activePath,
  actionLabel,
  actionHref,
  actions,
  accent = "aub",
  children,
}: RoleShellProps) {
  const [brandHead, ...brandRest] = brandLabel.split(" ");

  return (
    <div className="shell-root">
      <main className="app-shell">
        <header className="top-nav nm-surface">
          <Link href="/" className="brand" aria-label={brandLabel}>
            {brandHead} <span>{brandRest.join(" ")}</span>
          </Link>
          <div className="top-nav-actions top-nav-actions-desktop">
            {actions}
            {actionLabel && actionHref ? (
              <Link href={actionHref} className="top-nav-cta press">
                <span className="nav-cta-full">{actionLabel}</span>
                <span className="nav-cta-short">Go</span>
              </Link>
            ) : null}
          </div>
        </header>

        <ShellNav items={navItems} activePath={activePath} actionLabel={actionLabel} actionHref={actionHref} />

        <section className="nm-surface hero-block" style={{ marginBottom: "var(--space-lg)" }}>
          <span aria-hidden="true" className="hero-glow" style={{ background: accentTint[accent] }} />
          <div style={{ position: "relative", display: "grid", gap: 8, minWidth: 0 }}>
            <span className="eyebrow hero-enter-item" style={{ ["--i" as string]: 0 } as CSSProperties}>{eyebrow}</span>
            <h1 className="font-serif-brand hero-enter-item hero-title" style={{ ["--i" as string]: 1 } as CSSProperties}>{title}</h1>
            <p className="section-copy hero-enter-item" style={{ ["--i" as string]: 2 } as CSSProperties}>{subtitle}</p>
          </div>
        </section>

        <div className="dashboard-grid">{children}</div>
      </main>
    </div>
  );
}
