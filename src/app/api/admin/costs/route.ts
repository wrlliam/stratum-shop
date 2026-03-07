import { NextRequest, NextResponse } from 'next/server'
import { db, timeEntries, costEntries, settings } from '@/lib/db'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { eq, gte, lte, and, sum } from 'drizzle-orm'
import { z } from 'zod'

const timeSchema = z.object({
  type: z.literal('time'),
  description: z.string().min(1),
  minutes: z.number().int().positive(),
  orderId: z.string().uuid().optional(),
})

const costSchema = z.object({
  type: z.literal('cost'),
  costType: z.enum(['electricity', 'filament', 'shipping', 'other']),
  description: z.string().min(1),
  amountPence: z.number().int().positive(),
  orderId: z.string().uuid().optional(),
})

const entrySchema = z.discriminatedUnion('type', [timeSchema, costSchema])

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM

  try {
    let from: Date | undefined
    let to: Date | undefined
    if (month) {
      const [y, m] = month.split('-').map(Number)
      from = new Date(y, m - 1, 1)
      to = new Date(y, m, 0, 23, 59, 59)
    }

    const timeWhere = from && to
      ? and(gte(timeEntries.createdAt, from), lte(timeEntries.createdAt, to))
      : undefined
    const costWhere = from && to
      ? and(gte(costEntries.createdAt, from), lte(costEntries.createdAt, to))
      : undefined

    const [totalMinutes] = await db
      .select({ total: sum(timeEntries.minutes) })
      .from(timeEntries)
      .where(timeWhere)

    const [totalCosts] = await db
      .select({ total: sum(costEntries.amountPence) })
      .from(costEntries)
      .where(costWhere)

    const recentTime = await db.query.timeEntries.findMany({
      where: timeWhere,
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 50,
    })

    const recentCosts = await db.query.costEntries.findMany({
      where: costWhere,
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 50,
    })

    // Hourly rate from settings
    const rateRow = await db.query.settings.findFirst({
      where: eq(settings.key, 'hourly_rate_pence'),
    })
    const hourlyRatePence = rateRow ? parseInt(rateRow.value) : 1500 // default £15/hr

    const totalMinutesNum = Number(totalMinutes?.total ?? 0)
    const labourCostPence = Math.round((totalMinutesNum / 60) * hourlyRatePence)

    return NextResponse.json({
      totalMinutes: totalMinutesNum,
      totalCostsPence: Number(totalCosts?.total ?? 0),
      labourCostPence,
      hourlyRatePence,
      timeEntries: recentTime,
      costEntries: recentCosts,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch costs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

  try {
    const body = await request.json()
    const data = entrySchema.parse(body)

    if (data.type === 'time') {
      const [entry] = await db.insert(timeEntries).values({
        adminId: authResult.userId,
        description: data.description,
        minutes: data.minutes,
        orderId: data.orderId ?? null,
      }).returning()
      return NextResponse.json(entry)
    } else {
      const [entry] = await db.insert(costEntries).values({
        adminId: authResult.userId,
        type: data.costType,
        description: data.description,
        amountPence: data.amountPence,
        orderId: data.orderId ?? null,
      }).returning()
      return NextResponse.json(entry)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
  }
}
