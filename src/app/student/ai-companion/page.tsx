"use client";

import { useState } from "react";
import { Button, Card } from "@/components/design-system";
import { RoleShell } from "@/components/layout/RoleShell";
import { routeGroups } from "@/app/routes";
import { backendPost } from "@/lib/backend-client";

const studentNav = routeGroups.student.map((r) => ({ label: r.label, href: r.path }));

export default function StudentAiCompanionPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!prompt.trim()) return;
    const userMsg = { role: "user", content: prompt };
    setMessages((m) => [...m, userMsg]);
    setPrompt("");
    setLoading(true);
    try {
      const res = await backendPost<{ text?: string; error?: string }>("/api/ai/student-infer", { prompt: userMsg.content });
      setMessages((m) => [...m, { role: "assistant", content: res.text ?? res.error ?? JSON.stringify(res) }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: e instanceof Error ? e.message : "Failed" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleShell title="AI companion" subtitle="Student-safe gateway" navItems={studentNav} activePath="/student/ai-companion" brandLabel="SANKALP AEI">
      <Card title="Conversation" style={{ gridColumn: "span 12" }}>
        <div className="grid gap-2 mb-4 max-h-96 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-lg ${m.role === "assistant" ? "nm-surface-soft" : "nm-surface"}`}>
              {m.content}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="nm-input flex-1 min-h-[44px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask the AI companion…"
            onKeyDown={(e) => e.key === "Enter" && void send()}
          />
          <Button variant="primary" onClick={() => void send()} disabled={loading} className="min-h-[44px]">
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </Card>
    </RoleShell>
  );
}
