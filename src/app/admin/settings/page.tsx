import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>School configuration, allowlists, and integrations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[var(--ink-muted)]">
        <p>API base: {process.env.NEXT_PUBLIC_API_BASE_URL ?? 'not configured'}</p>
        <p>Firebase project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'not configured'}</p>
      </CardContent>
    </Card>
  )
}
