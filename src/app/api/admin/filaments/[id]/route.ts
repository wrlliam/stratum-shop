import { NextRequest, NextResponse } from 'next/server'
import { db, filaments } from '@/lib/db'
import { requireAdmin, requireJsonContentType } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  brand: z.string().optional(),
  material: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(50).optional(),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  pricePerKgPence: z.number().int().positive().optional(),
  weightRemainingGrams: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean().optional(),
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
    const data = updateSchema.parse(await request.json())
    const [updated] = await db.update(filaments).set({ ...data, updatedAt: new Date() }).where(eq(filaments.id, id)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await logAuditEvent({
      adminId: authResult.userId,
      action: 'filament.updated',
      entityType: 'filament',
      entityId: id,
    })

    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  await db.delete(filaments).where(eq(filaments.id, id))

  await logAuditEvent({
    adminId: authResult.userId,
    action: 'filament.deleted',
    entityType: 'filament',
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
