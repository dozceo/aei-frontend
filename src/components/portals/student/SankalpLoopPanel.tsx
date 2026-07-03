'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  useToast,
} from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'
import { useSession } from '@/hooks/useSession'
import { CheckCircle2, Circle } from 'lucide-react'

const LOOP_STEPS = [
  { id: 'recall', title: 'Recall', description: 'Quick retrieval practice for today\'s topics.' },
  { id: 'plan', title: 'Plan', description: 'Review and confirm your study plan.' },
  { id: 'map', title: 'Map', description: 'Check your brain map progress.' },
  { id: 'dump', title: 'Dump', description: 'Capture what you remember freely.' },
  { id: 'ai-qs', title: 'AI Questions', description: 'Answer AI-generated check questions.' },
  { id: 'ai-plan', title: '2-Day Plan', description: 'Get a short AI study plan.' },
  { id: 'finish', title: 'Finish', description: 'Submit attendance and complete the loop.' },
] as const

interface LoopProgress {
  currentStep: number
  completedSteps: string[]
}

export function SankalpLoopPanel() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [progress, setProgress] = useState<LoopProgress>({ currentStep: 0, completedSteps: [] })
  const [submitting, setSubmitting] = useState(false)

  const step = LOOP_STEPS[progress.currentStep]
  const percent = Math.round(((progress.currentStep + 1) / LOOP_STEPS.length) * 100)
  const studentId = session?.user?.bookingId ?? session?.user?.uid

  async function completeStep() {
    if (!studentId) {
      toast({ title: 'Sign in required', description: 'Complete login before starting the loop.', variant: 'error' })
      return
    }

    setSubmitting(true)
    try {
      await backendFetch(`/api/students/${studentId}/loop/step`, {
        method: 'POST',
        body: JSON.stringify({ step: step.id, index: progress.currentStep }),
      })

      const completedSteps = [...progress.completedSteps, step.id]
      const nextStep = Math.min(progress.currentStep + 1, LOOP_STEPS.length - 1)
      setProgress({ currentStep: nextStep, completedSteps })

      if (step.id === 'finish') {
        toast({ title: 'Loop complete', description: 'Attendance recorded. Great work today!', variant: 'success' })
      }
    } catch (error) {
      toast({
        title: 'Could not save step',
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card raised className="animate-rise overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Sankalp Loop</CardTitle>
          <Badge variant="secondary">{progress.currentStep + 1} / {LOOP_STEPS.length}</Badge>
        </div>
        <CardDescription>Seven guided steps to close your learning loop for today.</CardDescription>
        <Progress value={percent} className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {LOOP_STEPS.map((item, index) => {
            const done = progress.completedSteps.includes(item.id)
            const active = index === progress.currentStep
            return (
              <div
                key={item.id}
                className={`flex items-start gap-3 rounded-[var(--radius-md)] border px-3 py-2 ${
                  active ? 'border-[var(--primary)] bg-[var(--primary-muted)]' : 'border-[var(--border)]'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sage)]" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ink-subtle)]" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)]">{item.title}</p>
                  {active ? (
                    <p className="text-xs text-[var(--ink-muted)]">{item.description}</p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        <Button className="w-full" loading={submitting} onClick={completeStep}>
          {step.id === 'finish' ? 'Complete loop' : `Continue: ${step.title}`}
        </Button>
      </CardContent>
    </Card>
  )
}
