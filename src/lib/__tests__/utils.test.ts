import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatPrice, createSlug, generateOrderNumber, truncate, pluralize, debounce } from '../utils'

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

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets timer on subsequent calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('passes arguments to the original function', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced('a', 'b')
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledWith('a', 'b')
  })
})
