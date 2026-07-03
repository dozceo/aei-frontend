import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function AdminQueriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Queries</CardTitle>
        <CardDescription>Student doubt queue with AI-assisted answers.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState title="Inbox empty" description="Student queries appear here for review." />
      </CardContent>
    </Card>
  )
}
