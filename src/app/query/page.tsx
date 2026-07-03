'use client'

import { FormEvent, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from '@/components/design-system'
import { backendFetch } from '@/lib/backend-client'
import { useSession } from '@/hooks/useSession'

export default function QueryPage() {
  const { data: session } = useSession()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!question.trim()) return
    setLoading(true)
    try {
      const result = await backendFetch<{ answer?: string }>('/api/queries', {
        method: 'POST',
        body: JSON.stringify({
          question: question.trim(),
          bookingId: session?.user?.bookingId,
        }),
      })
      setAnswer(result.answer ?? 'Your question was submitted. Check back for an answer.')
      setQuestion('')
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : 'Could not submit query.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col overflow-x-hidden px-4 py-6">
      <Card raised>
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
          <CardDescription>Submit a doubt to your teacher with optional AI assistance.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are you stuck on?"
              rows={4}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Submit query
            </Button>
          </form>
          {answer ? (
            <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] p-3 text-sm text-[var(--ink)]">
              {answer}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
