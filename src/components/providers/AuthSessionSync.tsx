'use client'

import { useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase-client'
import { backendFetch } from '@/lib/backend-client'
import {
  AUTH_COOKIE,
  ROLE_COOKIE,
  clearClientAuthCookie,
  normalizeRole,
  readClientAuthCookie,
  setClientAuthCookie,
} from '@/lib/auth'
import type { AppRole } from '@/types/app'

interface SessionExchangeResponse {
  ok: boolean
  user?: { role?: string }
}

function readPreferredRole(): AppRole | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return normalizeRole(params.get('role'))
}

async function syncSession(idToken: string, preferredRole?: AppRole | null) {
  const body: Record<string, string> = { idToken }
  if (preferredRole) body.role = preferredRole

  const result = await backendFetch<SessionExchangeResponse>('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (result.ok) {
    setClientAuthCookie(AUTH_COOKIE, '1')
    const role = normalizeRole(result.user?.role ?? preferredRole ?? readClientAuthCookie(ROLE_COOKIE))
    if (role) setClientAuthCookie(ROLE_COOKIE, role)
  }

  return result
}

async function clearSession() {
  try {
    await backendFetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // Best-effort logout when BFF is unavailable.
  }
  clearClientAuthCookie(AUTH_COOKIE)
  clearClientAuthCookie(ROLE_COOKIE)
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

        // Keep middleware happy even if the BFF exchange is slow or fails.
        setClientAuthCookie(AUTH_COOKIE, '1')

        const cookieRole = normalizeRole(readClientAuthCookie(ROLE_COOKIE))
        const preferredRole = readPreferredRole() ?? cookieRole

        try {
          await syncSession(await user.getIdToken(), preferredRole)
        } catch {
          if (preferredRole) setClientAuthCookie(ROLE_COOKIE, preferredRole)
        }
      } finally {
        syncingRef.current = false
      }
    })

    return unsubscribe
  }, [])

  return null
}
