import { vi } from 'vitest'

export const mockDb = {
  query: {
    products: { findFirst: vi.fn(), findMany: vi.fn() },
    orders: { findFirst: vi.fn(), findMany: vi.fn() },
    bundles: { findFirst: vi.fn(), findMany: vi.fn() },
    coupons: { findFirst: vi.fn() },
    printBatches: { findMany: vi.fn() },
    bundleProducts: { findMany: vi.fn() },
  },
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn(),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn(),
  }),
  selectDistinct: vi.fn().mockReturnThis(),
}

export function mockDbModule() {
  vi.mock('@/lib/db', () => ({
    db: mockDb,
    products: { id: 'id', name: 'name', slug: 'slug', active: 'active', price: 'price', stock: 'stock', material: 'material', tags: 'tags', featured: 'featured', createdAt: 'createdAt' },
    productImages: { order: 'order', productId: 'productId' },
    productOptionGroups: { order: 'order', productId: 'productId' },
    productOptionChoices: { order: 'order' },
    orders: { id: 'id', status: 'status', userId: 'userId', createdAt: 'createdAt', email: 'email' },
    orderItems: { name: 'name', quantity: 'quantity', price: 'price' },
    bundles: { id: 'id', active: 'active' },
    bundleProducts: { bundleId: 'bundleId' },
    coupons: { id: 'id', code: 'code', usedCount: 'usedCount', createdAt: 'createdAt' },
    printBatches: { status: 'status', createdAt: 'createdAt' },
    inventoryLog: {},
    user: {},
  }))
}

export function resetDbMocks() {
  Object.values(mockDb.query).forEach((table) => {
    Object.values(table).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset())
  })
}
