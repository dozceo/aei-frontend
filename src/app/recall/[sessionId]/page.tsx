'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function RecallSessionPage() {
  const params = useParams()
  const sessionId = String(params.sessionId ?? '')

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg overflow-x-hidden px-4 py-6">
      <Card raised>
        <CardHeader>
          <CardTitle>Recall session</CardTitle>
          <CardDescription>Session ID: {sessionId}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="Session loading"
            description="Recall questions load from BFF once the session is published."
          />
        </CardContent>
      </Card>
    </main>
  )
}
