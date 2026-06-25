"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { StudentMindPortal } from "@/components/portals/student/StudentPortalPanels";
import { useParticipant } from "@/hooks/useParticipant";
import { studentNav } from "@/lib/role-nav";
import { predictForLearner } from "@/lib/intelligence/ml/index";
import { backendPost } from "@/lib/backend-client";

export default function StudentMindPage() {
  const { participant, loading, error, bookingId } = useParticipant();
  const [prediction, setPrediction] = useState<Record<string, unknown> | null>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    setPredicting(true);
    void predictForLearner(bookingId, {})
      .then((p) => setPrediction(p as unknown as Record<string, unknown>))
      .catch(() => setPrediction(null))
      .finally(() => setPredicting(false));
  }, [bookingId]);

  async function refreshViaBackend() {
    if (!bookingId) return;
    setPredicting(true);
    try {
      const res = await backendPost<{ prediction: Record<string, unknown> }>("/api/ml/predict", {
        learnerId: bookingId,
        features: {},
        featureSchemaVersion: 1,
      });
      setPrediction(res.prediction);
    } finally {
      setPredicting(false);
    }
  }

  return (
    <RoleShell title="Student Mind" subtitle="Brain map + ML insight" eyebrow="Student" navItems={studentNav} activePath="/student/mind" accent="aub">
      {!participant ? (
        <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
      ) : (
        <>
          <StudentMindPortal />
          <Card title="ML insight" subtitle={predicting ? "Loading…" : "Ensemble prediction"} style={{ gridColumn: "span 12" }}>
            <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 200, margin: 0 }}>{prediction ? JSON.stringify(prediction, null, 2) : "No prediction yet"}</pre>
            <Button variant="secondary" onClick={() => void refreshViaBackend()} style={{ marginTop: 12 }}>Refresh via backend cache</Button>
          </Card>
        </>
      )}
    </RoleShell>
  );
}
