import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecentlyViewed } from '../useRecentlyViewed'

// Bun's test runner doesn't provide jsdom globals — polyfill localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty array', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.recentSlugs).toEqual([])
  })

  it('adds a viewed slug', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addViewed('test-product')
    })
    expect(result.current.recentSlugs).toEqual(['test-product'])
  })

  it('deduplicates slugs and moves to front', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addViewed('product-a')
    })
    act(() => {
      result.current.addViewed('product-b')
    })
    act(() => {
      result.current.addViewed('product-a')
    })
    expect(result.current.recentSlugs).toEqual(['product-a', 'product-b'])
  })

  it('limits to 10 items', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    for (let i = 0; i < 12; i++) {
      act(() => {
        result.current.addViewed(`product-${i}`)
      })
    }
    expect(result.current.recentSlugs).toHaveLength(10)
    expect(result.current.recentSlugs[0]).toBe('product-11')
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addViewed('persisted-product')
    })
    const stored = JSON.parse(localStorage.getItem('stratum-recently-viewed') || '[]')
    expect(stored).toContain('persisted-product')
  })

  it('loads from localStorage on mount', () => {
    localStorage.setItem('stratum-recently-viewed', JSON.stringify(['saved-product']))
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.recentSlugs).toEqual(['saved-product'])
  })

  it('clears all recent items', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    act(() => {
      result.current.addViewed('product-1')
      result.current.addViewed('product-2')
    })
    act(() => {
      result.current.clearRecent()
    })
    expect(result.current.recentSlugs).toEqual([])
    expect(localStorage.getItem('stratum-recently-viewed')).toBeNull()
  })
})
