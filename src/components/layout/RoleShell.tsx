import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal, RevealItem } from "@/components/design-system";
import type { Accent } from "@/components/design-system";

interface ShellNavItem {
  href: string;
  label: string;
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
              <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
                {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="press"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minHeight: 40,
                padding: "10px 18px",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
                fontSize: 14,
                color: "var(--paper)",
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-strong))",
                boxShadow: "var(--neu-raised-sm)",
              }}
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </header>

      <Reveal
        className="nm-surface hero-block"
        style={{ marginBottom: "var(--space-lg)" }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "auto auto -40px -50px",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: accentTint[accent],
            filter: "blur(8px)",
            opacity: 0.35,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", display: "grid", gap: 8 }}>
          <RevealItem>
            <span className="eyebrow">{eyebrow}</span>
          </RevealItem>
          <RevealItem>
            <h1 className="font-serif-brand" style={{ margin: "4px 0 0", fontSize: "clamp(30px, 4.4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {title}
            </h1>
          </RevealItem>
          <RevealItem>
            <p className="section-copy" style={{ fontSize: "var(--font-size-md)" }}>{subtitle}</p>
          </RevealItem>
        </div>
      </Reveal>

      <div className="dashboard-grid stagger">{children}</div>
    </main>
  );
}
