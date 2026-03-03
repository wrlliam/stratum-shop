import { NextRequest, NextResponse } from 'next/server'
import { db, banners } from '@/lib/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { desc } from 'drizzle-orm'
import { z } from 'zod'

const createBannerSchema = z.object({
  message: z.string().min(1),
  type: z.enum(['info', 'sale', 'warning', 'success']).default('info'),
  link: z.string().nullable().optional(),
  linkText: z.string().nullable().optional(),
  active: z.boolean().default(true),
  dismissible: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
})

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const all = await db.select().from(banners).orderBy(desc(banners.createdAt))
    return NextResponse.json(all)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      })
      .returning()

    return NextResponse.json(banner)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}
