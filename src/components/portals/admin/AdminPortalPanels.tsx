"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { Badge, Button, Card, Progress } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { useSchool } from "@/components/providers/SchoolProvider";
import { backendPost } from "@/lib/backend-client";
import { db } from "@/lib/firebase-client";
import { fetchParticipantsPage } from "@/lib/intelligence/academic/participants-query";
import { setActiveSchool } from "@/lib/intelligence/cache/participants-cache";

export function AdminEwsPortal() {
  const { activeSchoolId } = useSchool();
  const [classes, setClasses] = useState<Array<{ id: string; name?: string }>>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [cohort, setCohort] = useState<Record<string, unknown> | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    void getDocs(collection(db, "classes")).then((snap) => {
      setClasses(snap.docs.map((d) => ({ id: d.id, name: d.data().name as string | undefined })));
    });
  }, []);

  useEffect(() => {
    if (!selectedClass || !db) return;
    void getDoc(doc(db, "teacher_cohort", selectedClass)).then((snap) => {
      setCohort(snap.exists() ? snap.data() : null);
    });
  }, [selectedClass]);

  async function queuePublish() {
    if (!selectedClass) return;
    setPublishing(true);
    setMessage(null);
    try {
      await backendPost("/api/cohort/publish", {
        schoolId: activeSchoolId ?? "zero2dev",
        classId: selectedClass,
        subjectId: "default",
      });
      setMessage("Cohort publish queued.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  const risk = cohort?.risk as Record<string, number> | undefined;

  return (
    <GridCell span={12}>
    <Card title="Early Warning System" subtitle="Cohort risk snapshots" accent="coral">
      <div className="chip-row" style={{ marginBottom: 16 }}>
        <select
          className="nm-inset"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44, minWidth: 0, flex: "1 1 200px" }}
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
          ))}
        </select>
        <Button variant="secondary" loading={publishing} onClick={() => void queuePublish()}>Queue recompute</Button>
        {message ? <Badge tone="sky">{message}</Badge> : null}
      </div>
      {cohort ? (
        <div className="card-grid-3">
          <StatTile label="Critical" value={risk?.tier1_critical ?? 0} tone="coral" />
          <StatTile label="At risk" value={risk?.tier2_at_risk ?? 0} tone="honey" />
          <StatTile label="Monitor" value={risk?.tier3_monitoring ?? 0} tone="sky" />
        </div>
      ) : (
        <p className="muted">Select a class to load published EWS snapshot from teacher_cohort.</p>
      )}
    </Card>
    </GridCell>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: "coral" | "honey" | "sky" }) {
  return (
    <div className="nm-surface" style={{ padding: 16, borderRadius: "var(--radius-lg)" }}>
      <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      <div className="stat-value" style={{ color: `var(--${tone}-deep)`, marginTop: 8 }}>{value}</div>
    </div>
  );
}

export function AdminRosterPortal() {
  const { activeSchoolId } = useSchool();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setActiveSchool(activeSchoolId ?? "zero2dev");
    setLoading(true);
    void fetchParticipantsPage({ schoolId: activeSchoolId ?? "zero2dev" })
      .then(({ rows: data }) => setRows(data))
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return String(r.name ?? "").toLowerCase().includes(q) || String(r.bookingId ?? r.id ?? "").toLowerCase().includes(q);
  });

  return (
    <GridCell span={12}>
    <Card title="Participant roster" subtitle={`${filtered.length} students`} accent="sage">
      <input
        className="nm-inset"
        placeholder="Search by name or booking ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", maxWidth: "100%", padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44, marginBottom: 16, boxSizing: "border-box" }}
      />
      {loading ? <p className="muted">Loading…</p> : (
        <div className="table-wrap">
          <table className="table-stack">
            <thead>
              <tr style={{ color: "var(--color-text-secondary)" }}>
                <th>Name</th>
                <th>Booking</th>
                <th>Division</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={String(r.id)}>
                  <td data-label="Name">{String(r.name ?? "—")}</td>
                  <td data-label="Booking" className="nums">{String(r.bookingId ?? r.id)}</td>
                  <td data-label="Division">{String(r.divisionId ?? r.classId ?? "—")}</td>
                  <td data-label="Percentile" className="nums">{String(r.percentile ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
    </GridCell>
  );
}

export function AdminAttendancePortal() {
  const { activeSchoolId } = useSchool();
  const [divisionId, setDivisionId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [presentIds, setPresentIds] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<{ id: string; name?: string }>>([]);
  const [saving, setSaving] = useState(false);
  const registerId = `${activeSchoolId ?? "zero2dev"}__${divisionId}__${date}`;

  useEffect(() => {
    if (!divisionId) return;
    setActiveSchool(activeSchoolId ?? "zero2dev");
    void fetchParticipantsPage({ schoolId: activeSchoolId ?? "zero2dev", divisionId }).then(({ rows: data }) => {
      setRows(data.map((r) => ({ id: String(r.bookingId ?? r.id), name: (r as { name?: string }).name })));
    });
  }, [activeSchoolId, divisionId]);

  useEffect(() => {
    if (!db || !divisionId) return;
    void getDoc(doc(db, "attendance_days", registerId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPresentIds((data.presentIds as string[]) ?? []);
      }
    });
  }, [registerId, divisionId]);

  function toggle(id: string) {
    setPresentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveRegister() {
    if (!db) return;
    setSaving(true);
    try {
      const absentIds = rows.filter((r) => !presentIds.includes(r.id)).map((r) => r.id);
      await setDoc(doc(db, "attendance_days", registerId), {
        schoolId: activeSchoolId ?? "zero2dev",
        divisionId,
        date,
        presentIds,
        absentIds,
        status: "draft",
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await backendPost("/api/academic/attendance/submit", { registerId, presentIds, absentIds }).catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  const rate = rows.length ? Math.round((presentIds.length / rows.length) * 100) : 0;

  return (
    <GridCell span={12}>
    <Card title="Attendance register" subtitle={registerId} accent="sky">
      <div className="chip-row" style={{ marginBottom: 16 }}>
        <input className="nm-inset" placeholder="Division ID" value={divisionId} onChange={(e) => setDivisionId(e.target.value)} style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }} />
        <input className="nm-inset" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }} />
        <Badge tone="sage" dot>{presentIds.length}/{rows.length} present</Badge>
      </div>
      {rows.length > 0 ? <Progress label="Attendance rate" value={rate} tone="sage" /> : null}
      <ul className="list-clean" style={{ marginTop: 16 }}>
        {rows.map((r) => (
          <li key={r.id} className="nm-inset" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "10px 14px", borderRadius: "var(--radius-md)", minHeight: 44 }}>
            <span style={{ overflowWrap: "anywhere", minWidth: 0 }}>{r.name ?? r.id}</span>
            <Button variant={presentIds.includes(r.id) ? "primary" : "ghost"} size="sm" onClick={() => toggle(r.id)}>
              {presentIds.includes(r.id) ? "Present" : "Absent"}
            </Button>
          </li>
        ))}
      </ul>
      {rows.length > 0 ? (
        <Button variant="primary" loading={saving} onClick={() => void saveRegister()} style={{ marginTop: 16 }}>Save register</Button>
      ) : null}
    </Card>
    </GridCell>
  );
}
