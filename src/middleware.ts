import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, ROLE_COOKIE, getRoleHome, normalizeRole } from '@/lib/auth'
import { isPublicRoute, matchRouteAuth } from '@/lib/route-auth'

function legacyRedirect(request: NextRequest): NextResponse | null {
  const { searchParams } = request.nextUrl
  if (searchParams.has('me')) {
    return NextResponse.redirect(new URL('/student', request.url))
  }
  if (searchParams.has('teacher')) {
    return NextResponse.redirect(new URL('/teacher', request.url))
  }
  if (searchParams.has('parent')) {
    return NextResponse.redirect(new URL('/parent', request.url))
  }
  if (searchParams.has('admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }
  return null
}

export function middleware(request: NextRequest) {
  const legacy = legacyRedirect(request)
  if (legacy) return legacy

  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const session = request.cookies.get(AUTH_COOKIE)?.value
  const role = normalizeRole(request.cookies.get(ROLE_COOKIE)?.value)

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!matchRouteAuth(pathname, role)) {
    const destination = role ? getRoleHome(role) : '/login'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
