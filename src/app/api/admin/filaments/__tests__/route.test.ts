import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockSelectOrderBy = vi.fn()
const mockInsertReturning = vi.fn()
const mockUpdateReturning = vi.fn()
const mockDeleteWhere = vi.fn()
const mockUserFindFirst = vi.fn()

vi.mock('@/lib/db', () => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    orderBy: vi.fn(() => mockSelectOrderBy()),
  }
  return {
    db: {
      select: vi.fn(() => selectChain),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ returning: () => mockInsertReturning() })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({ returning: () => mockUpdateReturning() })),
        })),
      })),
      delete: vi.fn(() => ({
        where: (...args: unknown[]) => mockDeleteWhere(...args),
      })),
      query: {
        user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
      },
    },
    filaments: { id: 'id', createdAt: 'createdAt' },
    user: {},
  }
})

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

const adminSession = { user: { id: 'admin-1', role: 'admin' } }
const mockFilament = {
  id: 'fil-1',
  brand: 'Bambu',
  material: 'PLA',
  color: 'Red',
  colorHex: '#FF0000',
  pricePerKgPence: 1799,
  weightRemainingGrams: 800,
  active: true,
}

const jsonHeaders = { 'Content-Type': 'application/json' }

describe('GET /api/admin/filaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for unauthenticated user', async () => {
    mockGetSession.mockResolvedValue(null)
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-1', role: 'customer' })
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns filament list for admin', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockSelectOrderBy.mockResolvedValue([mockFilament])
    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].material).toBe('PLA')
  })
})

describe('POST /api/admin/filaments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ material: 'PLA', color: 'Red', pricePerKgPence: 1799 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates filament with valid data', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockInsertReturning.mockResolvedValue([mockFilament])
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ material: 'PLA', color: 'Red', pricePerKgPence: 1799 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 for missing required fields', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ material: 'PLA' }), // missing color and pricePerKgPence
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/admin/filaments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)
    const { PATCH } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments/fil-1', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ active: false }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'fil-1' }) })
    expect(res.status).toBe(401)
  })

  it('updates filament for admin', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockUpdateReturning.mockResolvedValue([{ ...mockFilament, active: false }])
    const { PATCH } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments/fil-1', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ active: false }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'fil-1' }) })
    expect(res.status).toBe(200)
  })

  it('returns 404 for non-existent filament', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockUpdateReturning.mockResolvedValue([])
    const { PATCH } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments/nonexistent', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ active: false }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/admin/filaments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for non-admin', async () => {
    mockGetSession.mockResolvedValue(null)
    const { DELETE } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments/fil-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'fil-1' }) })
    expect(res.status).toBe(401)
  })

  it('deletes filament for admin', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockDeleteWhere.mockResolvedValue(undefined)
    const { DELETE } = await import('../[id]/route')
    const req = new NextRequest('http://localhost:3000/api/admin/filaments/fil-1', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'fil-1' }) })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
