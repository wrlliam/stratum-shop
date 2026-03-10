import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockCouponsFindFirst = vi.fn()
const mockSelectWhere = vi.fn().mockResolvedValue([{ count: 2, total: 5000 }])

vi.mock('@/lib/db', () => {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: (...args: unknown[]) => mockSelectWhere(...args),
    groupBy: vi.fn().mockResolvedValue([]),
  }
  return {
    db: {
      query: {
        coupons: { findFirst: (...args: unknown[]) => mockCouponsFindFirst(...args) },
      },
      select: vi.fn(() => selectChain),
    },
    coupons: { code: 'code', active: 'active' },
    orders: { userId: 'userId', status: 'status', total: 'total' },
  }
})

const mockEvaluateConditions = vi.fn().mockReturnValue({ valid: true })
vi.mock('@/lib/coupon-conditions', () => ({
  evaluateConditions: (...args: unknown[]) => mockEvaluateConditions(...args),
}))

const makeRequest = (body: object) =>
  new NextRequest('http://localhost:3000/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  })

const baseCoupon = {
  id: 'coupon-1',
  code: 'SAVE10',
  type: 'percentage',
  value: 10,
  active: true,
  expiresAt: null,
  maxUses: null,
  usedCount: 0,
  minOrderAmount: null,
  conditions: null,
}

describe('POST /api/coupons/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(null)
    mockSelectWhere.mockResolvedValue([{ count: 0 }, { total: 0 }])
  })

  it('returns 400 for unknown coupon code', async () => {
    mockCouponsFindFirst.mockResolvedValue(null)
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'INVALID', subtotal: 1000 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/invalid/i)
  })

  it('returns 400 for inactive coupon', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, active: false })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/no longer active/i)
  })

  it('returns 400 for expired coupon', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, expiresAt: new Date(past) })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/expired/i)
  })

  it('returns 400 when max uses exceeded', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, maxUses: 5, usedCount: 5 })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/usage limit/i)
  })

  it('returns 400 when below minimum order amount', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, minOrderAmount: 2000 })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/minimum order/i)
  })

  it('returns correct discountAmount for percentage coupon', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, type: 'percentage', value: 20 })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.discountAmount).toBe(200) // 20% of 1000
    expect(data.valid).toBe(true)
  })

  it('returns correct discountAmount for fixed coupon capped at subtotal', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, type: 'fixed', value: 5000 })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.discountAmount).toBe(1000) // capped at subtotal
  })

  it('returns correct discountAmount for fixed coupon below subtotal', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon, type: 'fixed', value: 300 })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.discountAmount).toBe(300)
  })

  it('returns 400 when conditions fail', async () => {
    mockEvaluateConditions.mockReturnValueOnce({ valid: false })
    mockCouponsFindFirst.mockResolvedValue({
      ...baseCoupon,
      conditions: [{ field: 'orderCount', operator: 'gte', value: 5 }],
    })
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer', createdAt: new Date() } })
    mockSelectWhere.mockResolvedValueOnce([{ count: 0 }]).mockResolvedValueOnce([{ total: 0 }])
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(400)
  })

  it('returns 200 when no conditions are set', async () => {
    mockCouponsFindFirst.mockResolvedValue({ ...baseCoupon })
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ code: 'SAVE10', subtotal: 1000 }))
    expect(res.status).toBe(200)
  })
})
