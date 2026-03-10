import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockSelectResult = vi.fn()
const mockCountResult = vi.fn()
const mockUserFindFirst = vi.fn()

vi.mock('@/lib/db', () => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn(() => mockSelectResult()),
  }
  const countChain = {
    from: vi.fn(() => mockCountResult()),
  }
  let callCount = 0
  return {
    db: {
      select: vi.fn(() => {
        callCount++
        // First call is the main query, second is the count
        if (callCount % 2 === 1) return selectChain
        return countChain
      }),
      query: {
        user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
      },
    },
    user: { id: 'id', name: 'name', email: 'email', role: 'role', marketingEmails: 'marketingEmails', createdAt: 'createdAt' },
    orders: { id: 'id', userId: 'userId', status: 'status', total: 'total' },
  }
})

const adminSession = { user: { id: 'admin-1', role: 'admin' } }

const mockCustomer = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'customer',
  marketingEmails: true,
  createdAt: '2025-01-01',
  orderCount: 3,
  totalSpent: 15000,
}

describe('GET /api/admin/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for unauthenticated user', async () => {
    mockGetSession.mockResolvedValue(null)
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-1', role: 'customer' })
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns paginated customer list', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockSelectResult.mockResolvedValue([mockCustomer])
    mockCountResult.mockResolvedValue([{ count: 1 }])
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers?limit=10&offset=0')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.customers).toHaveLength(1)
    expect(data.customers[0].name).toBe('John Doe')
  })

  it('filters by search query', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockSelectResult.mockResolvedValue([mockCustomer])
    mockCountResult.mockResolvedValue([{ count: 1 }])
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers?search=john')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.customers).toHaveLength(1)
  })

  it('returns correct aggregated orderCount and totalSpent', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockSelectResult.mockResolvedValue([mockCustomer])
    mockCountResult.mockResolvedValue([{ count: 1 }])
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers')
    const res = await GET(req)
    const data = await res.json()
    expect(data.customers[0].orderCount).toBe(3)
    expect(data.customers[0].totalSpent).toBe(15000)
  })

  it('returns total count for pagination', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockSelectResult.mockResolvedValue([mockCustomer])
    mockCountResult.mockResolvedValue([{ count: 42 }])
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/customers')
    const res = await GET(req)
    const data = await res.json()
    expect(data.total).toBe(42)
  })
})
