"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/design-system";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global route error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <section className="dashboard-grid" aria-label="Application error">
        <Card
          className="hero-block reveal-up"
          variant="soft"
          title="Something went wrong"
          subtitle="The application hit an unexpected state while rendering this route."
        >
          <p className="section-copy" style={{ marginBottom: 14 }}>
            You can retry immediately, go back to the Plan Hub, or contact support if this keeps happening.
          </p>
          {isDev ? (
            <pre
              style={{
                margin: "0 0 14px",
                padding: 12,
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface-muted)",
                border: "1px solid var(--color-border)",
                overflowX: "auto",
                fontSize: 12,
              }}
            >
              {error.message}
            </pre>
          ) : null}
          <div className="chip-row">
            <Button type="button" variant="primary" onClick={reset}>
              Retry
            </Button>
            <Link href="/" aria-label="Go to plan hub">
              <Button type="button" variant="secondary">
                Go to Plan Hub
              </Button>
            </Link>
            <Link href="/support/ticket" aria-label="Create support ticket">
              <Button type="button" variant="ghost">
                Contact Support
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
