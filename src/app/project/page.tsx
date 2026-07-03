import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from '@/components/design-system'

export default function ProjectPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col overflow-x-hidden px-4 py-6">
      <Card raised>
        <CardHeader>
          <CardTitle>Project workspace</CardTitle>
          <CardDescription>Supplementary tasks and event projects.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No active project"
            description="Project tasks appear when your school publishes an event workspace."
          />
        </CardContent>
      </Card>
    </main>
  )
}
