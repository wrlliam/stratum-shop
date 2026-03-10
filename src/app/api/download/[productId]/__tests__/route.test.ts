import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockGetSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: (...args: unknown[]) => mockGetSession(...args) } },
}))

const mockProductFindFirst = vi.fn()
const mockOrdersFindMany = vi.fn()
const mockOrderItemsFindFirst = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      products: { findFirst: (...args: unknown[]) => mockProductFindFirst(...args) },
      orders: { findMany: (...args: unknown[]) => mockOrdersFindMany(...args) },
      orderItems: { findFirst: (...args: unknown[]) => mockOrderItemsFindFirst(...args) },
    },
  },
  products: { id: 'id' },
  orders: { userId: 'userId', status: 'status' },
  orderItems: { orderId: 'orderId', productId: 'productId' },
}))

const mockReadFile = vi.fn()
vi.mock('fs/promises', () => ({
  default: { readFile: (...args: unknown[]) => mockReadFile(...args) },
  readFile: (...args: unknown[]) => mockReadFile(...args),
}))

import { GET } from '../route'

const userSession = { user: { id: 'user-1', email: 'user@test.com' } }

function makeParams(productId: string) {
  return { params: Promise.resolve({ productId }) }
}

describe('GET /api/download/[productId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/download/prod-1')
    const res = await GET(req, makeParams('prod-1'))
    expect(res.status).toBe(401)
  })

  it('returns 404 if product not found', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/download/nonexistent')
    const res = await GET(req, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 400 if product is not digital or 3d_model type', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue({
      id: 'prod-1',
      name: 'Physical Widget',
      productType: 'physical',
      digitalFilePath: null,
      digitalFileUrl: null,
    })
    const req = new NextRequest('http://localhost:3000/api/download/prod-1')
    const res = await GET(req, makeParams('prod-1'))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('downloadable')
  })

  it('returns 404 if no file path or URL configured', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue({
      id: 'prod-1',
      name: 'Digital Product',
      productType: 'digital',
      digitalFilePath: null,
      digitalFileUrl: null,
    })
    const req = new NextRequest('http://localhost:3000/api/download/prod-1')
    const res = await GET(req, makeParams('prod-1'))
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('No download file')
  })

  it('returns 403 if user has no qualifying orders', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue({
      id: 'prod-1',
      name: 'Digital Product',
      productType: 'digital',
      digitalFilePath: 'digital/file.pdf',
      digitalFileUrl: null,
    })
    mockOrdersFindMany.mockResolvedValue([])
    const req = new NextRequest('http://localhost:3000/api/download/prod-1')
    const res = await GET(req, makeParams('prod-1'))
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('No qualifying order')
  })

  it('returns 403 if user has not purchased this product', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue({
      id: 'prod-1',
      name: 'Digital Product',
      productType: 'digital',
      digitalFilePath: 'digital/file.pdf',
      digitalFileUrl: null,
    })
    mockOrdersFindMany.mockResolvedValue([{ id: 'order-1' }])
    mockOrderItemsFindFirst.mockResolvedValue(null)
    const req = new NextRequest('http://localhost:3000/api/download/prod-1')
    const res = await GET(req, makeParams('prod-1'))
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.error).toContain('not purchased')
  })

  // Note: bun cannot mock fs/promises for statically imported modules
  it.skip('returns file with correct headers for local file', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue({
      id: 'prod-1',
      name: 'My Digital Guide',
      productType: 'digital',
      digitalFilePath: 'digital/guide.pdf',
      digitalFileUrl: null,
    })
    mockOrdersFindMany.mockResolvedValue([{ id: 'order-1' }])
    mockOrderItemsFindFirst.mockResolvedValue({ id: 'item-1', orderId: 'order-1', productId: 'prod-1' })
    mockReadFile.mockResolvedValue(Buffer.from('fake-pdf-content'))

    const req = new NextRequest('http://localhost:3000/api/download/prod-1')
    const res = await GET(req, makeParams('prod-1'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('My_Digital_Guide.pdf')
    expect(res.headers.get('X-License')).toBeTruthy()
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('redirects to external URL when digitalFileUrl is set', async () => {
    mockGetSession.mockResolvedValue(userSession)
    mockProductFindFirst.mockResolvedValue({
      id: 'prod-2',
      name: '3D Model',
      productType: '3d_model',
      digitalFilePath: null,
      digitalFileUrl: 'https://cdn.example.com/model.glb',
    })
    mockOrdersFindMany.mockResolvedValue([{ id: 'order-2' }])
    mockOrderItemsFindFirst.mockResolvedValue({ id: 'item-2', orderId: 'order-2', productId: 'prod-2' })

    const req = new NextRequest('http://localhost:3000/api/download/prod-2')
    const res = await GET(req, makeParams('prod-2'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('https://cdn.example.com/model.glb')
  })
})
