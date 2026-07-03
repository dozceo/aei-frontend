'use client'

import { useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase-client'
import { backendFetch } from '@/lib/backend-client'
import { AUTH_COOKIE, ROLE_COOKIE, normalizeRole } from '@/lib/auth'
import type { AppRole } from '@/types/app'

interface SessionExchangeResponse {
  ok: boolean
  user?: { role?: string }
  message?: string
}

function setClientCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`
}

function clearClientCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

async function syncSession(idToken: string, preferredRole?: AppRole | null) {
  const body: Record<string, string> = { idToken }
  if (preferredRole) body.role = preferredRole

  const result = await backendFetch<SessionExchangeResponse>('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (result.ok) {
    setClientCookie(AUTH_COOKIE, '1')
    const role = normalizeRole(result.user?.role ?? preferredRole ?? null)
    if (role) setClientCookie(ROLE_COOKIE, role)
  }

  return result
}

async function clearSession() {
  try {
    await backendFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Best-effort logout when BFF is unavailable.
  }
  clearClientCookie(AUTH_COOKIE)
  clearClientCookie(ROLE_COOKIE)
}

function readPreferredRole(): AppRole | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return normalizeRole(params.get('role'))
}

export function AuthSessionSync() {
  const syncingRef = useRef(false)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (syncingRef.current) return
      syncingRef.current = true
      try {
        if (!user) {
          await clearSession()
          return
        }
        const idToken = await user.getIdToken()
        await syncSession(idToken, readPreferredRole())
      } catch {
        await signOut(auth)
        await clearSession()
      } finally {
        syncingRef.current = false
      }
    })

    return unsubscribe
  }, [])

  return null
}
