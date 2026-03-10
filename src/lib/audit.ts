import { db, auditLog } from '@/lib/db'

export async function logAuditEvent({
  adminId,
  action,
  entityType,
  entityId,
  metadata,
  ipAddress,
}: {
  adminId: string
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}) {
  try {
    await db.insert(auditLog).values({
      adminId,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
      ipAddress: ipAddress ?? null,
    })
  } catch (err) {
    // Audit log failure should never break the main operation
    console.error('Failed to write audit log:', err)
  }
}
