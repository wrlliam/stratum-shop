import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const isAdmin = session.user.role === 'admin'
    const { searchParams } = new URL(request.url)
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    const statusParam = searchParams.get('status')
    const status = statusParam && validStatuses.includes(statusParam) ? statusParam : null
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

    const rows = await db.query.orders.findMany({
      where: isAdmin
        ? status
          ? eq(orders.status, status)
          : undefined
        : eq(orders.userId, session.user.id),
      with: { items: true },
      orderBy: desc(orders.createdAt),
      limit,
      offset,
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
