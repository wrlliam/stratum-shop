import { NextRequest, NextResponse } from 'next/server'
import { db, user } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  marketingEmails: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { marketingEmails } = schema.parse(body)

    await db
      .update(user)
      .set({ marketingEmails, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
  }
}
