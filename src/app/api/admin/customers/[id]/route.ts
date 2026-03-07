import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, orders } from '@/lib/db/schema'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const customer = await db.query.user.findFirst({
      where: eq(user.id, id),
    })

    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const customerOrders = await db.query.orders.findMany({
      where: eq(orders.userId, id),
      with: { items: true },
      orderBy: desc(orders.createdAt),
    })

    return NextResponse.json({ customer, orders: customerOrders })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

const roleSchema = z.object({
  role: z.enum(['customer', 'admin', 'customer_service']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

  const { id } = await params

  try {
    const body = await request.json()
    const { role } = roleSchema.parse(body)

    // Prevent self-demotion
    if (id === authResult.userId && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own admin role' }, { status: 400 })
    }

    const [updated] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'customer.role_updated',
      entityType: 'user',
      entityId: id,
      metadata: { newRole: role },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
