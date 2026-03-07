import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user, orders } from '@/lib/db/schema'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend'
import { eq, and, inArray } from 'drizzle-orm'
import { z } from 'zod'

const sendSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  recipientType: z.enum(['all', 'with_orders', 'selected']),
  selectedIds: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

  try {
    const body = await request.json()
    const data = sendSchema.parse(body)

    let recipients: Array<{ id: string; name: string; email: string }>

    if (data.recipientType === 'selected' && data.selectedIds?.length) {
      recipients = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(and(eq(user.marketingEmails, true), inArray(user.id, data.selectedIds)))
    } else if (data.recipientType === 'with_orders') {
      const usersWithOrders = await db
        .selectDistinct({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .innerJoin(orders, eq(orders.userId, user.id))
        .where(and(eq(user.marketingEmails, true), eq(orders.status, 'paid')))
      recipients = usersWithOrders
    } else {
      recipients = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.marketingEmails, true))
    }

    if (recipients.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No eligible recipients' })
    }

    // Batch send via Resend (max 50 per batch)
    const BATCH_SIZE = 50
    let sent = 0
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE)
      const unsubToken = (id: string) => Buffer.from(id).toString('base64')

      await resend.batch.send(
        batch.map((r) => ({
          from: FROM_EMAIL,
          to: r.email,
          subject: data.subject,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
            <p>Hi ${r.name},</p>
            ${data.body.replace(/\n/g, '<br>')}
            <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
            <p style="color:#999;font-size:11px">You're receiving this because you opted in to marketing emails from Stratum.<br>
            <a href="${APP_URL}/unsubscribe?token=${unsubToken(r.id)}" style="color:#999">Unsubscribe</a></p>
          </div>`,
        }))
      )
      sent += batch.length
    }

    return NextResponse.json({ sent, total: recipients.length })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}
