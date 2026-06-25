import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Accent } from "@/components/design-system";

interface ShellNavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon?: ReactNode;
}

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
    <main className="app-shell">
      <header className="top-nav nm-surface">
        <Link href="/" className="brand" aria-label={brandLabel}>
          {brandHead} <span>{brandRest.join(" ")}</span>
        </Link>
        <nav className="nav-links no-scrollbar" aria-label="Role navigation">
          {navItems.map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                {item.icon ? <span className="nav-icon" aria-hidden="true">{item.icon}</span> : null}
                <span className="nav-label-full">{item.label}</span>
                <span className="nav-label-short">{item.shortLabel ?? item.label.split(" ").pop()}</span>
              </Link>
            );
          })}
        </nav>
        <div className="top-nav-actions">
          {actions}
          {actionLabel && actionHref ? (
            <Link href={actionHref} className="top-nav-cta press">
              <span className="nav-cta-full">{actionLabel}</span>
              <span className="nav-cta-short">Go</span>
            </Link>
          ) : null}
        </div>
      </header>

      <section className="nm-surface hero-block hero-enter" style={{ marginBottom: "var(--space-lg)" }}>
        <span
          aria-hidden="true"
          className="hero-glow"
          style={{ background: accentTint[accent] }}
        />
        <div style={{ position: "relative", display: "grid", gap: 8 }}>
          <span className="eyebrow hero-enter-item" style={{ ["--i" as string]: 0 } as CSSProperties}>{eyebrow}</span>
          <h1 className="font-serif-brand hero-enter-item" style={{ margin: "4px 0 0", fontSize: "clamp(26px, 4.4vw, 48px)", lineHeight: 1.05, letterSpacing: "-0.02em", ["--i" as string]: 1 } as CSSProperties}>
            {title}
          </h1>
          <p className="section-copy hero-enter-item" style={{ fontSize: "var(--font-size-md)", ["--i" as string]: 2 } as CSSProperties}>{subtitle}</p>
        </div>
      </section>

      <div className="dashboard-grid stagger">{children}</div>
    </main>
  );
}
