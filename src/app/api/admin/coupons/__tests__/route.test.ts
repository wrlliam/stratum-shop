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
const mockSelect = vi.fn()
const mockInsertReturning = vi.fn()
const mockUpdateReturning = vi.fn()
const mockDeleteWhere = vi.fn()

vi.mock('@/lib/db', () => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn(() => mockSelect()),
  }

  return {
    db: {
      select: vi.fn(() => selectChain),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: () => mockInsertReturning(),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: () => mockUpdateReturning(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: (...args: unknown[]) => mockDeleteWhere(...args),
      })),
    },
    coupons: { id: 'id', code: 'code', createdAt: 'createdAt' },
  }
})

describe('GET /api/admin/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ user: { role: 'customer' } })

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns coupons for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    const mockCoupons = [
      { id: '1', code: 'SAVE10', type: 'percentage', value: 10 },
    ]
    mockSelect.mockResolvedValue(mockCoupons)

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual(mockCoupons)
  })
})

describe('POST /api/admin/coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ code: 'TEST', type: 'fixed', value: 500 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates coupon for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    const created = { id: '1', code: 'NEWCODE', type: 'fixed', value: 500 }
    mockInsertReturning.mockResolvedValue([created])

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ code: 'newcode', type: 'fixed', value: 500 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 for invalid coupon data', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify({ code: '', type: 'invalid', value: -1 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/admin/coupons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)

    const { PATCH } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons/1', {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('updates coupon for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockUpdateReturning.mockResolvedValue([{ id: '1', active: false }])

    const { PATCH } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons/1', {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent coupon', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockUpdateReturning.mockResolvedValue([])

    const { PATCH } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ active: false }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/coupons/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)

    const { DELETE } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons/1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })

  it('deletes coupon for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } })
    mockDeleteWhere.mockResolvedValue(undefined)

    const { DELETE } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/coupons/1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })
})
