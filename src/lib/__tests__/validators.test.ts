import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Re-define the schemas as they're defined inline in route files
const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  orderNumber: z.string().optional(),
  message: z.string().min(1),
})

const addressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().default(''),
  city: z.string().min(1),
  county: z.string().optional().default(''),
  postcode: z.string().min(1),
  country: z.string().default('GB'),
})

const checkoutItemSchema = z.object({
  productId: z.string().optional(),
  bundleId: z.string().optional(),
  quantity: z.number().int().positive(),
  selectedOptions: z.array(z.object({
    groupName: z.string(),
    choiceLabel: z.string(),
    priceModifier: z.number().int(),
  })).optional(),
})

const createCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
  type: z.enum(['fixed', 'percentage']),
  value: z.number().int().positive(),
  minOrderAmount: z.number().int().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
})

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
})

describe('Contact form schema', () => {
  it('accepts valid contact data', () => {
    const result = contactSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      message: 'Hello',
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional orderNumber', () => {
    const result = contactSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      orderNumber: 'STR-ABC-1234',
      message: 'Help with order',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = contactSchema.safeParse({
      name: '',
      email: 'john@example.com',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = contactSchema.safeParse({
      name: 'John',
      email: 'not-an-email',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty message', () => {
    const result = contactSchema.safeParse({
      name: 'John',
      email: 'john@example.com',
      message: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = contactSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('Address schema', () => {
  it('accepts valid address', () => {
    const result = addressSchema.safeParse({
      name: 'John Doe',
      line1: '123 Main St',
      city: 'London',
      postcode: 'SW1A 1AA',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.country).toBe('GB')
      expect(result.data.line2).toBe('')
    }
  })

  it('rejects missing required fields', () => {
    const result = addressSchema.safeParse({
      name: 'John',
    })
    expect(result.success).toBe(false)
  })
})

describe('Checkout item schema', () => {
  it('accepts product item', () => {
    const result = checkoutItemSchema.safeParse({
      productId: 'abc-123',
      quantity: 2,
    })
    expect(result.success).toBe(true)
  })

  it('accepts bundle item', () => {
    const result = checkoutItemSchema.safeParse({
      bundleId: 'bundle-1',
      quantity: 1,
    })
    expect(result.success).toBe(true)
  })

  it('accepts item with selected options', () => {
    const result = checkoutItemSchema.safeParse({
      productId: 'abc-123',
      quantity: 1,
      selectedOptions: [
        { groupName: 'Color', choiceLabel: 'Red', priceModifier: 200 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero quantity', () => {
    const result = checkoutItemSchema.safeParse({
      productId: 'abc-123',
      quantity: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative quantity', () => {
    const result = checkoutItemSchema.safeParse({
      productId: 'abc-123',
      quantity: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('Coupon schema', () => {
  it('accepts valid percentage coupon', () => {
    const result = createCouponSchema.safeParse({
      code: 'save10',
      type: 'percentage',
      value: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('SAVE10')
    }
  })

  it('accepts valid fixed coupon with all fields', () => {
    const result = createCouponSchema.safeParse({
      code: 'flat500',
      type: 'fixed',
      value: 500,
      minOrderAmount: 2000,
      maxUses: 100,
      expiresAt: '2025-12-31',
    })
    expect(result.success).toBe(true)
  })

  it('uppercases and trims code', () => {
    const result = createCouponSchema.safeParse({
      code: '  hello  ',
      type: 'fixed',
      value: 100,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.code).toBe('HELLO')
    }
  })

  it('rejects invalid type', () => {
    const result = createCouponSchema.safeParse({
      code: 'TEST',
      type: 'bogus',
      value: 10,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero value', () => {
    const result = createCouponSchema.safeParse({
      code: 'TEST',
      type: 'fixed',
      value: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty code', () => {
    const result = createCouponSchema.safeParse({
      code: '',
      type: 'fixed',
      value: 100,
    })
    expect(result.success).toBe(false)
  })
})

describe('Product schema', () => {
  it('accepts valid product', () => {
    const result = createProductSchema.safeParse({
      name: 'Test Product',
      price: 1999,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stock).toBe(0)
      expect(result.data.tags).toEqual([])
      expect(result.data.featured).toBe(false)
      expect(result.data.active).toBe(true)
    }
  })

  it('rejects missing name', () => {
    const result = createProductSchema.safeParse({
      price: 1999,
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero price', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      price: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      price: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative stock', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      price: 100,
      stock: -1,
    })
    expect(result.success).toBe(false)
  })
})
