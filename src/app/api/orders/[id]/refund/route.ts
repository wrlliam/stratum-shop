import { NextRequest, NextResponse } from 'next/server'
import { db, orders, orderItems, products, bundleProducts, inventoryLog } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!['paid', 'processing', 'shipped'].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot refund order with status "${order.status}"` },
        { status: 400 }
      )
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'No payment intent found for this order' },
        { status: 400 }
      )
    }

    // Issue Stripe refund
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    })

    // Update order status
    await db
      .update(orders)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(orders.id, id))

    // Restore stock
    for (const item of order.items) {
      if (item.productId && !item.isBundle) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId))
        await db.insert(inventoryLog).values({
          productId: item.productId,
          quantityChange: item.quantity,
          reason: 'refund',
          userId: session.user.id,
        })
      } else if (item.bundleId) {
        const bps = await db.query.bundleProducts.findMany({
          where: eq(bundleProducts.bundleId, item.bundleId),
        })
        for (const bp of bps) {
          await db
            .update(products)
            .set({ stock: sql`${products.stock} + ${bp.quantity * item.quantity}` })
            .where(eq(products.id, bp.productId))
          await db.insert(inventoryLog).values({
            productId: bp.productId,
            quantityChange: bp.quantity * item.quantity,
            reason: 'refund',
            userId: session.user.id,
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}
