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

// Mock db - chain pattern for complex select queries
const mockSelectResult = vi.fn()
const mockFindMany = vi.fn()
const mockUserFindFirst = vi.fn()

vi.mock('@/lib/db', () => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(() => mockSelectResult()),
  }

  // Make chain itself thenable for queries without .limit()
  const selectChain = {
    ...chain,
    then: (resolve: (v: unknown) => void) => resolve(mockSelectResult()),
  }

  return {
    db: {
      query: {
        orders: {
          findMany: (...args: unknown[]) => mockFindMany(...args),
        },
        user: {
          findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
        },
      },
      select: vi.fn(() => selectChain),
    },
    orders: { id: 'id', status: 'status', createdAt: 'createdAt', email: 'email' },
    orderItems: { name: 'name', quantity: 'quantity', price: 'price' },
    products: { id: 'id', name: 'name', stock: 'stock', active: 'active' },
    supportTickets: { status: 'status' },
    user: {},
  }
})

// Mock redis — no caching in tests
vi.mock('@/lib/redis', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  STATS_CACHE_KEY: 'stratum:cache:admin:stats',
  STATS_TTL: 60,
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  subMonths: vi.fn((d: Date) => new Date(d.getTime() - 30 * 24 * 60 * 60 * 1000)),
  subDays: vi.fn((d: Date, days: number) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000)),
  startOfMonth: vi.fn((d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)),
  startOfDay: vi.fn((d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())),
  format: vi.fn((_d: Date, fmt: string) => {
    if (fmt === 'yyyy-MM') return '2025-01'
    if (fmt === 'MMM yyyy') return 'Jan 2025'
    if (fmt === 'yyyy-MM-dd') return '2025-01-01'
    if (fmt === 'dd MMM') return '01 Jan'
    return '2025-01-01'
  }),
}))

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 403 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-1', role: 'customer' })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/stats')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 401 for unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/stats')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns stats for admin users', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    // Mock various db results for the stats queries
    mockSelectResult.mockResolvedValue([{ total: 50000, count: 10, avg: 5000, min: 1000, max: 10000, email: 'test@test.com', orderCount: 2, month: '2025-01', revenue: 5000, day: '2025-01-01', name: 'Product', sales: 5, status: 'paid', stock: 3, id: '1' }])
    mockFindMany.mockResolvedValue([
      { id: '1', orderNumber: 'STR-001', status: 'paid', total: 5000, items: [] },
    ])

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/stats')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('totalRevenue')
    expect(data).toHaveProperty('totalOrders')
    expect(data).toHaveProperty('totalProducts')
    expect(data).toHaveProperty('revenueByMonth')
    expect(data).toHaveProperty('lowStockProducts')
    expect(data).toHaveProperty('repeatCustomerRate')
  })
})
