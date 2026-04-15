import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/design-system";

interface ShellNavItem {
  href: string;
  label: string;
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
  children: ReactNode;
}

export function RoleShell({
  title,
  subtitle,
  brandLabel = "SANKALP AEI",
  eyebrow = "Operational View",
  navItems,
  activePath,
  actionLabel,
  actionHref,
  children,
}: RoleShellProps) {
  return (
    <main className="app-shell">
      <header className="top-nav nm-surface">
        <div className="brand">
          {brandLabel.split(" ")[0]} <span>{brandLabel.split(" ").slice(1).join(" ")}</span>
        </div>
        <nav className="nav-links" aria-label="Role navigation">
          {navItems.map((item) => {
            const active = activePath === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        {actionLabel && actionHref ? (
          <Link href={actionHref} aria-label={actionLabel}>
            <Button variant="primary" size="sm">
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <div style={{ width: 96 }} aria-hidden="true" />
        )}
      </header>

      <section className="nm-surface hero-block" style={{ marginBottom: "var(--space-lg)" }}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 style={{ margin: "10px 0 8px", fontSize: "clamp(28px, 4.2vw, 48px)", lineHeight: 1.1 }}>{title}</h1>
        <p className="section-copy">{subtitle}</p>
      </section>

      <div className="dashboard-grid">{children}</div>
    </main>
  );
}
