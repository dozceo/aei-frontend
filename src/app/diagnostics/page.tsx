"use client";

import { useEffect, useState } from "react";
import { firebaseAuth, db, isFirebaseConfigured } from "@/lib/firebase-client";
import { Button, Card } from "@/components/design-system";
import { verifyFirestoreStructure } from "@/lib/firestore-verify";
import { getSeedingStatusReport } from "@/lib/firestore-seed-utility";
import Link from "next/link";

type TestResult = {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
};

export default function DiagnosticsPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const runDiagnostics = async () => {
      setLoading(true);
      const results: TestResult[] = [];

      // Test 1: Firebase Configuration
      results.push({
        name: "Firebase Configuration",
        passed: isFirebaseConfigured,
        message: isFirebaseConfigured
          ? "✓ Firebase is configured with all required environment variables"
          : "✗ Firebase configuration missing. Check NEXT_PUBLIC_FIREBASE_* env vars",
      });

      // Test 2: Firestore Connection
      if (db) {
        results.push({
          name: "Firestore Connection",
          passed: true,
          message: "✓ Firestore database is accessible",
          details: {
            projectId: db.app.options.projectId,
          },
        });
      } else {
        results.push({
          name: "Firestore Connection",
          passed: false,
          message: "✗ Firestore is not initialized",
        });
      }

      // Test 3: Firebase Auth
      if (firebaseAuth) {
        results.push({
          name: "Firebase Auth",
          passed: true,
          message: "✓ Firebase Auth is initialized",
        });

        // Get current user
        firebaseAuth.onAuthStateChanged((user) => {
          setCurrentUser(user);
        });
      } else {
        results.push({
          name: "Firebase Auth",
          passed: false,
          message: "✗ Firebase Auth is not initialized",
        });
      }

      // Test 4: Firestore Collections Structure
      if (isFirebaseConfigured && db) {
        try {
          const verification = await verifyFirestoreStructure();
          const collectionsWithData = verification.collections.filter((c) => c.documentCount > 0);

          results.push({
            name: "Firestore Collections",
            passed: collectionsWithData.length > 0,
            message:
              collectionsWithData.length > 0
                ? `✓ Found ${collectionsWithData.length} collection(s) with data`
                : "⚠ No collections with data yet. Create users to populate.",
            details: {
              summary: verification.summary,
              collections: verification.collections.map((c) => ({
                name: c.collectionName,
                documents: c.documentCount,
                hasIssues: c.errors.length > 0 || !c.hasRequiredFields,
              })),
            },
          });
        } catch (error) {
          results.push({
            name: "Firestore Collections",
            passed: false,
            message: `✗ Error checking collections: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }

      // Test 5: Seeding Status
      if (isFirebaseConfigured && db) {
        try {
          const statusReport = await getSeedingStatusReport();
          results.push({
            name: "User Seeding Status",
            passed: true,
            message: "✓ Generated seeding status report",
            details: {
              report: statusReport,
            },
          });
        } catch (error) {
          results.push({
            name: "User Seeding Status",
            passed: false,
            message: `✗ Could not generate status report: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }

      setTests(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  const allPassed = tests.every((t) => t.passed);

  return (
    <main className="app-shell" style={{ marginTop: 18 }}>
      <header className="top-nav nm-surface reveal-up">
        <div className="brand">
          SANKALP <span>AEI</span>
        </div>
        <nav className="nav-links" aria-label="Diagnostics navigation">
          <Link href="/" className="nav-link">
            Plan Hub
          </Link>
          <Link href="/login" className="nav-link">
            Login
          </Link>
          <Link href="/auth/signup" className="nav-link">
            Signup
          </Link>
        </nav>
      </header>

      <section className="dashboard-grid" aria-label="Diagnostics">
        <Card
          className="hero-block reveal-up"
          variant={allPassed && tests.length > 0 ? "surface" : "soft"}
          title="Authentication & Firestore Diagnostics"
          subtitle="System health check and configuration verification"
        >
          {loading ? (
            <div style={{ padding: "var(--space-xl)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              Running diagnostic tests...
            </div>
          ) : tests.length === 0 ? (
            <div style={{ padding: "var(--space-xl)", color: "var(--color-text-secondary)" }}>
              No tests were run. Please refresh the page.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "var(--space-lg)" }}>
              {tests.map((test, index) => (
                <div
                  key={index}
                  style={{
                    padding: "var(--space-md)",
                    borderLeft: `4px solid ${test.passed ? "#4ade80" : "#ef4444"}`,
                    backgroundColor: test.passed ? "#f0fdf4" : "#fef2f2",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "var(--space-xs)" }}>{test.name}</div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-sm)" }}>
                    {test.message}
                  </div>
                  {test.details && (
                    <details style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                      <summary style={{ cursor: "pointer", marginTop: "var(--space-xs)", fontWeight: 500 }}>
                        Show details
                      </summary>
                      <pre
                        style={{
                          overflow: "auto",
                          margin: "var(--space-sm) 0 0 0",
                          padding: "var(--space-sm)",
                          backgroundColor: "rgba(0,0,0,0.05)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "var(--font-size-xs)",
                        }}
                      >
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}

              {currentUser && (
                <div
                  style={{
                    padding: "var(--space-md)",
                    backgroundColor: "var(--color-bg-secondary)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "var(--space-md)" }}>Current User</div>
                  <div style={{ fontSize: "var(--font-size-sm)", display: "grid", gap: "var(--space-xs)" }}>
                    <div>
                      <strong>UID:</strong> {currentUser.uid}
                    </div>
                    <div>
                      <strong>Email:</strong> {currentUser.email || "Not set"}
                    </div>
                    <div>
                      <strong>Email Verified:</strong> {currentUser.emailVerified ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginTop: "var(--space-lg)" }}>
                <Button
                  onClick={() => {
                    window.location.reload();
                  }}
                  variant="secondary"
                >
                  Refresh Tests
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = "/auth/signup";
                  }}
                  variant="primary"
                >
                  Try Signup
                </Button>
              </div>

              {allPassed && tests.length > 0 && (
                <div
                  style={{
                    padding: "var(--space-md)",
                    backgroundColor: "#d1fae5",
                    border: "1px solid #6ee7b7",
                    borderRadius: "var(--radius-md)",
                    color: "#065f46",
                    textAlign: "center",
                  }}
                >
                  <strong>✓ All systems operational!</strong>
                  <div style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--space-xs)" }}>
                    Your authentication and Firestore setup is working correctly.
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="info-card reveal-up reveal-delay-1" variant="soft" title="What is this page?" subtitle="Diagnostics guide">
          <div style={{ fontSize: "var(--font-size-sm)", lineHeight: 1.6, color: "var(--color-text-secondary)" }}>
            <p>This page runs automated tests to verify your Firebase and Firestore setup:</p>
            <ul style={{ paddingLeft: "var(--space-lg)", marginTop: "var(--space-sm)" }}>
              <li>✓ Firebase environment variables</li>
              <li>✓ Firebase Auth initialization</li>
              <li>✓ Firestore connection</li>
              <li>✓ Collection structure and data</li>
              <li>✓ User seeding status</li>
            </ul>
            <p style={{ marginTop: "var(--space-md)" }}>
              Use this page to debug authentication and Firestore issues. Check the browser console for detailed logs.
            </p>
          </div>
        </Card>
      </section>
    </main>
  );
}
