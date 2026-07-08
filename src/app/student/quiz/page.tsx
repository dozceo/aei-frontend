import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function StudentQuizPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz</CardTitle>
        <CardDescription>Today&rsquo;s recall and practice questions.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          title="No quiz loaded"
          description="Complete the Sankalp Loop recall step or wait for today's topic to be published."
        />
      </CardContent>
    </Card>
  )
}
