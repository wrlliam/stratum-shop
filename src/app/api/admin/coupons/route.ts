import { NextRequest, NextResponse } from 'next/server'
import { db, coupons } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { desc } from 'drizzle-orm'
import { z } from 'zod'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt))
  return NextResponse.json(allCoupons)
}

const createSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  type: z.enum(['fixed', 'percentage']),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const [coupon] = await db
      .insert(coupons)
      .values({
        code: data.code,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount ?? null,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning()

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
    }
    console.error('Create coupon error:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
