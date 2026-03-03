import { NextResponse } from 'next/server'
import { db, banners } from '@/lib/db'
import { and, eq, or, isNull, gt } from 'drizzle-orm'

export async function GET() {
  try {
    const now = new Date()
    const banner = await db.query.banners.findFirst({
      where: and(
        eq(banners.active, true),
        or(isNull(banners.expiresAt), gt(banners.expiresAt, now))
      ),
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    })
    return NextResponse.json(banner ?? null)
  } catch (error) {
    console.error('Failed to fetch banner:', error)
    return NextResponse.json(null)
  }
}
