import { NextRequest, NextResponse } from 'next/server'
import { db, coupons } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { z } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const updateSchema = z.object({
      active: z.boolean().optional(),
      maxUses: z.number().int().positive().nullable().optional(),
      expiresAt: z.string().nullable().optional(),
    })
    const data = updateSchema.parse(body)

    const updateValues: Record<string, unknown> = {}
    if (data.active !== undefined) updateValues.active = data.active
    if (data.maxUses !== undefined) updateValues.maxUses = data.maxUses
    if (data.expiresAt !== undefined) updateValues.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

    const [updated] = await db
      .update(coupons)
      .set(updateValues)
      .where(eq(coupons.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
    }
    console.error('Update coupon error:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  await db.delete(coupons).where(eq(coupons.id, id))
  return NextResponse.json({ ok: true })
}
