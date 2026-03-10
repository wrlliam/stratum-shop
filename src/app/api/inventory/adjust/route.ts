import { NextRequest, NextResponse } from 'next/server'
import { db, products, inventoryLog } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { z } from 'zod'

const adjustSchema = z.object({
  productId: z.string().uuid(),
  quantityChange: z.number().int(),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const data = adjustSchema.parse(body)

    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${data.quantityChange}`, updatedAt: new Date() })
      .where(eq(products.id, data.productId))

    await db.insert(inventoryLog).values({
      productId: data.productId,
      quantityChange: data.quantityChange,
      reason: data.reason || 'manual',
      userId: authResult.userId,
    })

    const updated = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
    })

    return NextResponse.json({ stock: updated?.stock })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Inventory adjust error:', error)
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
  }
}
