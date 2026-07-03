import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function AdminExamsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exams</CardTitle>
        <CardDescription>Exam schedules, results, and exports.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="No exams configured" description="Create exam sessions from settings." />
      </CardContent>
    </Card>
  )
}
