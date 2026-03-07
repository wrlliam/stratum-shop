import { NextRequest, NextResponse } from 'next/server'
import { db, coupons, couponProducts, products } from '@/lib/db'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export async function GET() {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt))

  // Fetch product restrictions for all coupons
  const couponIds = allCoupons.map((c) => c.id)
  const restrictions =
    couponIds.length > 0
      ? await db
          .select({
            couponId: couponProducts.couponId,
            productId: couponProducts.productId,
            productName: products.name,
          })
          .from(couponProducts)
          .innerJoin(products, eq(couponProducts.productId, products.id))
          .where(inArray(couponProducts.couponId, couponIds))
      : []

  const restrictionsByCoupon = restrictions.reduce<
    Record<string, { productId: string; productName: string }[]>
  >((acc, r) => {
    if (!acc[r.couponId]) acc[r.couponId] = []
    acc[r.couponId].push({ productId: r.productId, productName: r.productName })
    return acc
  }, {})

  const result = allCoupons.map((c) => ({
    ...c,
    productRestrictions: restrictionsByCoupon[c.id] ?? [],
  }))

  return NextResponse.json(result)
}

const createSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  type: z.enum(['fixed', 'percentage']),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  productIds: z.array(z.string().uuid()).optional(), // empty = all products
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['lt', 'lte', 'gt', 'gte', 'eq', 'neq']),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })).optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

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
        conditions: data.conditions ?? null,
      })
      .returning()

    if (data.productIds && data.productIds.length > 0) {
      await db.insert(couponProducts).values(
        data.productIds.map((productId) => ({ couponId: coupon.id, productId }))
      )
    }

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'coupon.created',
      entityType: 'coupon',
      entityId: coupon.id,
      metadata: { code: data.code, type: data.type, value: data.value },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 })
    }
    console.error('Create coupon error:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
