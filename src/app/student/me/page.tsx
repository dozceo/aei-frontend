'use client'

import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/design-system'
import { useAuthUser } from '@/hooks/useAuthUser'
import { useSession } from '@/hooks/useSession'
import { getFirebaseAuth } from '@/lib/firebase-client'
import { backendFetch } from '@/lib/backend-client'
import { AUTH_COOKIE, ROLE_COOKIE, clearClientAuthCookie } from '@/lib/auth'

export default function StudentMePage() {
  const { user } = useAuthUser()
  const { data: session } = useSession()
  const router = useRouter()

  async function handleSignOut() {
    try {
      await backendFetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue local sign-out even if BFF is down.
    }
    clearClientAuthCookie(AUTH_COOKIE)
    clearClientAuthCookie(ROLE_COOKIE)
    await signOut(getFirebaseAuth())
    router.replace('/login?role=student')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Me</CardTitle>
        <CardDescription>Profile and account settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-[var(--ink-muted)]">Email</dt>
            <dd className="font-medium text-[var(--ink)]">{user?.email ?? session?.user?.email ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Role</dt>
            <dd className="font-medium text-[var(--ink)]">{session?.user?.role ?? 'STUDENT'}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-muted)]">Booking ID</dt>
            <dd className="font-medium text-[var(--ink)]">{session?.user?.bookingId ?? '—'}</dd>
          </div>
        </dl>
        <Button variant="secondary" className="w-full" onClick={handleSignOut}>
          Sign out
        </Button>
      </CardContent>
    </Card>
  )
}
