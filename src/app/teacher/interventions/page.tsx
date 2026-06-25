"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { routeGroups } from "@/app/routes";
import { backendGet, backendPost } from "@/lib/backend-client";
import { getSeverityTone } from "@/lib/tone-utils";

const teacherNav = routeGroups.teacher.map((r) => ({ label: r.label, href: r.path }));

interface InterventionAlert {
  id: string;
  studentId?: string;
  severity?: string;
  triggerType?: string;
}

export default function TeacherInterventionsPage() {
  const [alerts, setAlerts] = useState<InterventionAlert[]>([]);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadAlerts(id: string) {
    if (!id) return;
    try {
      const data = await backendGet<InterventionAlert[]>(`/api/interventions/student/${id}`);
      setAlerts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load interventions");
    }
  }

  useEffect(() => {
    if (studentId) void loadAlerts(studentId);
  }, [studentId]);

  async function resolveAlert(alertId: string) {
    await backendPost(`/api/interventions/${alertId}/resolve`, {
      action: "reviewed",
      teacherNotes: "Resolved from Next teacher portal",
    });
    if (studentId) void loadAlerts(studentId);
  }

  return (
    <RoleShell title="Interventions" subtitle="Express /api/interventions" navItems={teacherNav} activePath="/teacher/interventions" brandLabel="SANKALP AEI">
      <Card title="Load student alerts" style={{ gridColumn: "span 12" }}>
        <input
          className="nm-input min-h-[44px] w-full max-w-md"
          placeholder="Student booking ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
        {error && <p className="section-copy text-red-600 mt-2">{error}</p>}
      </Card>
      <Card title="Queue" style={{ gridColumn: "span 12" }}>
        <ul className="list-clean" style={{ display: "grid", gap: 10 }}>
          {alerts.map((item) => (
            <li key={item.id} className="nm-surface-soft p-3 rounded-lg flex flex-wrap justify-between gap-2 items-center">
              <div>
                <strong>{item.studentId ?? item.id}</strong>
                <p className="section-copy">{item.triggerType}</p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge tone={getSeverityTone((item.severity ?? "medium").toLowerCase() as "low" | "medium" | "high" | "critical")}>{item.severity ?? "—"}</Badge>
                <Button variant="primary" size="sm" onClick={() => void resolveAlert(item.id)}>Resolve</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </RoleShell>
  );
}
