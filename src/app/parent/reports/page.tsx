import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function ParentReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Downloadable progress and attendance reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          title="No reports yet"
          description="Reports are generated weekly once your child completes learning loops."
        />
      </CardContent>
    </Card>
  )
}
