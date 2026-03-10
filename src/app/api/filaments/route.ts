import { NextResponse } from 'next/server'
import { db, filaments } from '@/lib/db'
import { eq } from 'drizzle-orm'

// Public endpoint — returns active filaments for dropdowns in product form
export async function GET() {
  const all = await db.select().from(filaments).where(eq(filaments.active, true))
  return NextResponse.json(all)
}
