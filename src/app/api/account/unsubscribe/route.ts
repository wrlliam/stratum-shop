import { NextRequest, NextResponse } from 'next/server'
import { db, user } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({ token: z.string().min(1) })

// Token is base64(userId) — simple, stateless, no expiry needed for unsubscribe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = schema.parse(body)

    let userId: string
    try {
      userId = Buffer.from(token, 'base64').toString('utf8')
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const found = await db.query.user.findFirst({ where: eq(user.id, userId) })
    if (!found) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await db.update(user).set({ marketingEmails: false, updatedAt: new Date() }).where(eq(user.id, userId))
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unsubscribe failed' }, { status: 500 })
  }
}
