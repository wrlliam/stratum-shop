import { NextResponse } from 'next/server'
import { db, orders } from '@/lib/db'
import { requireAdmin } from '@/lib/api-guard'
import { sql, desc, gte, and, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Active orders (not delivered/cancelled/refunded/pending) — last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const activeStatuses = ['paid', 'processing', 'preparing', 'prepared', 'shipped']

    const activeOrders = await db.query.orders.findMany({
      where: and(
        inArray(orders.status, activeStatuses),
        gte(orders.createdAt, sevenDaysAgo),
      ),
      with: {
        items: {
          columns: { name: true, quantity: true },
        },
      },
      orderBy: desc(orders.createdAt),
      limit: 100,
    })

    // Today stats
    const todayIso = todayStart.toISOString()
    const [todayStats] = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${orders.createdAt} >= ${todayIso} AND ${orders.status} != 'pending' AND ${orders.status} != 'cancelled' THEN ${orders.total} ELSE 0 END), 0)`,
        todayOrders: sql<number>`COUNT(CASE WHEN ${orders.createdAt} >= ${todayIso} AND ${orders.status} != 'pending' THEN 1 END)`,
        totalOrders: sql<number>`COUNT(CASE WHEN ${orders.status} != 'pending' THEN 1 END)`,
        paidOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'paid' THEN 1 END)`,
        processingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} IN ('processing', 'preparing', 'prepared') THEN 1 END)`,
        shippedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`,
        pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'paid' THEN 1 END)`,
      })
      .from(orders)

    return NextResponse.json({
      orders: activeOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        email: o.email,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      })),
      stats: {
        totalOrders: Number(todayStats.totalOrders),
        todayRevenue: Number(todayStats.revenue),
        todayOrders: Number(todayStats.todayOrders),
        paidOrders: Number(todayStats.paidOrders),
        processingOrders: Number(todayStats.processingOrders),
        shippedOrders: Number(todayStats.shippedOrders),
        pendingOrders: Number(todayStats.pendingOrders),
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch mission control data' }, { status: 500 })
  }
}
