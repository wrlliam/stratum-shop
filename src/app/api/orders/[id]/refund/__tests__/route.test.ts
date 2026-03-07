import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockOrdersFindFirst = vi.fn()
const mockUserFindFirst = vi.fn()
const mockUpdateWhere = vi.fn().mockResolvedValue([])
const mockInsertValues = vi.fn().mockResolvedValue([])

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      orders: { findFirst: (...args: unknown[]) => mockOrdersFindFirst(...args) },
      bundleProducts: { findMany: vi.fn().mockResolvedValue([]) },
      user: { findFirst: (...args: unknown[]) => mockUserFindFirst(...args) },
    },
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: mockUpdateWhere })) })),
    insert: vi.fn(() => ({ values: mockInsertValues })),
  },
  orders: { id: 'id', status: 'status' },
  products: { id: 'id', stock: 'stock' },
  bundleProducts: { bundleId: 'bundleId' },
  inventoryLog: {},
  auditLog: {},
  user: {},
}))

const mockStripeRefundsCreate = vi.fn()
const mockStripeSessionsRetrieve = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    refunds: { create: (...args: unknown[]) => mockStripeRefundsCreate(...args) },
    checkout: { sessions: { retrieve: (...args: unknown[]) => mockStripeSessionsRetrieve(...args) } },
  },
}))

vi.mock('@/lib/resend', () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
  FROM_EMAIL: 'test@example.com',
  APP_URL: 'http://localhost:3000',
}))

vi.mock('@/lib/audit', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@react-email/components', () => ({
  renderAsync: vi.fn().mockResolvedValue('<html>email</html>'),
}))

vi.mock('@/lib/email/order-cancellation', () => ({
  OrderCancellationEmail: vi.fn().mockReturnValue(null),
}))

const mockParams = (id: string) => ({ params: Promise.resolve({ id }) })

const makeRequest = () =>
  new NextRequest('http://localhost:3000/api/orders/order-1/refund', { method: 'POST' })

const adminSession = { user: { id: 'admin-1', role: 'admin' } }
const paidOrder = {
  id: 'order-1',
  orderNumber: 'STR-001',
  email: 'customer@example.com',
  status: 'paid',
  total: 1999,
  stripePaymentIntentId: 'pi_test123',
  stripeSessionId: null,
  items: [
    { id: 'item-1', productId: 'prod-1', bundleId: null, isBundle: false, quantity: 2, name: 'Widget' },
  ],
}

describe('POST /api/orders/[id]/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateWhere.mockResolvedValue([])
    mockInsertValues.mockResolvedValue([])
    mockStripeRefundsCreate.mockResolvedValue({ id: 'ref_123' })
    mockUserFindFirst.mockResolvedValue({ id: 'admin-1', role: 'admin' })
  })

  it('returns 401 for unauthenticated user', async () => {
    mockGetSession.mockResolvedValue(null)
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1', role: 'customer' } })
    mockUserFindFirst.mockResolvedValue({ id: 'user-1', role: 'customer' })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent order', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue(null)
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 400 for non-refundable status', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue({ ...paidOrder, status: 'refunded' })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for cancelled status', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue({ ...paidOrder, status: 'cancelled' })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when no stripePaymentIntentId and no stripeSessionId', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue({
      ...paidOrder,
      stripePaymentIntentId: null,
      stripeSessionId: null,
    })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(400)
  })

  it('returns 200 and updates status to refunded on success', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue(paidOrder)
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('handles charge_already_refunded Stripe error gracefully', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue(paidOrder)
    mockStripeRefundsCreate.mockRejectedValue({ code: 'charge_already_refunded' })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(200)
  })

  it('returns 502 for other Stripe errors', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue(paidOrder)
    mockStripeRefundsCreate.mockRejectedValue(new Error('card_declined'))
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(502)
  })

  it('resolves payment intent from session when stripePaymentIntentId is missing', async () => {
    mockGetSession.mockResolvedValue(adminSession)
    mockOrdersFindFirst.mockResolvedValue({
      ...paidOrder,
      stripePaymentIntentId: null,
      stripeSessionId: 'cs_test123',
    })
    mockStripeSessionsRetrieve.mockResolvedValue({ payment_intent: 'pi_resolved' })
    const { POST } = await import('../route')
    const res = await POST(makeRequest(), mockParams('order-1'))
    expect(res.status).toBe(200)
    expect(mockStripeSessionsRetrieve).toHaveBeenCalledWith('cs_test123')
  })
})
