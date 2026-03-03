import { NextRequest, NextResponse } from 'next/server'
import { db, banners } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { z } from 'zod'

const updateBannerSchema = z.object({
  message: z.string().min(1).optional(),
  type: z.enum(['info', 'sale', 'warning', 'success']).optional(),
  link: z.string().nullable().optional(),
  linkText: z.string().optional().nullable(),
  active: z.boolean().optional(),
  dismissible: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

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
    const data = updateBannerSchema.parse(body)

    const updates: Record<string, unknown> = { ...data }
    if ('expiresAt' in data) {
      updates.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
    }
    if ('link' in data) {
      updates.link = data.link || null
    }

    const [banner] = await db
      .update(banners)
      .set(updates)
      .where(eq(banners.id, id))
      .returning()

    if (!banner) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(banner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    await db.delete(banners).where(eq(banners.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
