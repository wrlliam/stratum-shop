import { NextRequest, NextResponse } from 'next/server'
import { db, recommendations } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  description: z.string().optional().default(''),
  imageUrl: z.string().optional(),
  referenceUrl: z.string().url().optional(),
  modelFileUrl: z.string().optional(),
  estimatedVolumeCm3: z.number().int().positive().optional(),
  estimatedPricePence: z.number().int().positive().optional(),
  plates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    volumeCm3: z.number(),
    selected: z.boolean(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const rows = await db.query.recommendations.findMany({
      orderBy: desc(recommendations.createdAt),
    })
    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const [rec] = await db.insert(recommendations).values(data).returning()
    return NextResponse.json(rec, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to submit recommendation' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const updateSchema = z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'reviewing', 'quoted', 'awaiting_payment', 'paid', 'printing', 'completed', 'declined']),
      adminNotes: z.string().max(2000).nullable().optional(),
    })
    const data = updateSchema.parse(body)

    const [updated] = await db
      .update(recommendations)
      .set({ status: data.status, adminNotes: data.adminNotes })
      .where(eq(recommendations.id, data.id))
      .returning()

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update recommendation' }, { status: 500 })
  }
}
