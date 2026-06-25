"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/design-system";
import { DatabaseState } from "@/components/layout/DatabaseState";
import { RoleShell } from "@/components/layout/RoleShell";
import { useParticipant } from "@/hooks/useParticipant";
import { routeGroups } from "@/app/routes";
import { predictForLearner } from "@/lib/intelligence/ml/index";
import type { LearnerPrediction } from "@/lib/intelligence/ml/types";

const studentNav = routeGroups.student.map((r) => ({ label: r.label, href: r.path }));

export default function StudentInsightsPage() {
  const { participant, loading, error, bookingId } = useParticipant();
  const [prediction, setPrediction] = useState<LearnerPrediction | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    void predictForLearner(bookingId, {}).then(setPrediction);
  }, [bookingId]);

  return (
    <RoleShell title="Insights" subtitle="ML decision engine" navItems={studentNav} activePath="/student/insights" brandLabel="SANKALP AEI">
      {!participant ? (
        <DatabaseState loading={loading} error={error} pathHint={`participants/${bookingId}`} />
      ) : (
        <Card title={prediction?.decision.category ?? "Analyzing…"} subtitle="Module 106 → 107" style={{ gridColumn: "span 12" }}>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {(prediction?.decision.reasoning ?? []).map((r) => (
              <li key={r} className="section-copy">{r}</li>
            ))}
          </ul>
        </Card>
      )}
    </RoleShell>
  );
}
