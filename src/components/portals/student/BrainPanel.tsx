'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  SegmentedControl,
  Textarea,
  Button,
} from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'
import { useSession } from '@/hooks/useSession'
import { Brain, Map, Sparkles } from 'lucide-react'

type BrainTab = 'map' | 'planner' | 'dump' | 'aeivo'

const TAB_OPTIONS = [
  { value: 'map' as const, label: 'Map' },
  { value: 'planner' as const, label: 'Planner' },
  { value: 'dump' as const, label: 'Dump' },
  { value: 'aeivo' as const, label: 'AEIVO' },
]

export function BrainPanel() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<BrainTab>('map')
  const [dumpText, setDumpText] = useState('')
  const [aeivoPrompt, setAeivoPrompt] = useState('')
  const [aeivoReply, setAeivoReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const studentId = session?.user?.bookingId ?? session?.user?.uid

  async function submitDump() {
    if (!studentId || !dumpText.trim()) return
    setLoading(true)
    try {
      await backendFetch(`/api/students/${studentId}/dumps`, {
        method: 'POST',
        body: JSON.stringify({ content: dumpText.trim() }),
      })
      setDumpText('')
    } finally {
      setLoading(false)
    }
  }

  async function askAeivo() {
    if (!studentId || !aeivoPrompt.trim()) return
    setLoading(true)
    try {
      const result = await backendFetch<{ answer?: string }>('/api/ai/infer', {
        method: 'POST',
        body: JSON.stringify({ mode: 'chat', prompt: aeivoPrompt.trim(), bookingId: studentId }),
      })
      setAeivoReply(result.answer ?? 'No response yet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SegmentedControl
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        aria-label="Brain sections"
      />

      {tab === 'map' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-[var(--primary)]" />
              Brain map
            </CardTitle>
            <CardDescription>Topic mastery visualization loads from your recent attempts.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Map loading soon"
              description="Connect attempts and recall sessions to populate your mastery map."
            />
          </CardContent>
        </Card>
      )}

      {tab === 'planner' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[var(--primary)]" />
              Daily planner
            </CardTitle>
            <CardDescription>Your ANPS-ranked plan for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No plan yet"
              description="Complete the Sankalp Loop to generate today's planner."
            />
          </CardContent>
        </Card>
      )}

      {tab === 'dump' && (
        <Card>
          <CardHeader>
            <CardTitle>Memory dump</CardTitle>
            <CardDescription>Write freely — we&rsquo;ll classify and store it securely.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={dumpText}
              onChange={(e) => setDumpText(e.target.value)}
              placeholder="What do you remember about today's topics?"
              rows={5}
            />
            <Button className="w-full" loading={loading} onClick={submitDump}>
              Save dump
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'aeivo' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--primary)]" />
              AEIVO companion
            </CardTitle>
            <CardDescription>Ask questions about your current chapter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={aeivoPrompt}
              onChange={(e) => setAeivoPrompt(e.target.value)}
              placeholder="Ask AEIVO anything..."
              rows={3}
            />
            <Button className="w-full" loading={loading} onClick={askAeivo}>
              Ask AEIVO
            </Button>
            {aeivoReply ? (
              <div className="surface-sunken rounded-[var(--radius-md)] p-3 text-sm text-[var(--ink)]">
                {aeivoReply}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
