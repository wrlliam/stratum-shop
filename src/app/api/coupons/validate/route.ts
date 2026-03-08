import { NextRequest, NextResponse } from 'next/server'
import { db, coupons, orders } from '@/lib/db'
import { eq, and, count, sum } from 'drizzle-orm'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { evaluateConditions } from '@/lib/coupon-conditions'
import type { CouponCondition } from '@/lib/coupon-conditions'

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().int().positive(),
  itemCount: z.number().int().min(0).optional(),
  productIds: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal, itemCount, productIds } = validateSchema.parse(body)

    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase().trim()),
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
    }

    if (!coupon.active) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 })
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      const minAmount = (coupon.minOrderAmount / 100).toFixed(2)
      return NextResponse.json(
        { error: `Minimum order amount of £${minAmount} required` },
        { status: 400 }
      )
    }

    // Evaluate conditions if present
    if (coupon.conditions && Array.isArray(coupon.conditions) && coupon.conditions.length > 0) {
      const session = await auth.api.getSession({ headers: await headers() })
      let accountCtx: { orderCount: number; totalSpent: number; createdAtDays: number } | undefined

      if (session?.user) {
        const paidWhere = and(eq(orders.userId, session.user.id), eq(orders.status, 'paid'))
        const [[orderCountResult], [totalSpentResult]] = await Promise.all([
          db.select({ count: count() }).from(orders).where(paidWhere),
          db.select({ total: sum(orders.total) }).from(orders).where(paidWhere),
        ])

        const createdAt = new Date(session.user.createdAt)
        const createdAtDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

        accountCtx = {
          orderCount: Number(orderCountResult.count),
          totalSpent: Number(totalSpentResult.total ?? 0),
          createdAtDays,
        }
      }

      const result = evaluateConditions(coupon.conditions as CouponCondition[], {
        account: accountCtx,
        cart: { itemCount: itemCount ?? 0, productIds: productIds ?? [] },
      })

      if (!result.valid) {
        return NextResponse.json({ error: 'This coupon is not eligible for your account or cart' }, { status: 400 })
      }
    }

    let discountAmount: number
    if (coupon.type === 'percentage') {
      discountAmount = Math.round(subtotal * (coupon.value / 100))
    } else {
      discountAmount = Math.min(coupon.value, subtotal)
    }

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error('Validate coupon error:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
