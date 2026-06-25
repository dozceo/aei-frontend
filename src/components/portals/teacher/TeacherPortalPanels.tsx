"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Badge, Card, Progress } from "@/components/design-system";
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

  if (loading) return <Card title="Loading roster…" subtitle="participants collection" style={{ gridColumn: "span 12" }}><p className="muted">Fetching students…</p></Card>;
  if (error) return <Card title="Roster error" subtitle={error} style={{ gridColumn: "span 12" }}><p className="section-copy">{error}</p></Card>;

  return (
    <>
      <Card title="Class roster" subtitle={`${rows.length} students · ${activeSchoolId ?? "zero2dev"}`} accent="sky" style={{ gridColumn: "span 12" }}>
        <div className="chip-row" style={{ marginBottom: 16 }}>
          <input
            className="nm-inset"
            placeholder="Filter by division ID (optional)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            style={{ flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }}
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
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--color-text-secondary)" }}>
                <th style={{ padding: "10px 8px" }}>Student</th>
                <th style={{ padding: "10px 8px" }}>Division</th>
                <th style={{ padding: "10px 8px" }}>Percentile</th>
                <th style={{ padding: "10px 8px" }}>ML signal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const pred = predById.get(row.bookingId || row.id);
                const signal = pred?.decision?.category;
                return (
                  <tr key={row.id} className="nm-inset" style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 600 }}>{row.name ?? row.bookingId}</td>
                    <td style={{ padding: "12px 8px" }} className="nums">{row.divisionId ?? row.classId ?? "—"}</td>
                    <td style={{ padding: "12px 8px" }} className="nums">{row.percentile ?? "—"}</td>
                    <td style={{ padding: "12px 8px" }}>
                      {signal ? <Badge tone={signal === "urgent_review" ? "coral" : signal === "continuation" ? "sage" : "honey"}>{categoryLabel(signal)}</Badge> : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
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
    <Card title="Chapter heatmap" subtitle="Published teacher_cohort snapshot" accent="honey" style={{ gridColumn: "span 12" }}>
      <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
        <input
          className="nm-inset"
          placeholder="Enter class/division ID (e.g. div-a)"
          value={classId}
          onChange={(e) => setClassId(e.target.value.trim())}
          style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }}
        />
        <p className="section-copy">School: {activeSchoolId ?? "zero2dev"}. Load a published cohort doc to see topic mastery averages.</p>
      </div>
      {loading ? <p className="muted">Loading cohort…</p> : null}
      {!loading && classId && !cohort ? <p className="muted">No published cohort at teacher_cohort/{classId}</p> : null}
      {topics ? (
        <div style={{ display: "grid", gap: 12 }}>
          {Object.entries(topics).map(([tid, t]) => (
            <div key={tid}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <strong>{t.label ?? tid}</strong>
                <span className="nums">{typeof t.avg === "number" ? `${Math.round(t.avg * 100)}%` : "—"}</span>
              </div>
              <Progress value={typeof t.avg === "number" ? t.avg * 100 : 0} tone="honey" />
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
