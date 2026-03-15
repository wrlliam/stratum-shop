import { NextResponse } from 'next/server'
import { db, orders, recommendations, supportTickets } from '@/lib/db'
import { requireAdmin } from '@/lib/api-guard'
import { sql, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const [orderCounts] = await db
      .select({
        pending: sql<number>`COUNT(CASE WHEN ${orders.status} IN ('paid', 'processing') THEN 1 END)`,
      })
      .from(orders)

    const [recCounts] = await db
      .select({
        pending: sql<number>`COUNT(CASE WHEN ${recommendations.status} IN ('pending', 'reviewing') THEN 1 END)`,
      })
      .from(recommendations)

    const [ticketCounts] = await db
      .select({
        open: sql<number>`COUNT(CASE WHEN ${supportTickets.status} IN ('open', 'in_progress') THEN 1 END)`,
      })
      .from(supportTickets)

    return NextResponse.json({
      orders: Number(orderCounts.pending),
      requests: Number(recCounts.pending),
      tickets: Number(ticketCounts.open),
    })
  } catch (error) {
    console.error('Counts error:', error)
    return NextResponse.json({ orders: 0, requests: 0, tickets: 0 })
  }
}
