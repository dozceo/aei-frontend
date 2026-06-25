"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Badge, Card, Progress } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { db } from "@/lib/firebase-client";
import { fetchParticipantsPage } from "@/lib/intelligence/academic/participants-query";
import { setActiveSchool } from "@/lib/intelligence/cache/participants-cache";
import { useClassPredictions } from "@/lib/intelligence/ml/useClassPredictions";
import { categoryLabel } from "@/lib/intelligence/ml/decision-engine";
import type { LearnerPrediction } from "@/lib/intelligence/ml/types";

interface ParticipantRow {
  id: string;
  bookingId: string;
  name?: string;
  divisionId?: string;
  classId?: string;
  percentile?: number;
}

export function TeacherStudentsPortal() {
  const { activeSchoolId } = useSchool();
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classId, setClassId] = useState("");

  useEffect(() => {
    setActiveSchool(activeSchoolId ?? "zero2dev");
  }, [activeSchoolId]);

  useEffect(() => {
    setLoading(true);
    void fetchParticipantsPage({ schoolId: activeSchoolId ?? "zero2dev", divisionId: classId || undefined })
      .then(({ rows: data }) => setRows(data as ParticipantRow[]))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeSchoolId, classId]);

  const learners = useMemo(
    () => rows.map((r) => ({ learnerId: r.bookingId || r.id, input: { percentile: r.percentile ?? 0 } })),
    [rows],
  );
  const { predictions, summary, loading: mlLoading } = useClassPredictions(learners, { enabled: rows.length > 0 }) as {
    predictions: LearnerPrediction[];
    summary: { tierCounts?: { critical: number; at_risk: number; on_track: number } } | null;
    loading: boolean;
  };

  const predById = useMemo(() => {
    const map = new Map<string, (typeof predictions)[0]>();
    predictions.forEach((p) => map.set(p.learnerId, p));
    return map;
  }, [predictions]);

  if (loading) {
    return (
      <GridCell span={12}>
        <Card title="Loading roster…" subtitle="participants collection"><p className="muted">Fetching students…</p></Card>
      </GridCell>
    );
  }
  if (error) {
    return (
      <GridCell span={12}>
        <Card title="Roster error" subtitle={error}><p className="section-copy">{error}</p></Card>
      </GridCell>
    );
  }

  return (
    <GridCell span={12}>
      <Card title="Class roster" subtitle={`${rows.length} students · ${activeSchoolId ?? "zero2dev"}`} accent="sky">
        <div className="chip-row" style={{ marginBottom: 16 }}>
          <input
            className="nm-inset"
            placeholder="Filter by division ID (optional)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            style={{ flex: "1 1 200px", minWidth: 0, padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }}
          />
          {summary ? (
            <>
              <Badge tone="coral" dot>{summary.tierCounts?.critical ?? 0} critical</Badge>
              <Badge tone="honey" dot>{summary.tierCounts?.at_risk ?? 0} at risk</Badge>
              <Badge tone="sage" dot>{summary.tierCounts?.on_track ?? 0} on track</Badge>
            </>
          ) : null}
          {mlLoading ? <Badge tone="neutral">ML scoring…</Badge> : null}
        </div>
        <div className="table-wrap">
          <table className="table-stack">
            <thead>
              <tr style={{ color: "var(--color-text-secondary)" }}>
                <th>Student</th>
                <th>Division</th>
                <th>Percentile</th>
                <th>ML signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pred = predById.get(row.bookingId || row.id);
                const signal = pred?.decision?.category;
                return (
                  <tr key={row.id} className="nm-inset">
                    <td data-label="Student" style={{ fontWeight: 600 }}>{row.name ?? row.bookingId}</td>
                    <td data-label="Division" className="nums">{row.divisionId ?? row.classId ?? "—"}</td>
                    <td data-label="Percentile" className="nums">{row.percentile ?? "—"}</td>
                    <td data-label="ML signal">
                      {signal ? <Badge tone={signal === "urgent_review" ? "coral" : signal === "continuation" ? "sage" : "honey"}>{categoryLabel(signal)}</Badge> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </GridCell>
  );
}

export function TeacherHeatmapPortal() {
  const { activeSchoolId } = useSchool();
  const [classId, setClassId] = useState("");
  const [cohort, setCohort] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId || !db) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "teacher_cohort", classId), (snap) => {
      setCohort(snap.exists() ? snap.data() : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [classId]);

  const topics = cohort?.topics as Record<string, { label?: string; avg?: number }> | undefined;

  return (
    <GridCell span={12}>
      <Card title="Chapter heatmap" subtitle="Published teacher_cohort snapshot" accent="honey">
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <input
            className="nm-inset"
            placeholder="Enter class/division ID (e.g. div-a)"
            value={classId}
            onChange={(e) => setClassId(e.target.value.trim())}
            style={{ width: "100%", maxWidth: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44, boxSizing: "border-box" }}
          />
          <p className="section-copy">School: {activeSchoolId ?? "zero2dev"}. Load a published cohort doc to see topic mastery averages.</p>
        </div>
        {loading ? <p className="muted">Loading cohort…</p> : null}
        {!loading && classId && !cohort ? <p className="muted">No published cohort at teacher_cohort/{classId}</p> : null}
        {topics ? (
          <div style={{ display: "grid", gap: 12 }}>
            {Object.entries(topics).map(([tid, t]) => (
              <div key={tid} style={{ minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <strong style={{ overflowWrap: "anywhere" }}>{t.label ?? tid}</strong>
                  <span className="nums">{typeof t.avg === "number" ? `${Math.round(t.avg * 100)}%` : "—"}</span>
                </div>
                <Progress value={typeof t.avg === "number" ? t.avg * 100 : 0} tone="honey" />
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </GridCell>
  );
}
