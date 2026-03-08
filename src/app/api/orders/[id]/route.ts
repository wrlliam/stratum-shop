import { NextRequest, NextResponse } from 'next/server'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { z } from 'zod'
import { renderAsync } from '@react-email/components'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend'
import { OrderShippedEmail } from '@/lib/email/order-shipped'
import { OrderStatusUpdateEmail } from '@/lib/email/order-status-update'
import { logAuditEvent } from '@/lib/audit'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Non-admin users can only view their own orders
    if (session.user.role !== 'admin' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const updateSchema = z.object({
      status: z.enum(['pending', 'paid', 'processing', 'prepared', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
      trackingNumber: z.string().max(200).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
    })
    const data = updateSchema.parse(body)

    // Get current order before update
    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousStatus = currentOrder.status

    await db
      .update(orders)
      .set({
        ...(data.status && { status: data.status }),
        ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
        ...(data.notes !== undefined && { notes: data.notes }),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))

    const updated = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    })

    // Send email notifications on status changes
    if (data.status && data.status !== previousStatus && updated) {
      try {
        if (data.status === 'shipped') {
          const html = await renderAsync(
            OrderShippedEmail({
              order: updated,
              trackingNumber: updated.trackingNumber,
              appUrl: APP_URL,
            }) as React.ReactElement
          )
          await resend.emails.send({
            from: FROM_EMAIL,
            to: updated.email,
            subject: `Your Order Has Been Shipped: ${updated.orderNumber} — Stratum`,
            html,
          })
        } else if (['processing', 'delivered'].includes(data.status)) {
          const emailComponent = OrderStatusUpdateEmail({
            orderNumber: updated.orderNumber,
            status: data.status,
            appUrl: APP_URL,
          })
          if (emailComponent) {
            const html = await renderAsync(emailComponent as React.ReactElement)
            await resend.emails.send({
              from: FROM_EMAIL,
              to: updated.email,
              subject: `Order Update: ${updated.orderNumber} — Stratum`,
              html,
            })
          }
        }
      } catch (emailErr) {
        console.error('Failed to send status update email:', emailErr)
        // Don't fail the status update if email fails
      }
    }

    if (data.status && data.status !== previousStatus) {
      await logAuditEvent({
        adminId: session.user.id,
        action: 'order.status_change',
        entityType: 'order',
        entityId: id,
        metadata: { from: previousStatus, to: data.status },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
