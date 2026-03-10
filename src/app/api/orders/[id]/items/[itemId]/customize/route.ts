import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db, orders, orderItems, customOrderSubmissions } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  fields: z.record(z.string(), z.string()),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id: orderId, itemId } = await params

  // Verify the order belongs to this user and is in a qualifying status
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
    columns: { id: true, status: true },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const QUALIFYING = ['paid', 'processing', 'prepared', 'shipped', 'delivered']
  if (!QUALIFYING.includes(order.status)) {
    return NextResponse.json({ error: 'Order is not eligible for customisation' }, { status: 400 })
  }

  // Verify the item belongs to this order
  const item = await db.query.orderItems.findFirst({
    where: and(eq(orderItems.id, itemId), eq(orderItems.orderId, orderId)),
    columns: { id: true },
  })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  try {
    const body = schema.parse(await request.json())

    // Upsert: replace any existing submission for this item
    await db
      .delete(customOrderSubmissions)
      .where(eq(customOrderSubmissions.orderItemId, itemId))

    const [submission] = await db
      .insert(customOrderSubmissions)
      .values({
        orderItemId: itemId,
        userId: session.user.id,
        fields: body.fields,
      })
      .returning()

    return NextResponse.json(submission)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id: orderId, itemId } = await params

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, session.user.id)),
    columns: { id: true },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const submission = await db.query.customOrderSubmissions.findFirst({
    where: eq(customOrderSubmissions.orderItemId, itemId),
  })

  return NextResponse.json(submission ?? null)
}
