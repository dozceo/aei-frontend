"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { routeGroups } from "@/app/routes";
import { backendPost } from "@/lib/backend-client";

const studentNav = routeGroups.student.map((r) => ({ label: r.label, href: r.path }));

export default function StudentQueriesPage() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await backendPost<{ text: string }>("/api/ai/student-infer", { prompt });
      setAnswer(res.text ?? JSON.stringify(res));
    } catch (e) {
      setAnswer(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleShell title="Ask & learn" subtitle="AI Q&A" eyebrow="Student" navItems={studentNav} activePath="/student/queries" brandLabel="SANKALP AEI">
      <Card title="Your question" subtitle="Routed via Express AI gateway" style={{ gridColumn: "span 12" }}>
        <Input label="Question" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask about today's topic…" />
        <Button variant="primary" onClick={() => void ask()} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? "Thinking…" : "Send"}
        </Button>
        {answer && <p className="section-copy mt-4 break-words">{answer}</p>}
      </Card>
    </RoleShell>
  );
}
