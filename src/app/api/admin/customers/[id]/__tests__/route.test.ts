import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockUserFindFirst = vi.fn()
const mockOrdersFindMany = vi.fn()
const mockUpdateReturning = vi.fn()
const mockLogAuditEvent = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
      orders: { findMany: (...args: unknown[]) => mockOrdersFindMany(...args) },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: () => mockUpdateReturning(),
        })),
      })),
    })),
  },
  user: { id: 'id', role: 'role' },
  orders: { userId: 'userId', createdAt: 'createdAt' },
}))

vi.mock('@/lib/audit', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
}))

const adminSession = { user: { id: 'admin-1', role: 'admin' } }
const jsonHeaders = { 'Content-Type': 'application/json' }

const mockCustomer = {
  id: 'user-1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'customer',
  createdAt: '2025-01-01',
}

const mockOrder = {
  id: 'order-1',
  status: 'paid',
  total: 5000,
  items: [{ id: 'item-1', name: 'Widget', quantity: 1 }],
}

describe('GET /api/admin/customers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: admin auth passes (requireAdmin does two calls: session + db lookup)
    mockGetSession.mockResolvedValue(adminSession)
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for unauthenticated user', async () => {
    mockGetSession.mockResolvedValue(null)
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-2', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-2', role: 'customer' })
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns customer with orders', async () => {
    // First call from requireAdmin (db role lookup), second from route (find customer)
    mockUserFindFirst
      .mockResolvedValueOnce({ id: 'admin-1', role: 'admin' })
      .mockResolvedValueOnce(mockCustomer)
    mockOrdersFindMany.mockResolvedValue([mockOrder])
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.customer.name).toBe('Jane Doe')
    expect(data.orders).toHaveLength(1)
    expect(data.orders[0].id).toBe('order-1')
  })

  it('returns 404 if customer not found', async () => {
    mockUserFindFirst
      .mockResolvedValueOnce({ id: 'admin-1', role: 'admin' })
      .mockResolvedValueOnce(null)
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/nonexistent')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/admin/customers/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(adminSession)
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
    mockLogAuditEvent.mockResolvedValue(undefined)
  })

  it('updates role with valid data', async () => {
    const updatedUser = { ...mockCustomer, role: 'customer_service' }
    mockUpdateReturning.mockResolvedValue([updatedUser])
    const { PATCH } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/user-1', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ role: 'customer_service' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.role).toBe('customer_service')
  })

  it('prevents self-demotion', async () => {
    const { PATCH } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/admin-1', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ role: 'customer' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'admin-1' }) })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('own admin role')
  })

  it('creates audit log entry on role update', async () => {
    const updatedUser = { ...mockCustomer, role: 'admin' }
    mockUpdateReturning.mockResolvedValue([updatedUser])
    const { PATCH } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers/user-1', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ role: 'admin' }),
    })
    await PATCH(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(mockLogAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: 'customer.role_updated',
        entityType: 'user',
        entityId: 'user-1',
        metadata: { newRole: 'admin' },
      })
    )
  })
})
