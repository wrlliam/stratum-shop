import { NextRequest, NextResponse } from 'next/server'
import { db, banners } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { z } from 'zod'

const updateBannerSchema = z.object({
  message: z.string().min(1).optional(),
  type: z.enum(['info', 'sale', 'warning', 'success']).optional(),
  link: z.string().nullable().optional(),
  linkText: z.string().optional().nullable(),
  active: z.boolean().optional(),
  dismissible: z.boolean().optional(),
  opacity: z.number().int().min(0).max(100).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
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

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'banner.updated',
      entityType: 'banner',
      entityId: id,
    })

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
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    await db.delete(banners).where(eq(banners.id, id))

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'banner.deleted',
      entityType: 'banner',
      entityId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}
