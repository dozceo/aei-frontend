'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '@/components/design-system'
import { getFirebaseAuth, googleProvider } from '@/lib/firebase-client'
import { backendFetch } from '@/lib/backend-client'
import { AUTH_COOKIE, ROLE_COOKIE, getRoleHome, normalizeRole } from '@/lib/auth'
import type { AppRole } from '@/types/app'

function setClientCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${604800}; SameSite=Lax`
}

export default function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AppRole>(
    normalizeRole(searchParams.get('role')) ?? 'STUDENT'
  )
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = searchParams.get('redirect') ?? getRoleHome(role)

  async function establishSession(idToken: string) {
    const result = await backendFetch<{ ok: boolean; role?: AppRole }>('/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ idToken, role }),
    })
    if (result.ok) {
      setClientCookie(AUTH_COOKIE, '1')
      const resolvedRole = normalizeRole(result.role ?? role)
      if (resolvedRole) setClientCookie(ROLE_COOKIE, resolvedRole)
      router.replace(redirect)
    }
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const auth = getFirebaseAuth()
      const credential =
        mode === 'signin'
          ? await signInWithEmailAndPassword(auth, email.trim(), password)
          : await createUserWithEmailAndPassword(auth, email.trim(), password)
      const idToken = await credential.user.getIdToken()
      await establishSession(idToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    try {
      const auth = getFirebaseAuth()
      const credential = await signInWithPopup(auth, googleProvider)
      const idToken = await credential.user.getIdToken()
      await establishSession(idToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center overflow-x-hidden px-4 py-8">
      <Card raised className="animate-rise">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in to continue. Your session is secured through the BFF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            label="I am a"
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="PARENT">Parent</option>
            <option value="ADMIN">Admin</option>
          </Select>

          <form className="space-y-3" onSubmit={handleEmailSubmit}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? (
              <p className="text-sm text-[var(--coral)]" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={loading}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={loading}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-[var(--primary)] hover:underline"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
            </button>
            <Link href="/" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
