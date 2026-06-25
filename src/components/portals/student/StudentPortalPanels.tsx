"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { Badge, Button, Card } from "@/components/design-system";
import { GridCell } from "@/components/layout/GridCell";
import { db } from "@/lib/firebase-client";
import { useParticipant } from "@/hooks/useParticipant";

const STEPS = [
  "Energy check-in",
  "Plan quiz",
  "Recall session",
  "Brain dump",
  "Resource study",
  "Loop attendance",
  "Reflection",
];

export function SankalpLoopPortal() {
  const { participant, bookingId } = useParticipant();
  const [step, setStep] = useState(0);
  const [recallNotes, setRecallNotes] = useState("");
  const [dumpText, setDumpText] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function markAttendance() {
    if (!db || !bookingId) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await updateDoc(doc(db, "participants", bookingId), {
        [`loopAttendance.${today}`]: true,
      });
      setDone(true);
    } finally {
      setSaving(false);
    }
  }

  async function saveDump() {
    if (!db || !bookingId || !dumpText.trim()) return;
    setSaving(true);
    try {
      const id = `dump-${Date.now()}`;
      await setDoc(doc(db, "student_dumps", bookingId, "dumps", id), {
        text: dumpText.trim(),
        createdAt: new Date().toISOString(),
      });
      setDumpText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <GridCell span={8} index={0}>
        <Card title="Sankalp Loop" subtitle={`Step ${step + 1} of ${STEPS.length}`} accent="sky">
          <ol className="step-list" aria-label="Loop steps">
            {STEPS.map((label, i) => (
              <li
                key={label}
                className={`step-list-item${i === step ? " active" : i < step ? " done" : ""}`}
              >
                <Badge tone={i === step ? "sky" : i < step ? "sage" : "neutral"} dot={i === step}>
                  {i + 1}
                </Badge>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          <h3 style={{ margin: "0 0 12px" }}>{STEPS[step]}</h3>
          {step === 2 ? (
            <textarea
              className="nm-inset"
              value={recallNotes}
              onChange={(e) => setRecallNotes(e.target.value)}
              placeholder="What do you remember from today's topic?"
              rows={4}
              style={{ width: "100%", maxWidth: "100%", padding: 12, borderRadius: "var(--radius-md)", marginBottom: 12, boxSizing: "border-box" }}
            />
          ) : null}
          {step === 3 ? (
            <textarea
              className="nm-inset"
              value={dumpText}
              onChange={(e) => setDumpText(e.target.value)}
              placeholder="Brain dump — write everything you know…"
              rows={5}
              style={{ width: "100%", maxWidth: "100%", padding: 12, borderRadius: "var(--radius-md)", marginBottom: 12, boxSizing: "border-box" }}
            />
          ) : null}
          {step === 5 ? (
            <p className="section-copy">Mark today's loop attendance for {participant?.name ?? bookingId}.</p>
          ) : null}
          {step === 6 ? (
            <p className="section-copy">{done ? "Loop complete — great work today!" : "Reflect on what clicked and what to revisit tomorrow."}</p>
          ) : null}
          <div className="chip-row">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
            {step === 3 ? (
              <Button variant="secondary" loading={saving} onClick={() => void saveDump()}>Save dump</Button>
            ) : null}
            {step === 5 ? (
              <Button variant="primary" loading={saving} onClick={() => void markAttendance()}>Mark attendance</Button>
            ) : step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button variant="primary" onClick={() => setStep(0)}>Restart loop</Button>
            )}
          </div>
        </Card>
      </GridCell>
      <GridCell span={4} index={1}>
        <Card title="Progress" subtitle={participant?.name ?? bookingId ?? "—"}>
          <Badge tone="success">Level {participant?.level ?? 1}</Badge>
          <p className="section-copy" style={{ marginTop: 12 }}>XP: <span className="nums">{participant?.xp ?? 0}</span></p>
          <p className="section-copy">Streak: <span className="nums">{participant?.streak ?? 0}</span> days</p>
        </Card>
      </GridCell>
    </>
  );
}

export function StudentMindPortal() {
  const { participant, bookingId } = useParticipant();
  const [sessions, setSessions] = useState<Array<{ id: string; hasData: boolean }>>([]);
  const [dumps, setDumps] = useState<Array<{ id: string; text?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !bookingId) return;
    void (async () => {
      setLoading(true);
      try {
        const recallSnap = await getDocs(collection(db, "participants", bookingId, "recall"));
        setSessions(recallSnap.docs.map((d) => ({ id: d.id, hasData: Object.keys(d.data()).length > 0 })));
        const dumpSnap = await getDocs(collection(db, "student_dumps", bookingId, "dumps"));
        setDumps(dumpSnap.docs.map((d) => ({ id: d.id, text: d.data().text as string | undefined })));
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  return (
    <>
      <GridCell span={7} index={0}>
        <Card title="Brain map" subtitle="Recall sessions + dumps" accent="aub">
          {loading ? <p className="muted">Loading brain map data…</p> : (
            <>
              <p className="section-copy" style={{ marginBottom: 12 }}>
                {sessions.length} recall session(s), {dumps.length} brain dump(s) for {participant?.name ?? bookingId}.
              </p>
              <ul className="list-clean">
                {sessions.map((s) => (
                  <li key={s.id} className="nm-inset" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ overflowWrap: "anywhere" }}>Session {s.id}</span>
                    <Badge tone={s.hasData ? "sage" : "neutral"} dot>{s.hasData ? "Active" : "Empty"}</Badge>
                  </li>
                ))}
                {sessions.length === 0 ? <li className="muted">No recall sessions yet — complete the loop first.</li> : null}
              </ul>
            </>
          )}
        </Card>
      </GridCell>
      <GridCell span={5} index={1}>
        <Card title="Brain dumps" subtitle="Latest captures">
          {dumps.length === 0 ? <p className="muted">No dumps yet.</p> : (
            <ul className="list-clean">
              {dumps.slice(0, 5).map((d) => (
                <li key={d.id} className="nm-inset" style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", fontSize: 13, overflowWrap: "anywhere" }}>
                  {(d.text ?? "").slice(0, 120)}{(d.text && d.text.length > 120 ? "…" : "")}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </GridCell>
    </>
  );
}
