import { NextRequest, NextResponse } from 'next/server'
import { db, coupons, couponProducts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { z } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

  const { id } = await params

  try {
    const body = await request.json()
    const updateSchema = z.object({
      active: z.boolean().optional(),
      maxUses: z.number().int().positive().nullable().optional(),
      expiresAt: z.string().nullable().optional(),
      productIds: z.array(z.string().uuid()).optional(),
    })
    const data = updateSchema.parse(body)

    const updateValues: Record<string, unknown> = {}
    if (data.active !== undefined) updateValues.active = data.active
    if (data.maxUses !== undefined) updateValues.maxUses = data.maxUses
    if (data.expiresAt !== undefined)
      updateValues.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

    const [updated] = await db
      .update(coupons)
      .set(updateValues)
      .where(eq(coupons.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // Replace product restrictions if provided
    if (data.productIds !== undefined) {
      await db.delete(couponProducts).where(eq(couponProducts.couponId, id))
      if (data.productIds.length > 0) {
        await db.insert(couponProducts).values(
          data.productIds.map((productId) => ({ couponId: id, productId }))
        )
      }
    }

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'coupon.updated',
      entityType: 'coupon',
      entityId: id,
    })

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
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  await db.delete(coupons).where(eq(coupons.id, id))

  await logAuditEvent({
    adminId: authResult.userId,
    action: 'coupon.deleted',
    entityType: 'coupon',
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
