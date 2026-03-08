import { describe, it, expect, vi } from 'vitest'
import { formatPrice, createSlug, generateOrderNumber, truncate, pluralize, debounce, isSaleActive } from '../utils'

describe('formatPrice', () => {
  it('formats pence to GBP currency string', () => {
    expect(formatPrice(1999)).toBe('£19.99')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('£0.00')
  })

  it('formats single penny', () => {
    expect(formatPrice(1)).toBe('£0.01')
  })

  it('formats large values', () => {
    expect(formatPrice(1000000)).toBe('£10,000.00')
  })

  it('formats negative values', () => {
    expect(formatPrice(-500)).toBe('-£5.00')
  })
})

describe('createSlug', () => {
  it('creates lowercase slug from text', () => {
    expect(createSlug('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(createSlug('Product Name! @#')).toBe('product-name')
  })

  it('trims whitespace', () => {
    expect(createSlug('  padded  ')).toBe('padded')
  })

  it('handles multiple spaces', () => {
    expect(createSlug('foo   bar')).toBe('foo-bar')
  })
})

describe('generateOrderNumber', () => {
  it('starts with STR-', () => {
    expect(generateOrderNumber()).toMatch(/^STR-/)
  })

  it('is uppercase', () => {
    const num = generateOrderNumber()
    expect(num).toBe(num.toUpperCase())
  })

  it('generates unique values', () => {
    const a = generateOrderNumber()
    const b = generateOrderNumber()
    expect(a).not.toBe(b)
  })
})

describe('truncate', () => {
  it('returns original string if shorter than length', () => {
    expect(truncate('short', 10)).toBe('short')
  })

  it('returns original string if equal to length', () => {
    expect(truncate('exact', 5)).toBe('exact')
  })

  it('truncates and adds ellipsis', () => {
    expect(truncate('this is a long string', 10)).toBe('this is a …')
  })
})

describe('pluralize', () => {
  it('returns singular for count 1', () => {
    expect(pluralize(1, 'item', 'items')).toBe('item')
  })

  it('returns plural for count 0', () => {
    expect(pluralize(0, 'item', 'items')).toBe('items')
  })

  it('returns plural for count > 1', () => {
    expect(pluralize(5, 'item', 'items')).toBe('items')
  })
})

describe('isSaleActive', () => {
  const base = { price: 1000, stock: 10 }

  it('returns false when compareAtPrice is null', () => {
    expect(isSaleActive({ ...base, compareAtPrice: null })).toBe(false)
  })

  it('returns false when compareAtPrice is undefined', () => {
    expect(isSaleActive({ ...base, compareAtPrice: undefined })).toBe(false)
  })

  it('returns false when compareAtPrice equals price', () => {
    expect(isSaleActive({ ...base, compareAtPrice: 1000 })).toBe(false)
  })

  it('returns false when compareAtPrice is less than price', () => {
    expect(isSaleActive({ ...base, compareAtPrice: 800 })).toBe(false)
  })

  it('returns true when compareAtPrice > price and no expiry or threshold', () => {
    expect(isSaleActive({ ...base, compareAtPrice: 1500 })).toBe(true)
  })

  it('returns false when saleEndsAt is in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60).toISOString()
    expect(isSaleActive({ ...base, compareAtPrice: 1500, saleEndsAt: past })).toBe(false)
  })

  it('returns true when saleEndsAt is in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    expect(isSaleActive({ ...base, compareAtPrice: 1500, saleEndsAt: future })).toBe(true)
  })

  it('returns false when stock <= saleStopAtStock', () => {
    expect(isSaleActive({ ...base, compareAtPrice: 1500, saleStopAtStock: 10 })).toBe(false)
  })

  it('returns false when stock is below saleStopAtStock', () => {
    expect(isSaleActive({ ...base, stock: 5, compareAtPrice: 1500, saleStopAtStock: 10 })).toBe(false)
  })

  it('returns true when stock > saleStopAtStock', () => {
    expect(isSaleActive({ ...base, stock: 11, compareAtPrice: 1500, saleStopAtStock: 10 })).toBe(true)
  })
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('debounce', () => {
  it('delays function execution', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 30)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    await wait(40)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets timer on subsequent calls', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 50)
    debounced()
    await wait(20)
    debounced()
    await wait(20)
    // Still within debounce window — should not have fired
    expect(fn).not.toHaveBeenCalled()
    await wait(40)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('passes arguments to the original function', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 30)
    debounced('a', 'b')
    await wait(40)
    expect(fn).toHaveBeenCalledWith('a', 'b')
  })
})
