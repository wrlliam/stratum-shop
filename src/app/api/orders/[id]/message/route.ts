import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@/lib/db'
import { orderMessages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { z } from 'zod'
import { render } from '@react-email/components'
import { OrderMessageEmail } from '@/lib/email/order-message'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend'

const messageSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const body = await request.json()
    const data = messageSchema.parse(body)

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Insert the message
    await db.insert(orderMessages).values({
      orderId: order.id,
      subject: data.subject,
      body: data.body,
      sentByAdminId: authResult.userId,
    })

    // Send email
    const html = await render(
      OrderMessageEmail({
        orderNumber: order.orderNumber,
        subject: data.subject,
        body: data.body,
        appUrl: APP_URL,
      })
    )

    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `${data.subject} — Order #${order.orderNumber}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Failed to send order message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
