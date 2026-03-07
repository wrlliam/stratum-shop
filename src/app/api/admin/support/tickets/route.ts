import { NextRequest, NextResponse } from 'next/server'
import { db, supportTickets } from '@/lib/db'
import { requireAdminOrSupport } from '@/lib/api-guard'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const authResult = await requireAdminOrSupport()
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

  try {
    const tickets = await db.query.supportTickets.findMany({
      where: status ? eq(supportTickets.status, status) : undefined,
      orderBy: desc(supportTickets.createdAt),
      limit,
      offset,
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}
