import { NextRequest, NextResponse } from 'next/server'
import { db, auditLog } from '@/lib/db'
import { requireAdmin } from '@/lib/api-guard'
import { desc, ilike, or, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const entityType = searchParams.get('entityType')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

  try {
    const conditions = []
    if (search) {
      conditions.push(or(
        ilike(auditLog.action, `%${search}%`),
        ilike(auditLog.entityType, `%${search}%`),
        ilike(auditLog.entityId, `%${search}%`),
      ))
    }
    if (entityType) {
      conditions.push(eq(auditLog.entityType, entityType))
    }

    const logs = await db.query.auditLog.findMany({
      where: conditions.length > 0 ? (conditions.length > 1 ? undefined : conditions[0]) : undefined,
      orderBy: desc(auditLog.createdAt),
      limit,
      offset,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
