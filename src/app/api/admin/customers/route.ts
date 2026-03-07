import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, orders } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/api-guard'
import { eq, count, sum, desc, ilike, or } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

  try {
    const conditions = search
      ? [or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))]
      : []

    const customers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        marketingEmails: user.marketingEmails,
        createdAt: user.createdAt,
        orderCount: sql<number>`cast(count(${orders.id}) as int)`,
        totalSpent: sql<number>`coalesce(cast(sum(case when ${orders.status} = 'paid' then ${orders.total} else 0 end) as bigint), 0)`,
      })
      .from(user)
      .leftJoin(orders, eq(orders.userId, user.id))
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .groupBy(user.id)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset)

    const [totalResult] = await db.select({ count: count() }).from(user)

    return NextResponse.json({ customers, total: Number(totalResult.count) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
