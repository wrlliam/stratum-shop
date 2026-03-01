import { NextRequest, NextResponse } from 'next/server'
import { db, coupons } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, subtotal } = validateSchema.parse(body)

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
