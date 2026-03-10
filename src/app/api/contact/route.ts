import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  orderNumber: z.string().optional(),
  message: z.string().min(1),
  modelUrl: z.string().optional(),
  modelName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    // For now, log the contact form submission
    // In production, this would send an email via Resend
    console.log('Contact form submission:', data)

    // TODO: Send email notification via Resend
    // await getResend().emails.send({
    //   from: 'Stratum <noreply@stratum3d.co.uk>',
    //   to: 'hello@stratum3d.co.uk',
    //   subject: `Contact form: ${data.name}`,
    //   text: `Name: ${data.name}\nEmail: ${data.email}\nOrder: ${data.orderNumber || 'N/A'}\n\n${data.message}`,
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
