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
const mockSelect = vi.fn()
const mockInsertValues = vi.fn()
const mockInsertReturning = vi.fn()
const mockDeleteWhere = vi.fn()

vi.mock('@/lib/db', () => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  }

  return {
    db: {
      query: {
        products: {
          findMany: (...args: unknown[]) => mockFindMany(...args),
          findFirst: (...args: unknown[]) => mockFindFirst(...args),
        },
      },
      select: vi.fn(() => ({ ...chain, then: (resolve: (v: unknown) => void) => resolve([{ count: 0 }]) })),
      insert: vi.fn(() => ({
        values: (...args: unknown[]) => {
          mockInsertValues(...args)
          return { returning: () => mockInsertReturning() }
        },
      })),
      delete: vi.fn(() => ({
        where: (...args: unknown[]) => mockDeleteWhere(...args),
      })),
    },
    products: { id: 'id', name: 'name', slug: 'slug', active: 'active', price: 'price', stock: 'stock', material: 'material', tags: 'tags', featured: 'featured', createdAt: 'createdAt', description: 'description' },
    productImages: { order: 'order', productId: 'productId' },
    productOptionGroups: { order: 'order', productId: 'productId' },
    productOptionChoices: { order: 'order' },
  }
})

// Mock utils
vi.mock('@/lib/utils', () => ({
  createSlug: (text: string) => text.toLowerCase().replace(/\s+/g, '-'),
}))

describe('GET /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(null)
  })

  it('returns products list', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 1999, images: [], optionGroups: [] },
    ]
    mockFindMany.mockResolvedValue(mockProducts)

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.products).toEqual(mockProducts)
  })

  it('returns empty list when no products', async () => {
    mockFindMany.mockResolvedValue([])

    const { GET } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/products')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.products).toEqual([])
  })
})

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 for non-admin users', async () => {
    mockGetSession.mockResolvedValue({ user: { role: 'customer' } })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', price: 1000 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 for unauthenticated users', async () => {
    mockGetSession.mockResolvedValue(null)

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', price: 1000 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid data', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '1', role: 'admin' } })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({ price: -100 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates product for admin users', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '1', role: 'admin' } })
    const createdProduct = { id: 'new-1', name: 'New Product', slug: 'new-product', price: 2500 }
    mockInsertReturning.mockResolvedValue([createdProduct])
    mockFindFirst.mockResolvedValue({ ...createdProduct, images: [], optionGroups: [] })

    const { POST } = await import('../route')
    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Product',
        price: 2500,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
