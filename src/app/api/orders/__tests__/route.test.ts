import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

// Mock auth
const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}))

// Mock db
const mockFindMany = vi.fn()
const mockFindFirst = vi.fn()
const mockUpdateSet = vi.fn()
const mockUpdateWhere = vi.fn()
const mockUpdateReturning = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      orders: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    update: vi.fn(() => ({
      set: (...args: unknown[]) => {
        mockUpdateSet(...args)
        return {
          where: (...whereArgs: unknown[]) => {
            mockUpdateWhere(...whereArgs)
            return { returning: () => mockUpdateReturning() }
          },
        }
      },
    })),
  },
  orders: { id: 'id', status: 'status', userId: 'userId', createdAt: 'createdAt', email: 'email' },
  orderItems: {},
}))

// Mock email dependencies
vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: vi.fn() } },
  FROM_EMAIL: 'test@stratum.store',
  APP_URL: 'http://localhost:3000',
}))

vi.mock('@react-email/components', () => ({
  renderAsync: vi.fn().mockResolvedValue('<html>email</html>'),
}))

vi.mock('@/lib/email/order-shipped', () => ({
  OrderShippedEmail: vi.fn(),
}))

vi.mock('@/lib/email/order-status-update', () => ({
  OrderStatusUpdateEmail: vi.fn(),
}))

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('../../orders/route')
    const req = new NextRequest('http://localhost:3000/api/orders')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns orders for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    const mockOrders = [
      { id: 'order-1', orderNumber: 'STR-001', status: 'paid', items: [] },
    ]
    mockFindMany.mockResolvedValue(mockOrders)

    const { GET } = await import('../../orders/route')
    const req = new NextRequest('http://localhost:3000/api/orders')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockOrders)
  })
})

describe('GET /api/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent order', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockFindFirst.mockResolvedValue(null)

    const { GET } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/nonexistent')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 when user tries to access another user order', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockFindFirst.mockResolvedValue({
      id: 'order-1',
      userId: 'user-2',
      items: [],
    })

    const { GET } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns order for owner', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    const order = { id: 'order-1', userId: 'user-1', orderNumber: 'STR-001', items: [] }
    mockFindFirst.mockResolvedValue(order)

    const { GET } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.orderNumber).toBe('STR-001')
  })

  it('returns any order for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    const order = { id: 'order-1', userId: 'user-2', items: [] }
    mockFindFirst.mockResolvedValue(order)

    const { GET } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })

    const { PATCH } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'shipped' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent order', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockFindFirst.mockResolvedValue(null)

    const { PATCH } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'shipped' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })

    const { PATCH } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid-status' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(400)
  })

  it('updates order status for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    const order = { id: 'order-1', status: 'paid', email: 'test@test.com', items: [] }
    mockFindFirst
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, status: 'processing' })

    const { PATCH } = await import('../../orders/[id]/route')
    const req = new NextRequest('http://localhost:3000/api/orders/order-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'processing' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'order-1' }) })
    expect(res.status).toBe(200)
  })
})
