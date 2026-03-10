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
const mockSettingsFindFirst = vi.fn()
const mockTimeFindMany = vi.fn()
const mockCostFindMany = vi.fn()
const mockSelectFromWhere = vi.fn()
const mockInsertReturning = vi.fn()
const mockDeleteWhere = vi.fn()

vi.mock('@/lib/db', () => {
  const selectChain = {
    from: vi.fn(() => ({
      where: (...args: unknown[]) => mockSelectFromWhere(...args),
    })),
  }
  return {
    db: {
      select: vi.fn(() => selectChain),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ returning: () => mockInsertReturning() })),
      })),
      delete: vi.fn(() => ({
        where: (...args: unknown[]) => mockDeleteWhere(...args),
      })),
      query: {
        user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
        settings: { findFirst: (...args: unknown[]) => mockSettingsFindFirst(...args) },
        timeEntries: { findMany: (...args: unknown[]) => mockTimeFindMany(...args) },
        costEntries: { findMany: (...args: unknown[]) => mockCostFindMany(...args) },
      },
    },
    timeEntries: { minutes: 'minutes', createdAt: 'createdAt' },
    costEntries: { amountPence: 'amountPence', createdAt: 'createdAt' },
    settings: { key: 'key' },
    user: {},
  }
})

const adminSession = { user: { id: 'admin-1', role: 'admin' } }
const jsonHeaders = { 'Content-Type': 'application/json' }

describe('GET /api/admin/costs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 if not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 if not admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-1', role: 'customer' })
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns aggregated costs for current month', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    // sum(minutes) and sum(amountPence) calls
    mockSelectFromWhere
      .mockResolvedValueOnce([{ total: '120' }])   // totalMinutes
      .mockResolvedValueOnce([{ total: '5000' }])   // totalCosts
    mockTimeFindMany.mockResolvedValue([])
    mockCostFindMany.mockResolvedValue([])
    mockSettingsFindFirst.mockResolvedValue({ key: 'hourly_rate_pence', value: '2000' })

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalMinutes).toBe(120)
    expect(data.totalCostsPence).toBe(5000)
    expect(data.hourlyRatePence).toBe(2000)
    expect(data.labourCostPence).toBe(Math.round((120 / 60) * 2000))
  })

  it('filters by month query param', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockSelectFromWhere
      .mockResolvedValueOnce([{ total: '60' }])
      .mockResolvedValueOnce([{ total: '1000' }])
    mockTimeFindMany.mockResolvedValue([])
    mockCostFindMany.mockResolvedValue([])
    mockSettingsFindFirst.mockResolvedValue(null) // default rate

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs?month=2025-06')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalMinutes).toBe(60)
    // Default hourly rate is 1500 when no setting row
    expect(data.hourlyRatePence).toBe(1500)
  })
})

describe('POST /api/admin/costs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 if not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ type: 'time', description: 'Test', minutes: 30 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 if not admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-1', role: 'customer' })
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ type: 'time', description: 'Test', minutes: 30 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('creates time entry with valid data', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    const mockEntry = { id: 'te-1', adminId: 'admin-1', description: 'Printing', minutes: 45 }
    mockInsertReturning.mockResolvedValue([mockEntry])

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ type: 'time', description: 'Printing', minutes: 45 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.description).toBe('Printing')
    expect(data.minutes).toBe(45)
  })

  it('creates cost entry with valid data', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    const mockEntry = { id: 'ce-1', adminId: 'admin-1', type: 'electricity', description: 'Power bill', amountPence: 2500 }
    mockInsertReturning.mockResolvedValue([mockEntry])

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ type: 'cost', costType: 'electricity', description: 'Power bill', amountPence: 2500 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.type).toBe('electricity')
    expect(data.amountPence).toBe(2500)
  })

  it('returns 400 for invalid data', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ type: 'time', description: '', minutes: -5 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 415 for non-JSON Content-Type', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/admin/costs', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(415)
  })
})
