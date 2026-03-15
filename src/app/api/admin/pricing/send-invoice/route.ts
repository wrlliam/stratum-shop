import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-guard'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { z } from 'zod'

const invoiceSchema = z.object({
  email: z.string().email(),
  subject: z.string().max(200).optional(),
  invoiceHtml: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const data = invoiceSchema.parse(body)

    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: data.subject || 'Cost Estimate — Stratum',
      html: data.invoiceHtml,
    })

    console.log('Invoice email sent:', JSON.stringify(result), 'to:', data.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      )
    }
    console.error('Invoice email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
