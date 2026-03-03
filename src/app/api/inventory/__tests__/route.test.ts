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
const mockInsertReturning = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      printBatches: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
      products: {
        findFirst: (...args: unknown[]) => mockFindFirst(...args),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: () => mockInsertReturning(),
      })),
    })),
  },
  printBatches: { status: 'status', createdAt: 'createdAt' },
  products: { id: 'id' },
}))

describe('GET /api/inventory/batches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)

    const { GET } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns batches for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    const mockBatches = [
      { id: '1', productId: 'prod-1', quantity: 10, status: 'pending' },
    ]
    mockFindMany.mockResolvedValue(mockBatches)

    const { GET } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.batches).toEqual(mockBatches)
  })

  it('filters by status', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockFindMany.mockResolvedValue([])

    const { GET } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches?status=pending')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.anything(),
      })
    )
  })
})

describe('POST /api/inventory/batches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches', {
      method: 'POST',
      body: JSON.stringify({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 10,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 for non-existent product', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockFindFirst.mockResolvedValue(null)

    const { POST } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches', {
      method: 'POST',
      body: JSON.stringify({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 10,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('creates batch for admin with valid product', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockFindFirst.mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440000', name: 'Product' })
    const batch = { id: 'batch-1', productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 10, status: 'pending' }
    mockInsertReturning.mockResolvedValue([batch])

    const { POST } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches', {
      method: 'POST',
      body: JSON.stringify({
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 10,
        notes: 'Test batch',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 for invalid data', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })

    const { POST } = await import('../../inventory/batches/route')
    const req = new NextRequest('http://localhost:3000/api/inventory/batches', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'not-a-uuid',
        quantity: -1,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
