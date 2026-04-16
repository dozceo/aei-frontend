import Link from "next/link";
import { Button, Card, Input } from "@/components/design-system";

const quickLinks = [
  { href: "/", label: "Plan Hub" },
  { href: "/login", label: "Login" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/help", label: "Help Center" },
];

export default function NotFoundPage() {
  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <section className="dashboard-grid" aria-label="Not found">
        <Card
          className="hero-block reveal-up"
          variant="soft"
          title="404 • Page not found"
          subtitle="The link may be outdated, or you may not have access to this route."
        >
          <p className="section-copy" style={{ marginBottom: 14, maxWidth: 760 }}>
            Use search and jump links below to return to an active learning flow quickly.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, maxWidth: 620 }}>
            <Input name="query" placeholder="Search routes, page names, or features" aria-label="Search routes" />
            <Link href="/" aria-label="Return to plan hub">
              <Button variant="primary" type="button">
                Return Home
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="reveal-up reveal-delay-1" style={{ gridColumn: "span 12" }} title="Suggested links" subtitle="Based on common recovery flows">
          <div className="chip-row">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} aria-label={`Open ${item.label}`}>
                <Button variant="secondary" size="sm" type="button">
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
