import { NextRequest, NextResponse } from 'next/server'
import { db, banners } from '@/lib/db'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { desc } from 'drizzle-orm'
import { z } from 'zod'

const createBannerSchema = z.object({
  message: z.string().min(1),
  type: z.enum(['info', 'sale', 'warning', 'success']).default('info'),
  link: z.string().nullable().optional(),
  linkText: z.string().nullable().optional(),
  active: z.boolean().default(true),
  dismissible: z.boolean().default(true),
  opacity: z.number().int().min(0).max(100).default(100),
  expiresAt: z.string().datetime().optional().nullable(),
})

export async function GET() {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const all = await db.select().from(banners).orderBy(desc(banners.createdAt))
    return NextResponse.json(all)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

  try {
    const body = await request.json()
    const data = createBannerSchema.parse(body)

    const [banner] = await db
      .insert(banners)
      .values({
        message: data.message,
        type: data.type,
        link: data.link || null,
        linkText: data.linkText || null,
        active: data.active,
        dismissible: data.dismissible,
        opacity: data.opacity,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning()

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'banner.created',
      entityType: 'banner',
      entityId: banner.id,
      metadata: { message: data.message, type: data.type },
    })

    return NextResponse.json(banner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
