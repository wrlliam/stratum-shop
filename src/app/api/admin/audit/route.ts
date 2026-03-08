import { NextRequest, NextResponse } from 'next/server'
import { db, auditLog, user as userTable } from '@/lib/db'
import { requireAdmin } from '@/lib/api-guard'
import { desc, ilike, or, eq, and } from 'drizzle-orm'

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

    const rows = await db
      .select({
        id: auditLog.id,
        adminId: auditLog.adminId,
        adminName: userTable.name,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        metadata: auditLog.metadata,
        ipAddress: auditLog.ipAddress,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(userTable, eq(auditLog.adminId, userTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
