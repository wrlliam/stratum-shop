import { NextRequest, NextResponse } from 'next/server'
import { stripe, getDeliveryOption, VAT_RATE } from '@/lib/stripe'
import { db, recommendations, orders, orderItems } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { getResend, FROM_EMAIL, APP_URL } from '@/lib/resend'
import { PrintRequestApprovedEmail } from '@/lib/email/print-request-approved'
import { renderAsync } from '@react-email/components'
import { generateOrderNumber } from '@/lib/utils'
import { z } from 'zod'

const quoteSchema = z.object({
  pricePence: z.number().int().positive(),
  adminNotes: z.string().max(2000).optional(),
  deliveryMethodId: z.string().optional(),
  vatInclusive: z.boolean().optional(), // true = price already includes VAT, show 0% VAT
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const { id } = await params
    const body = await request.json()
    const data = quoteSchema.parse(body)

    // Fetch recommendation
    const rec = await db.query.recommendations.findFirst({
      where: eq(recommendations.id, id),
    })
    if (!rec) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }
    if (!['pending', 'reviewing', 'quoted', 'awaiting_payment'].includes(rec.status)) {
      return NextResponse.json(
        { error: `Cannot quote a recommendation with status "${rec.status}"` },
        { status: 400 }
      )
    }

    const isResend = ['quoted', 'awaiting_payment'].includes(rec.status)

    // Calculate pricing
    const isFreeShipping = data.deliveryMethodId === 'free'
    const deliveryOption = isFreeShipping
      ? null
      : (data.deliveryMethodId
          ? getDeliveryOption(data.deliveryMethodId)
          : getDeliveryOption('royal_mail_tracked_48'))
    if (!isFreeShipping && !deliveryOption) {
      return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 })
    }

    const itemPrice = data.pricePence
    const deliveryPrice = isFreeShipping ? 0 : deliveryOption!.price
    const subtotal = itemPrice
    const preTaxTotal = subtotal + deliveryPrice
    const taxAmount = data.vatInclusive ? 0 : Math.round(preTaxTotal * VAT_RATE)
    const total = preTaxTotal + taxAmount
    const itemName = `Custom 3D Print: ${rec.name.length > 80 ? rec.name.slice(0, 80) + '…' : rec.name}`

    let order: typeof orders.$inferSelect

    if (isResend && rec.orderId) {
      // Expire old Stripe session if possible
      if (rec.paymentSessionId) {
        try { await stripe.checkout.sessions.expire(rec.paymentSessionId) } catch { /* may already be expired */ }
      }

      // Update existing order with new pricing
      const [updated] = await db
        .update(orders)
        .set({ subtotal, deliveryPrice, taxAmount, total, deliveryMethod: data.deliveryMethodId || 'free' })
        .where(eq(orders.id, rec.orderId))
        .returning()
      order = updated

      // Update order item price
      await db
        .update(orderItems)
        .set({ price: itemPrice, name: itemName })
        .where(eq(orderItems.orderId, order.id))
    } else {
      // Create new order
      const orderNumber = generateOrderNumber()
      const [created] = await db
        .insert(orders)
        .values({
          orderNumber,
          email: rec.email,
          status: 'pending',
          subtotal,
          deliveryPrice,
          taxAmount,
          total,
          discountAmount: 0,
          deliveryMethod: data.deliveryMethodId || 'free',
          notes: `Custom print request: ${rec.name}`,
        })
        .returning()
      order = created

      await db.insert(orderItems).values({
        orderId: order.id,
        name: itemName,
        price: itemPrice,
        quantity: 1,
        isBundle: false,
        imageUrl: rec.imageUrl,
      })
    }

    // Build Stripe line items
    const deliveryName = isFreeShipping ? 'Free Shipping' : deliveryOption!.name
    const stripeLineItems = [
      {
        price_data: {
          currency: 'gbp',
          product_data: { name: itemName },
          unit_amount: itemPrice,
        },
        quantity: 1,
      },
      ...(deliveryPrice > 0
        ? [{
            price_data: {
              currency: 'gbp',
              product_data: { name: `Delivery: ${deliveryName}` },
              unit_amount: deliveryPrice,
            },
            quantity: 1,
          }]
        : []),
      ...(taxAmount > 0
        ? [{
            price_data: {
              currency: 'gbp',
              product_data: { name: 'VAT (20%)' },
              unit_amount: taxAmount,
            },
            quantity: 1,
          }]
        : []),
    ]

    // Create Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: rec.email,
      line_items: stripeLineItems,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recommendationId: rec.id,
      },
      success_url: `${appUrl}/recommendations/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/recommendations`,
      expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    })

    if (!stripeSession.url) {
      return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
    }

    // Update order with stripe session
    await db
      .update(orders)
      .set({ stripeSessionId: stripeSession.id })
      .where(eq(orders.id, order.id))

    // Update recommendation
    const [updated] = await db
      .update(recommendations)
      .set({
        status: 'quoted',
        finalPricePence: data.pricePence,
        orderId: order.id,
        paymentSessionId: stripeSession.id,
        adminNotes: data.adminNotes || rec.adminNotes,
      })
      .where(eq(recommendations.id, id))
      .returning()

    // Send approval email (non-blocking — don't fail the quote if email fails)
    let emailSent = false
    let emailError: string | null = null
    try {
      const html = await renderAsync(
        PrintRequestApprovedEmail({
          name: rec.name,
          description: rec.description || '',
          finalPricePence: total,
          adminNotes: data.adminNotes,
          paymentUrl: stripeSession.url,
          appUrl: APP_URL,
        }) as React.ReactElement
      )

      const emailResult = await getResend().emails.send({
        from: FROM_EMAIL,
        to: rec.email,
        subject: isResend
          ? 'Updated Quote — Your Print Request — Stratum'
          : 'Your Print Request Has Been Approved — Stratum',
        html,
      })

      console.log('Quote email result:', JSON.stringify(emailResult), 'to:', rec.email)
      emailSent = true
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Unknown email error'
      console.error('Quote email failed:', emailError, 'to:', rec.email, 'from:', FROM_EMAIL)
    }

    // Audit log
    await logAuditEvent({
      adminId: authResult.userId,
      action: 'recommendation_quoted',
      entityType: 'recommendation',
      entityId: id,
      metadata: {
        pricePence: data.pricePence,
        total,
        orderId: order.id,
        orderNumber: order.orderNumber,
        isResend,
      },
    })

    return NextResponse.json({
      ...updated,
      order: { id: order.id, orderNumber: order.orderNumber, total },
      paymentUrl: stripeSession.url,
      emailSent,
      emailError,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid request' }, { status: 400 })
    }
    console.error('Quote error:', error)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}
