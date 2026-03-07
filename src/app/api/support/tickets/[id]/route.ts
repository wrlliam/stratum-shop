import { NextRequest, NextResponse } from 'next/server'
import { db, supportTickets, supportMessages } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { resend, FROM_EMAIL, APP_URL } from '@/lib/resend'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { markdownToHtml } from '@/lib/utils'
import { publishEvent } from '@/lib/redis'

function emailWrap(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="padding:40px 16px">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#1a1a2e;border-radius:12px 12px 0 0;padding:20px 28px;display:flex;align-items:center;gap:10px">
      <span style="font-family:monospace;font-size:17px;font-weight:700;color:#6CBCE3;letter-spacing:-0.5px">STRATUM</span>
      <span style="color:rgba(108,188,227,0.35);font-size:16px;margin:0 2px">|</span>
      <span style="color:#94a3b8;font-size:12px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase">Support</span>
    </div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;border:1px solid #e2e8f0;border-top:none">
      <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827">${title}</h2>
      ${body}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">Stratum &middot; Automated notification</p>
  </div>
</div>
</body></html>`
}

const replySchema = z.object({
  body: z.string().min(1).max(5000),
  attachmentUrl: z.string().url().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
})

const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})

async function getTicketAccess(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return { session: null, ticket: null, isStaff: false, isOwner: false }

  const ticket = await db.query.supportTickets.findFirst({
    where: eq(supportTickets.id, id),
    with: { messages: { orderBy: (m, { asc }) => asc(m.createdAt) } },
  })

  const isStaff = ['admin', 'customer_service'].includes(session.user.role ?? '')
  const isOwner = !!ticket && (
    ticket.userId === session.user.id ||
    ticket.email === session.user.email
  )

  return { session, ticket, isStaff, isOwner }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { ticket, isStaff, isOwner } = await getTicketAccess(id)

  if (!isStaff && !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { session, ticket, isStaff, isOwner } = await getTicketAccess(id)

  if (!session || (!isStaff && !isOwner)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const body = await request.json()
    const data = replySchema.parse(body)

    const [message] = await db
      .insert(supportMessages)
      .values({
        ticketId: id,
        senderUserId: session.user.id,
        senderEmail: session.user.email,
        body: data.body,
        attachmentUrl: data.attachmentUrl ?? null,
      })
      .returning()

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    // Only staff can change status
    if (isStaff && data.status) updates.status = data.status

    await db.update(supportTickets).set(updates).where(eq(supportTickets.id, id))

    const ref = id.slice(0, 8).toUpperCase()
    const attachmentHtml = data.attachmentUrl
      ? `<div style="margin-top:12px"><img src="${data.attachmentUrl}" alt="Attachment" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0" /></div>`
      : ''

    if (isStaff) {
      // Staff replied → notify customer
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ticket.email,
        subject: `Re: ${ticket.subject} — Stratum Support`,
        html: emailWrap(`Reply to your ticket`, `
          <p style="color:#374151;line-height:1.6;margin:0 0 16px">Hi ${ticket.name},</p>
          <p style="color:#374151;line-height:1.6;margin:0 0 20px">Our support team has replied to your ticket.</p>
          <div style="background:#f0f9ff;border-radius:8px;padding:16px;margin-bottom:20px;border-left:3px solid #6CBCE3;font-size:14px;color:#374151;line-height:1.6">
            ${markdownToHtml(data.body)}
            ${attachmentHtml}
          </div>
          <p style="font-size:12px;color:#94a3b8;margin:0 0 4px">Ticket ref: <strong style="color:#64748b">${ref}</strong> &middot; Subject: ${ticket.subject}</p>
          <a href="${APP_URL}/support/${id}" style="display:inline-block;margin-top:16px;padding:11px 22px;background:#6CBCE3;color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">View &amp; Reply →</a>
        `),
      }).catch(console.error)
    } else {
      // Customer replied → notify admin
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: adminEmail,
          subject: `[Support] Customer replied: ${ticket.subject}`,
          html: emailWrap('Customer reply', `
            <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;margin-bottom:16px;border-left:3px solid #6CBCE3">
              <p style="margin:0;font-size:13px;color:#374151"><strong>${ticket.name}</strong> &lt;${ticket.email}&gt; replied to ticket <strong>${ref}</strong></p>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;font-size:14px;color:#374151;line-height:1.6">
              ${markdownToHtml(data.body)}
              ${attachmentHtml}
            </div>
            <a href="${APP_URL}/admin/support/${id}" style="display:inline-block;padding:11px 22px;background:#6CBCE3;color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">View Ticket →</a>
          `),
        }).catch(console.error)
      }
    }

    await publishEvent({ type: 'ticket_updated', ticketId: id, status: updates.status as string ?? ticket.status })

    return NextResponse.json(message)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { isStaff } = await getTicketAccess(id)

  if (!isStaff) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { status } = statusSchema.parse(body)

    const [ticket] = await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning()

    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await publishEvent({ type: 'ticket_updated', ticketId: id, status })
    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
