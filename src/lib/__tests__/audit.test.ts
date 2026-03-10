import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockValues = vi.fn().mockReturnValue(Promise.resolve())
const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

vi.mock('@/lib/db', () => ({
  db: { insert: (...args: unknown[]) => mockInsert(...args) },
  auditLog: Symbol('auditLog'),
}))

import { logAuditEvent } from '../audit'
import { auditLog } from '@/lib/db'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('logAuditEvent', () => {
  it('inserts a record with all fields provided', async () => {
    await logAuditEvent({
      adminId: 'admin-1',
      action: 'update_order',
      entityType: 'order',
      entityId: 'order-42',
      metadata: { oldStatus: 'paid', newStatus: 'shipped' },
      ipAddress: '192.168.1.1',
    })

    expect(mockInsert).toHaveBeenCalledWith(auditLog)
    expect(mockValues).toHaveBeenCalledWith({
      adminId: 'admin-1',
      action: 'update_order',
      entityType: 'order',
      entityId: 'order-42',
      metadata: { oldStatus: 'paid', newStatus: 'shipped' },
      ipAddress: '192.168.1.1',
    })
  })

  it('defaults optional fields to null', async () => {
    await logAuditEvent({
      adminId: 'admin-2',
      action: 'delete_product',
      entityType: 'product',
    })

    expect(mockValues).toHaveBeenCalledWith({
      adminId: 'admin-2',
      action: 'delete_product',
      entityType: 'product',
      entityId: null,
      metadata: null,
      ipAddress: null,
    })
  })

  it('does not throw when the DB insert fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockValues.mockRejectedValueOnce(new Error('DB connection lost'))

    await expect(
      logAuditEvent({
        adminId: 'admin-3',
        action: 'fail_test',
        entityType: 'test',
      })
    ).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith('Failed to write audit log:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('passes correct table reference to db.insert', async () => {
    await logAuditEvent({
      adminId: 'admin-4',
      action: 'create_coupon',
      entityType: 'coupon',
      entityId: 'coupon-99',
    })

    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockInsert.mock.calls[0][0]).toBe(auditLog)
  })
})
