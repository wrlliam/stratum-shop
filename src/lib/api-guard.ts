import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, user as userTable } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

/**
 * Verify admin role with a fresh DB lookup (not just session cache).
 * Returns the user if admin, otherwise returns an error response.
 */
export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // Fresh DB role lookup — session cache may be stale
  const dbUser = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: { id: true, role: true },
  })

  if (!dbUser || dbUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  return { userId: dbUser.id }
}

/**
 * Verify admin or customer_service role with fresh DB lookup.
 */
export async function requireAdminOrSupport(): Promise<{ userId: string; role: string } | NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const dbUser = await db.query.user.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: { id: true, role: true },
  })

  if (!dbUser || !['admin', 'customer_service'].includes(dbUser.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })
  }

  return { userId: dbUser.id, role: dbUser.role ?? 'customer' }
}

/**
 * Require JSON Content-Type for POST/PATCH/PUT requests.
 * Returns an error response if the Content-Type is wrong, otherwise null.
 */
export function requireJsonContentType(request: NextRequest): NextResponse | null {
  const method = request.method
  if (['POST', 'PATCH', 'PUT'].includes(method)) {
    const ct = request.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json', code: 'VALIDATION_ERROR' },
        { status: 415 }
      )
    }
  }
  return null
}
