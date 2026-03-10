import { NextRequest, NextResponse } from 'next/server'
import { db, printBatches, products, inventoryLog } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const batch = await db.query.printBatches.findFirst({
      where: eq(printBatches.id, id),
      with: { product: true },
    })
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }
    return NextResponse.json(batch)
  } catch (error) {
    console.error('Batch get error:', error)
    return NextResponse.json({ error: 'Failed to fetch batch' }, { status: 500 })
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const batch = await db.query.printBatches.findFirst({
      where: eq(printBatches.id, id),
    })
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }
    if (batch.status === 'completed') {
      return NextResponse.json({ error: 'Batch already completed' }, { status: 400 })
    }

    // Complete the batch
    await db
      .update(printBatches)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(printBatches.id, id))

    // Add stock to product
    await db
      .update(products)
      .set({
        stock: sql`${products.stock} + ${batch.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, batch.productId))

    // Log inventory change
    await db.insert(inventoryLog).values({
      productId: batch.productId,
      quantityChange: batch.quantity,
      reason: 'batch_completed',
      batchId: batch.id,
      userId: authResult.userId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Batch complete error:', error)
    return NextResponse.json({ error: 'Failed to complete batch' }, { status: 500 })
  }
}
