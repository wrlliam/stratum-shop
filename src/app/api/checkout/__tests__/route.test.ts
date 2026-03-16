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

// Mock Stripe
const mockStripeSessionCreate = vi.fn()
const mockStripeCouponCreate = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockStripeSessionCreate(...args),
      },
    },
    coupons: {
      create: (...args: unknown[]) => mockStripeCouponCreate(...args),
    },
  },
  getDeliveryOption: (id: string) => {
    const options: Record<string, { id: string; name: string; price: number }> = {
      royal_mail_2nd: { id: 'royal_mail_2nd', name: 'Royal Mail 2nd Class', price: 335 },
      royal_mail_1st: { id: 'royal_mail_1st', name: 'Royal Mail 1st Class', price: 455 },
    }
    return options[id] || null
  },
  calculateDeliveryPrice: (id: string) => {
    const prices: Record<string, number> = {
      royal_mail_2nd: 335,
      royal_mail_1st: 455,
    }
    return prices[id] ?? 335
  },
  VAT_RATE: 0.2,
}))

// Mock db
const mockProductFindFirst = vi.fn()
const mockBundleFindFirst = vi.fn()
const mockCouponFindFirst = vi.fn()
const mockInsertValues = vi.fn()
const mockInsertReturning = vi.fn()
const mockUpdateSet = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      products: {
        findFirst: (...args: unknown[]) => mockProductFindFirst(...args),
      },
      bundles: {
        findFirst: (...args: unknown[]) => mockBundleFindFirst(...args),
      },
      coupons: {
        findFirst: (...args: unknown[]) => mockCouponFindFirst(...args),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })),
    insert: vi.fn(() => ({
      values: (...args: unknown[]) => {
        mockInsertValues(...args)
        return {
          returning: () => mockInsertReturning(),
        }
      },
    })),
    update: vi.fn(() => ({
      set: (...args: unknown[]) => {
        mockUpdateSet(...args)
        return {
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }
      },
    })),
  },
  products: { id: 'id', active: 'active' },
  bundles: { id: 'id', active: 'active' },
  orders: { id: 'id' },
  orderItems: {},
  coupons: { id: 'id', code: 'code', usedCount: 'usedCount' },
  couponProducts: { couponId: 'couponId', productId: 'productId' },
  productOptionGroups: { order: 'order' },
  productOptionChoices: { order: 'order' },
}))

vi.mock('@/lib/utils', () => ({
  generateOrderNumber: () => 'STR-TEST-1234',
}))

vi.mock('@/lib/coupon-conditions', () => ({
  evaluateConditions: vi.fn().mockReturnValue({ valid: true }),
}))

const validCheckoutPayload = {
  items: [{ productId: 'prod-1', quantity: 1 }],
  deliveryMethodId: 'royal_mail_2nd',
  email: 'customer@example.com',
  address: {
    name: 'John Doe',
    line1: '123 Main St',
    city: 'London',
    postcode: 'SW1A 1AA',
  },
}

const mockProduct = {
  id: 'prod-1',
  name: 'Test Product',
  price: 2000,
  active: true,
  stock: 10,
  images: [{ url: '/img/product.jpg' }],
  optionGroups: [],
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(null)
    mockProductFindFirst.mockResolvedValue(mockProduct)
    mockInsertReturning.mockResolvedValue([{ id: 'order-1', orderNumber: 'STR-TEST-1234' }])
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })
  })

  it('creates a checkout session for valid payload', async () => {
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(validCheckoutPayload),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.url).toBeDefined()
    expect(data.sessionId).toBe('cs_test_123')
  })

  it('returns 400 for invalid delivery method', async () => {
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...validCheckoutPayload,
        deliveryMethodId: 'invalid_method',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid delivery method')
  })

  it('returns 400 for insufficient stock', async () => {
    mockProductFindFirst.mockResolvedValue({ ...mockProduct, stock: 0 })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...validCheckoutPayload,
        items: [{ productId: 'prod-1', quantity: 5 }],
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Insufficient stock')
  })

  it('returns 400 for invalid coupon code', async () => {
    mockCouponFindFirst.mockResolvedValue(null)

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...validCheckoutPayload,
        couponCode: 'INVALID',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid coupon code')
  })

  it('returns 400 for expired coupon', async () => {
    mockCouponFindFirst.mockResolvedValue({
      id: 'coupon-1',
      code: 'EXPIRED',
      active: true,
      expiresAt: new Date('2020-01-01'),
      type: 'percentage',
      value: 10,
    })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...validCheckoutPayload,
        couponCode: 'EXPIRED',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Coupon has expired')
  })

  it('returns 400 for coupon at max uses', async () => {
    mockCouponFindFirst.mockResolvedValue({
      id: 'coupon-1',
      code: 'MAXED',
      active: true,
      maxUses: 5,
      usedCount: 5,
      type: 'fixed',
      value: 500,
    })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...validCheckoutPayload,
        couponCode: 'MAXED',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Coupon usage limit reached')
  })

  it('returns 400 when order below coupon minimum', async () => {
    mockCouponFindFirst.mockResolvedValue({
      id: 'coupon-1',
      code: 'BIGORDER',
      active: true,
      minOrderAmount: 100000,
      type: 'percentage',
      value: 10,
    })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        ...validCheckoutPayload,
        couponCode: 'BIGORDER',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('minimum amount')
  })

  it('returns 400 when no valid items', async () => {
    mockProductFindFirst.mockResolvedValue(null)

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(validCheckoutPayload),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('No valid items')
  })

  it('returns 400 for missing required fields', async () => {
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
