import { getFirebaseAuth } from '@/lib/firebase-client'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = API_BASE.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

async function authHeaders(init: RequestInit): Promise<Headers> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('Authorization') && typeof window !== 'undefined') {
    try {
      const user = getFirebaseAuth().currentUser
      if (user) {
        headers.set('Authorization', `Bearer ${await user.getIdToken()}`)
      }
    } catch {
      // ignore — cookie session may still work on same origin
    }
  }
  return headers
}

export async function backendFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await authHeaders(init)

  const response = await fetch(resolveUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : response.statusText || 'Request failed'
    throw new ApiError(response.status, message, payload)
  }

  return payload as T
}

export function getApiBaseUrl(): string {
  return API_BASE
}
