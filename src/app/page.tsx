import Link from "next/link";
import { appRoutes } from "./routes";

const plannedOutputs = [
  {
    title: "Student Flow",
    description: "Login to dashboard, mission tracking, and mastery progression components.",
    href: "/student/dashboard",
  },
  {
    title: "Teacher Flow",
    description: "Class analytics, intervention queue, and action routing for at-risk learners.",
    href: "/teacher/dashboard",
  },
  {
    title: "Parent Flow",
    description: "Child performance overview, notification inbox, and progress trend summary.",
    href: "/parent/dashboard",
  },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="top-nav nm-surface">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Main pages">
          <Link className="nav-link active" href="/">
            Plan Hub
          </Link>
          <Link className="nav-link" href="/login">
            Login
          </Link>
          <Link className="nav-link" href="/onboarding">
            Onboarding
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Execution hub">
        <article className="hero-block nm-surface">
          <span className="eyebrow">Day 3-4 Frontend Execution</span>
          <h1 style={{ margin: "14px 0 10px", fontSize: "clamp(32px, 5vw, 58px)", lineHeight: 1.08 }}>
            Planned pages generated with a
            <span className="text-gradient"> shared AEI design language</span>
          </h1>
          <p className="section-copy" style={{ maxWidth: 840 }}>
            This workspace now uses the provided visual references as theme input only. The pages below are
            built as original compositions aligned with the implementation plan and role-based flows.
          </p>
        </article>

        <div className="card-grid-3">
          {plannedOutputs.map((flow) => (
            <article key={flow.title} className="nm-surface" style={{ padding: "22px" }}>
              <h2 className="section-heading" style={{ fontSize: "26px" }}>
                {flow.title}
              </h2>
              <p className="section-copy" style={{ minHeight: 74 }}>
                {flow.description}
              </p>
              <Link
                href={flow.href}
                style={{
                  display: "inline-flex",
                  marginTop: 14,
                  padding: "10px 18px",
                  borderRadius: 9999,
                  color: "white",
                  background: "linear-gradient(110deg, var(--color-primary-strong), var(--color-primary))",
                  boxShadow: "var(--shadow-sm)",
                  fontWeight: 700,
                  fontSize: "var(--font-size-sm)",
                }}
              >
                Open page
              </Link>
            </article>
          ))}
        </div>

        <article className="nm-surface" style={{ padding: "22px" }}>
          <h2 className="section-heading">Route Coverage Snapshot</h2>
          <ul className="list-clean" aria-label="Planned routes">
            {appRoutes.map((route) => (
              <li
                key={route.path}
                className="nm-surface-soft"
                style={{
                  padding: "12px 14px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600 }}>{route.path}</span>
                <span className="muted" style={{ fontSize: "var(--font-size-xs)", textTransform: "uppercase" }}>
                  {route.roles?.join(", ") ?? "Public"}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <article className="nm-surface" style={{ padding: "22px" }}>
          <h2 className="section-heading">Evaluation Mode</h2>
          <p className="section-copy" style={{ marginBottom: 14 }}>
            Each page output is evaluated against 4 dimensions from your references and execution plan:
            thematic consistency, component reuse, flow fit, and originality.
          </p>
          <div className="chip-row">
            <span className="nm-surface-soft" style={{ padding: "8px 12px", borderRadius: 9999 }}>
              Theme fidelity
            </span>
            <span className="nm-surface-soft" style={{ padding: "8px 12px", borderRadius: 9999 }}>
              Plan alignment
            </span>
            <span className="nm-surface-soft" style={{ padding: "8px 12px", borderRadius: 9999 }}>
              Reusable components
            </span>
            <span className="nm-surface-soft" style={{ padding: "8px 12px", borderRadius: 9999 }}>
              Non-clone originality
            </span>
          </div>
        </article>
      </section>
    </main>
  );
}
