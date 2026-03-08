import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verify admin role via API
    try {
      const response = await fetch(
        new URL('/api/auth/get-session', request.url).toString(),
        {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const role = data?.user?.role
        if (!role) return NextResponse.redirect(new URL('/', request.url))

        // customer_service can only access /admin/support/*
        if (role === 'customer_service') {
          if (!pathname.startsWith('/admin/support')) {
            return NextResponse.redirect(new URL('/admin/support', request.url))
          }
        } else if (role !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } else {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
