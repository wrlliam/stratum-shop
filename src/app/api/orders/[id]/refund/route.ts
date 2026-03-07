import { NextRequest, NextResponse } from 'next/server'
import { db, orders, products, bundleProducts, inventoryLog } from '@/lib/db'
import { eq, sql } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { requireAdmin } from '@/lib/api-guard'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend'
import { renderAsync } from '@react-email/components'
import { OrderCancellationEmail } from '@/lib/email/order-cancellation'
import { logAuditEvent } from '@/lib/audit'

const REFUNDABLE_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot refund an order with status "${order.status}"` },
        { status: 400 }
      )
    }

    let paymentIntentId = order.stripePaymentIntentId;

    if (!paymentIntentId) {
      if (!order.stripeSessionId) {
        return NextResponse.json(
          { error: "No payment intent or session found for this order" },
          { status: 400 },
        );
      }

      const stripeSession = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );

      if (!stripeSession.payment_intent) {
        return NextResponse.json(
          { error: "Could not resolve a payment intent from the Stripe session" },
          { status: 400 },
        );
      }

      paymentIntentId =
        typeof stripeSession.payment_intent === "string"
          ? stripeSession.payment_intent
          : stripeSession.payment_intent.id;

      // Persist it so future calls don't need to hit Stripe again
      await db
        .update(orders)
        .set({ stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
        .where(eq(orders.id, id));
    }

    // Issue Stripe refund — if already refunded, treat as a DB sync (don't double-refund)
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
      })
    } catch (stripeErr: unknown) {
      const code = (stripeErr as { code?: string }).code
      if (code !== 'charge_already_refunded') {
        console.error('Stripe refund error:', stripeErr)
        return NextResponse.json({ error: 'Payment processing error. Please contact support.' }, { status: 502 })
      }
      // charge_already_refunded: refund already exists in Stripe — fall through to sync DB state
    }

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
          userId: authResult.userId,
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
            userId: authResult.userId,
          })
        }
      }
    }

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'order.refunded',
      entityType: 'order',
      entityId: id,
      metadata: { orderNumber: order.orderNumber, amount: order.total },
    })

    // Send refund confirmation email
    try {
      const html = await renderAsync(
        OrderCancellationEmail({ order, appUrl: APP_URL }) as React.ReactElement
      )
      await resend.emails.send({
        from: FROM_EMAIL,
        to: order.email,
        subject: `Refund Issued: ${order.orderNumber} — Stratum`,
        html,
      })
    } catch (emailErr) {
      console.error('Failed to send refund email:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 })
  }
}
