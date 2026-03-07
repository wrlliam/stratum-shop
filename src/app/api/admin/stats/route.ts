import { NextRequest, NextResponse } from 'next/server'
import { db, orders, orderItems, products, supportTickets } from '@/lib/db'
import { sql, desc, eq, gte, lte, and, inArray } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { subMonths, subDays, startOfMonth, startOfDay, format } from 'date-fns'
import { cacheGet, cacheSet, STATS_CACHE_KEY, STATS_TTL } from '@/lib/redis'

// Statuses that represent completed/paid orders (not pending, cancelled, or refunded)
const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

export async function GET(_request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    // Serve from cache if available
    const cached = await cacheGet(STATS_CACHE_KEY)
    if (cached) return NextResponse.json(cached)

    // Total revenue (all paid/completed orders)
    const revenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(inArray(orders.status, PAID_STATUSES))

    const totalRevenue = Number(revenueResult[0].total)

    // Total orders (exclude pending/cancelled)
    const ordersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, PAID_STATUSES))
    const totalOrders = Number(ordersResult[0].count)

    // Total products
    const productsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
    const totalProducts = Number(productsResult[0].count)

    // Total customers (unique emails from paid orders)
    const customersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT email)` })
      .from(orders)
      .where(inArray(orders.status, PAID_STATUSES))
    const totalCustomers = Number(customersResult[0].count)

    // Average order value (paid orders)
    const avgResult = await db
      .select({ avg: sql<number>`COALESCE(AVG(total), 0)` })
      .from(orders)
      .where(inArray(orders.status, PAID_STATUSES))
    const avgOrderValue = Math.round(Number(avgResult[0].avg))

    // Revenue change % (this month vs last month)
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))

    const thisMonthRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(and(inArray(orders.status, PAID_STATUSES), gte(orders.createdAt, thisMonthStart)))

    const lastMonthRevenue = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(
        and(
          inArray(orders.status, PAID_STATUSES),
          gte(orders.createdAt, lastMonthStart),
          lte(orders.createdAt, thisMonthStart)
        )
      )

    const thisMonth = Number(thisMonthRevenue[0].total)
    const lastMonth = Number(lastMonthRevenue[0].total)
    const revenueChangePercent = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : thisMonth > 0 ? 100 : 0

    // Revenue by month (last 12 months)
    const twelveMonthsAgo = subMonths(new Date(), 11)
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(created_at, 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, startOfMonth(twelveMonthsAgo)))
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM')`)

    // Fill in missing months
    const revenueByMonth = []
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthKey = format(date, 'yyyy-MM')
      const found = monthlyData.find((m) => m.month === monthKey)
      revenueByMonth.push({
        month: format(date, 'MMM yyyy'),
        revenue: found ? Number(found.revenue) : 0,
        orders: found ? Number(found.orderCount) : 0,
      })
    }

    // Daily orders (last 30 days)
    const thirtyDaysAgo = subDays(now, 29)
    const dailyData = await db
      .select({
        day: sql<string>`TO_CHAR(created_at, 'YYYY-MM-DD')`,
        orderCount: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(SUM(total), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, startOfDay(thirtyDaysAgo)))
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`)

    const dailyOrders = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      const dayKey = format(date, 'yyyy-MM-dd')
      const found = dailyData.find((d) => d.day === dayKey)
      dailyOrders.push({
        date: format(date, 'dd MMM'),
        orders: found ? Number(found.orderCount) : 0,
        revenue: found ? Number(found.revenue) : 0,
      })
    }

    // Recent orders
    const recentOrders = await db.query.orders.findMany({
      with: { items: true },
      orderBy: desc(orders.createdAt),
      limit: 10,
    })

    // Top products by sales
    const topProducts = await db
      .select({
        name: orderItems.name,
        sales: sql<number>`SUM(${orderItems.quantity})`,
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .groupBy(orderItems.name)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(5)

    // Orders by status
    const ordersByStatus = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.status)

    // Low stock products (stock <= 5)
    const lowStockProducts = await db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.active, true), lte(products.stock, 5)))
      .orderBy(products.stock)
      .limit(10)

    // --- Live / today metrics ---
    const todayStart = startOfDay(now)
    const yesterdayStart = startOfDay(subDays(now, 1))

    const todayRevenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)`, count: sql<number>`count(*)` })
      .from(orders)
      .where(and(inArray(orders.status, PAID_STATUSES), gte(orders.createdAt, todayStart)))

    const yesterdayRevenueResult = await db
      .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(orders)
      .where(
        and(
          inArray(orders.status, PAID_STATUSES),
          gte(orders.createdAt, yesterdayStart),
          lte(orders.createdAt, todayStart),
        ),
      )

    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.status, ['paid', 'processing']))

    const openTicketsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportTickets)
      .where(inArray(supportTickets.status, ['open', 'in_progress']))

    const lowStockCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.active, true), lte(products.stock, 5)))

    const todayRevenue = Number(todayRevenueResult[0].total)
    const todayOrders = Number(todayRevenueResult[0].count)
    const yesterdayRevenue = Number(yesterdayRevenueResult[0].total)
    const pendingOrders = Number(pendingOrdersResult[0].count)
    const openTickets = Number(openTicketsResult[0].count)
    const lowStockCount = Number(lowStockCountResult[0].count)

    // Repeat customer rate
    const emailCounts = await db
      .select({
        email: orders.email,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .groupBy(orders.email)

    const totalUniqueCustomers = emailCounts.length
    const repeatCustomers = emailCounts.filter((e) => Number(e.orderCount) > 1).length
    const repeatCustomerRate = totalUniqueCustomers > 0
      ? Math.round((repeatCustomers / totalUniqueCustomers) * 100)
      : 0

    const payload = {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      avgOrderValue,
      revenueChangePercent,
      todayRevenue,
      yesterdayRevenue,
      todayOrders,
      pendingOrders,
      openTickets,
      lowStockCount,
      revenueByMonth,
      dailyOrders,
      recentOrders,
      topProducts: topProducts.map((p) => ({
        name: p.name,
        sales: Number(p.sales),
        revenue: Number(p.revenue),
      })),
      ordersByStatus: ordersByStatus.map((o) => ({
        status: o.status,
        count: Number(o.count),
      })),
      lowStockProducts,
      repeatCustomerRate,
    }

    await cacheSet(STATS_CACHE_KEY, payload, STATS_TTL)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
