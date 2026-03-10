import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockOrderFindFirst = vi.fn()
const mockOrderItemFindFirst = vi.fn()
const mockSubmissionFindFirst = vi.fn()
const mockDeleteWhere = vi.fn()
const mockInsertReturning = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      orders: { findFirst: (...args: unknown[]) => mockOrderFindFirst(...args) },
      orderItems: { findFirst: (...args: unknown[]) => mockOrderItemFindFirst(...args) },
      customOrderSubmissions: { findFirst: (...args: unknown[]) => mockSubmissionFindFirst(...args) },
    },
    delete: vi.fn(() => ({
      where: (...args: unknown[]) => mockDeleteWhere(...args),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ returning: () => mockInsertReturning() })),
    })),
  },
  orders: { id: 'id', userId: 'userId' },
  orderItems: { id: 'id', orderId: 'orderId' },
  customOrderSubmissions: { orderItemId: 'orderItemId' },
}))

const userSession = { user: { id: 'user-1' } }

function makeParams(id: string, itemId: string) {
  return { params: Promise.resolve({ id, itemId }) }
}

const jsonHeaders = { 'Content-Type': 'application/json' }

describe('POST /api/orders/[id]/items/[itemId]/customize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ fields: { color: 'red' } }),
    })
    const res = await POST(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(401)
  })

  it('returns 404 if order not found or not owned by user', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockOrderFindFirst.mockResolvedValue(null)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ fields: { color: 'red' } }),
    })
    const res = await POST(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('Order not found')
  })

  it('returns 400 if order status is not qualifying', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockOrderFindFirst.mockResolvedValue({ id: 'ord-1', status: 'pending' })
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ fields: { color: 'red' } }),
    })
    const res = await POST(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('not eligible')
  })

  it('returns 404 if item not in order', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockOrderFindFirst.mockResolvedValue({ id: 'ord-1', status: 'paid' })
    mockOrderItemFindFirst.mockResolvedValue(null)
    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ fields: { color: 'red' } }),
    })
    const res = await POST(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('Item not found')
  })

  it('creates submission with valid data', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockOrderFindFirst.mockResolvedValue({ id: 'ord-1', status: 'paid' })
    mockOrderItemFindFirst.mockResolvedValue({ id: 'item-1' })
    mockDeleteWhere.mockResolvedValue(undefined)
    const mockSubmission = {
      id: 'sub-1',
      orderItemId: 'item-1',
      userId: 'user-1',
      fields: { color: 'red', size: 'large' },
    }
    mockInsertReturning.mockResolvedValue([mockSubmission])

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ fields: { color: 'red', size: 'large' } }),
    })
    const res = await POST(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.fields.color).toBe('red')
    expect(data.fields.size).toBe('large')
  })

  it('upserts by deleting old submission before inserting new', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockOrderFindFirst.mockResolvedValue({ id: 'ord-1', status: 'processing' })
    mockOrderItemFindFirst.mockResolvedValue({ id: 'item-1' })
    mockDeleteWhere.mockResolvedValue(undefined)
    const mockSubmission = {
      id: 'sub-2',
      orderItemId: 'item-1',
      userId: 'user-1',
      fields: { color: 'blue' },
    }
    mockInsertReturning.mockResolvedValue([mockSubmission])

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ fields: { color: 'blue' } }),
    })
    const res = await POST(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(200)
    // Verify the delete was called (upsert pattern)
    expect(mockDeleteWhere).toHaveBeenCalled()
  })
})

describe('GET /api/orders/[id]/items/[itemId]/customize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize')
    const res = await GET(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(401)
  })

  it('returns null if no submission exists', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockOrderFindFirst.mockResolvedValue({ id: 'ord-1' })
    mockSubmissionFindFirst.mockResolvedValue(null)

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/orders/ord-1/items/item-1/customize')
    const res = await GET(req, makeParams('ord-1', 'item-1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toBeNull()
  })
})
