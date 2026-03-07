import { NextRequest, NextResponse } from 'next/server'
import { db, filaments } from '@/lib/db'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { desc } from 'drizzle-orm'
import { z } from 'zod'

export async function GET() {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const all = await db.select().from(filaments).orderBy(desc(filaments.createdAt))
  return NextResponse.json(all)
}

const schema = z.object({
  brand: z.string().optional(),
  material: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  pricePerKgPence: z.number().int().positive(),
  weightRemainingGrams: z.number().int().min(0).default(1000),
  notes: z.string().optional(),
  active: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const ctErr = requireJsonContentType(request)
  if (ctErr) return ctErr

  try {
    const data = schema.parse(await request.json())
    const [f] = await db.insert(filaments).values(data).returning()

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'filament.created',
      entityType: 'filament',
      entityId: f.id,
      metadata: { material: data.material, color: data.color },
    })

    return NextResponse.json(f, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
