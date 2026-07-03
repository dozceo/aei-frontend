import { Suspense } from 'react'
import LoginPage from './LoginPageClient'

export default function LoginRoute() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg p-8 text-center text-sm text-[var(--ink-muted)]">Loading…</div>}>
      <LoginPage />
    </Suspense>
  )
}
