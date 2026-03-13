import { NextRequest, NextResponse } from 'next/server'
import { db, timeEntries, costEntries, settings, filaments } from '@/lib/db'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { eq, gte, lte, and, sum, sql } from 'drizzle-orm'
import { z } from 'zod'

const timeSchema = z.object({
  type: z.literal('time'),
  description: z.string().min(1),
  minutes: z.number().int().positive(),
  category: z.enum(['labour', 'print_time']).default('labour'),
  orderId: z.string().uuid().optional(),
})

const costSchema = z.object({
  type: z.literal('cost'),
  costType: z.enum(['electricity', 'filament', 'shipping', 'other']),
  description: z.string().min(1),
  amountPence: z.number().int().positive().optional(),
  filamentId: z.string().uuid().optional(),
  gramsUsed: z.number().positive().optional(),
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

    // Split time by category
    const labourWhere = from && to
      ? and(gte(timeEntries.createdAt, from), lte(timeEntries.createdAt, to), eq(timeEntries.category, 'labour'))
      : eq(timeEntries.category, 'labour')
    const printWhere = from && to
      ? and(gte(timeEntries.createdAt, from), lte(timeEntries.createdAt, to), eq(timeEntries.category, 'print_time'))
      : eq(timeEntries.category, 'print_time')

    const [labourMinutesResult] = await db
      .select({ total: sum(timeEntries.minutes) })
      .from(timeEntries)
      .where(labourWhere)

    const [printMinutesResult] = await db
      .select({ total: sum(timeEntries.minutes) })
      .from(timeEntries)
      .where(printWhere)

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
      with: { filament: true },
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 50,
    })

    // Hourly rate from settings
    const rateRow = await db.query.settings.findFirst({
      where: eq(settings.key, 'hourly_rate_pence'),
    })
    const hourlyRatePence = rateRow ? parseInt(rateRow.value) : 1500 // default £15/hr

    const labourMinutes = Number(labourMinutesResult?.total ?? 0)
    const printMinutes = Number(printMinutesResult?.total ?? 0)
    const totalMinutes = labourMinutes + printMinutes
    const labourCostPence = Math.round((labourMinutes / 60) * hourlyRatePence)

    return NextResponse.json({
      totalMinutes,
      labourMinutes,
      printMinutes,
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
        category: data.category,
        orderId: data.orderId ?? null,
      }).returning()
      return NextResponse.json(entry)
    } else {
      // If filament cost type with filamentId + gramsUsed, auto-calculate
      if (data.costType === 'filament' && data.filamentId && data.gramsUsed) {
        const filament = await db.query.filaments.findFirst({
          where: eq(filaments.id, data.filamentId),
        })
        if (!filament) {
          return NextResponse.json({ error: 'Filament not found' }, { status: 404 })
        }

        const amountPence = Math.round((data.gramsUsed / 1000) * filament.pricePerKgPence)

        // Decrement filament stock
        await db.update(filaments).set({
          weightRemainingGrams: sql`${filaments.weightRemainingGrams} - ${Math.round(data.gramsUsed)}`,
          updatedAt: new Date(),
        }).where(eq(filaments.id, data.filamentId))

        const [entry] = await db.insert(costEntries).values({
          adminId: authResult.userId,
          type: 'filament',
          description: data.description,
          amountPence,
          filamentId: data.filamentId,
          gramsUsed: Math.round(data.gramsUsed),
          orderId: data.orderId ?? null,
        }).returning()
        return NextResponse.json(entry)
      }

      // Manual cost entry
      if (!data.amountPence) {
        return NextResponse.json({ error: 'amountPence is required for non-filament costs' }, { status: 400 })
      }

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
