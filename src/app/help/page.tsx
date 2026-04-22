"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card, Input } from "@/components/design-system";

const articles = [
  { category: "Student", title: "How to improve mastery streaks", excerpt: "Use curriculum checkpoints and AI companion prompts daily." },
  { category: "Teacher", title: "Resolving interventions quickly", excerpt: "Prioritize high severity and assign actions from the intervention queue." },
  { category: "Parent", title: "Reading weekly trend charts", excerpt: "Focus on consistency first, then subject-specific variance." },
  { category: "Platform", title: "Account and authentication issues", excerpt: "Verify email/password provider and role claim mapping." },
  { category: "Billing", title: "Understanding plan usage", excerpt: "Track active users and feature limits in admin billing once enabled." },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return articles;
    }

    return articles.filter((item) => `${item.category} ${item.title} ${item.excerpt}`.toLowerCase().includes(needle));
  }, [query]);

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Help navigation">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/login" className="nav-link">
            Login
          </Link>
          <Link href="/support/ticket" className="nav-link">
            Support
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Help center content">
        <Card className="hero-block reveal-up reveal-delay-1" variant="soft" title="Help Center" subtitle="Knowledge base, troubleshooting, and support entry points">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, maxWidth: 680 }}>
            <Input
              name="help-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, teacher, parent, auth, billing..."
              aria-label="Search knowledge base"
            />
            <Link href="/support/ticket" aria-label="Open support ticket page">
              <Button type="button" variant="primary">
                Create Ticket
              </Button>
            </Link>
          </div>
        </Card>

        <div className="card-grid-2" style={{ gridColumn: "span 12" }}>
          {filtered.map((item, index) => (
            <Card
              key={item.title}
              className={`reveal-up ${index % 3 === 0 ? "reveal-delay-1" : index % 3 === 1 ? "reveal-delay-2" : "reveal-delay-3"}`}
              title={item.title}
              subtitle={item.category}
            >
              <p className="section-copy" style={{ marginBottom: 10 }}>
                {item.excerpt}
              </p>
              <Button type="button" variant="ghost" size="sm">
                Read article
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
