"use client";

import Link from "next/link";
import { useState } from "react";

export interface ShellNavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon?: React.ReactNode;
}

interface ShellNavProps {
  items: ShellNavItem[];
  activePath: string;
  actionLabel?: string;
  actionHref?: string;
}

export function ShellNav({ items, activePath, actionLabel, actionHref }: ShellNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = items.slice(0, 4);
  const overflow = items.slice(4);
  const showMore = overflow.length > 0;

  return (
    <>
      {/* Desktop / tablet top nav */}
      <nav className="shell-nav-top no-scrollbar" aria-label="Role navigation">
        {items.map((item) => {
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

      {/* Mobile bottom tab bar */}
      <nav className="shell-nav-bottom" aria-label="Mobile navigation">
        {primary.map((item) => {
          const active = activePath === item.href;
          return (
            <Link key={item.href} href={item.href} className={`bottom-tab${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              <span className="bottom-tab-icon" aria-hidden="true">{item.icon ?? "•"}</span>
              <span className="bottom-tab-label">{item.shortLabel ?? item.label.split(" ").pop()}</span>
            </Link>
          );
        })}
        {showMore ? (
          <button type="button" className={`bottom-tab${moreOpen ? " active" : ""}`} onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
            <span className="bottom-tab-icon" aria-hidden="true">⋯</span>
            <span className="bottom-tab-label">More</span>
          </button>
        ) : null}
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="bottom-tab bottom-tab-cta">
            <span className="bottom-tab-icon" aria-hidden="true">→</span>
            <span className="bottom-tab-label">{actionLabel.split(" ")[0]}</span>
          </Link>
        ) : null}
      </nav>

      {showMore && moreOpen ? (
        <div className="shell-more-sheet" role="dialog" aria-label="More navigation">
          <div className="shell-more-backdrop" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div className="shell-more-panel nm-surface">
            <p className="shell-more-title">More</p>
            <ul className="list-clean">
              {overflow.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="shell-more-link" onClick={() => setMoreOpen(false)}>
                    <span aria-hidden="true">{item.icon}</span> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
