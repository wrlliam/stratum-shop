import { NextRequest, NextResponse } from 'next/server'
import { db, supportTickets, supportMessages } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { FROM_EMAIL, APP_URL, getResend } from '@/lib/resend'
import { eq, desc } from 'drizzle-orm'
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
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">Stratum &middot; Automated notification &middot; Do not reply directly to this email</p>
  </div>
</div>
</body></html>`
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  orderNumber: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin/support sees all; customers see only their own
  if (['admin', 'customer_service'].includes(session.user.role ?? '')) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const all = await db.query.supportTickets.findMany({
      where: status ? eq(supportTickets.status, status) : undefined,
      orderBy: desc(supportTickets.updatedAt),
    })
    return NextResponse.json(all)
  }

  // Customer: return own tickets
  const own = await db.query.supportTickets.findMany({
    where: eq(supportTickets.userId, session.user.id),
    orderBy: desc(supportTickets.updatedAt),
  })
  return NextResponse.json(own)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    const session = await auth.api.getSession({ headers: await headers() })

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userId: session?.user?.id ?? null,
        email: data.email,
        name: data.name,
        subject: data.subject,
        status: 'open',
      })
      .returning()

    const messageBody = data.orderNumber
      ? `${data.body}\n\nOrder number: ${data.orderNumber}`
      : data.body

    await db.insert(supportMessages).values({
      ticketId: ticket.id,
      senderUserId: session?.user?.id ?? null,
      senderEmail: data.email,
      body: messageBody,
    })

    const ref = ticket.id.slice(0, 8).toUpperCase()

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: adminEmail,
        subject: `[Support] New ticket: ${data.subject}`,
        html: emailWrap('New Support Ticket', `
          <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:20px;border-left:3px solid #6CBCE3">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;font-weight:500">From</p>
            <p style="margin:0;font-size:15px;color:#111827;font-weight:600">${data.name} &lt;${data.email}&gt;</p>
          </div>
          <div style="margin-bottom:16px">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;font-weight:500">Subject</p>
            <p style="margin:0;font-size:15px;color:#111827;font-weight:600">${data.subject}</p>
          </div>
          ${data.orderNumber ? `<p style="font-size:13px;color:#64748b;margin:0 0 12px">Order: <strong style="color:#111827">${data.orderNumber}</strong></p>` : ''}
          <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;font-size:14px;color:#374151;line-height:1.6">${markdownToHtml(messageBody)}</div>
          <a href="${APP_URL}/admin/support/${ticket.id}" style="display:inline-block;padding:11px 22px;background:#6CBCE3;color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">View Ticket →</a>
          <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Ticket ref: ${ref}</p>
        `),
      }).catch(console.error)
    }

    // Confirmation to customer
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `We've received your message — Stratum Support`,
      html: emailWrap('Message received', `
        <p style="color:#374151;line-height:1.6;margin:0 0 16px">Hi ${data.name},</p>
        <p style="color:#374151;line-height:1.6;margin:0 0 20px">Thanks for getting in touch. We've received your support request and will reply as soon as possible — usually within one business day.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #6CBCE3">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Subject</p>
          <p style="margin:0;font-size:14px;color:#111827;font-weight:500">${data.subject}</p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:24px;border-left:3px solid #e2e8f0">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Your message</p>
          <div style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;margin-top:8px">${markdownToHtml(messageBody)}</div>
        </div>
        <p style="font-size:13px;color:#64748b;margin:0 0 4px">Your ticket reference:</p>
        <p style="font-size:18px;font-family:monospace;font-weight:700;color:#111827;margin:0 0 24px;letter-spacing:1px">${ref}</p>
        ${session?.user ? `<a href="${APP_URL}/support/${ticket.id}" style="display:inline-block;padding:11px 22px;background:#6CBCE3;color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">View your ticket →</a>` : ''}
      `),
    }).catch(console.error)

    await publishEvent({
      type: 'new_ticket',
      ticketId: ticket.id,
      subject: data.subject,
      name: data.name,
    })

    return NextResponse.json({ ticketId: ticket.id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
