import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { FROM_EMAIL, APP_URL, getResend } from '@/lib/resend'
import { renderAsync } from '@react-email/components'
import { OrderConfirmationEmail } from '@/lib/email/order-confirmation'
import { logAuditEvent } from '@/lib/audit'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    const html = await renderAsync(
      OrderConfirmationEmail({ order, appUrl: APP_URL }) as React.ReactElement
    )

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: order.email,
      subject: `Order Confirmation: ${order.orderNumber} — Stratum`,
      html,
    })

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'order.resend_confirmation',
      entityType: 'order',
      entityId: id,
      metadata: { orderNumber: order.orderNumber, email: order.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend confirmation error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
