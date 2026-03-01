'use client'

import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, Cross1Icon, ChevronDownIcon, MixerHorizontalIcon } from '@radix-ui/react-icons'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/Button'
import type { ProductWithImages } from '@/types'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A–Z' },
  { value: 'name-desc', label: 'Name: Z–A' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('createdAt-desc')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [sortOpen, setSortOpen] = useState(false)
  const limit = 24

  const fetchProducts = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 0 : page
    const [sortBy, order] = sort.split('-')

    try {
      const params = new URLSearchParams({
        sortBy,
        order,
        limit: String(limit),
        offset: String(currentPage * limit),
        ...(search && { search }),
      })

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()

      if (reset) {
        setProducts(data.products)
        setPage(0)
      } else {
        setProducts((prev) => [...prev, ...data.products])
      }
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, sort, page])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(true), 300)
    return () => clearTimeout(timer)
  }, [search, sort])

  const loadMore = () => {
    setPage((p) => p + 1)
    fetchProducts()
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">
            Browse
          </p>
          <h1 className="text-3xl font-bold text-brand-text">All Prints</h1>
          {total > 0 && (
            <p className="text-brand-muted text-sm mt-2">
              {total} product{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search prints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text"
              >
                <Cross1Icon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-text hover:border-brand-slate transition-colors min-w-[180px] justify-between"
            >
              <span className="flex items-center gap-2">
                <MixerHorizontalIcon className="w-3.5 h-3.5" />
                {currentSortLabel}
              </span>
              <ChevronDownIcon
                className={cn('w-3.5 h-3.5 transition-transform', sortOpen && 'rotate-180')}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 mt-1 w-full min-w-[200px] bg-white border border-brand-border rounded-xl shadow-card-lg overflow-hidden z-10 animate-fade-in">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSort(option.value)
                      setSortOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-brand-arctic',
                      sort === option.value
                        ? 'text-brand-blue bg-brand-blue-light font-semibold'
                        : 'text-brand-text'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products grid */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-brand-border overflow-hidden">
                <div className="skeleton aspect-square" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 rounded w-3/4" />
                  <div className="skeleton h-3 rounded w-1/2" />
                  <div className="skeleton h-5 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-brand-text mb-2">No products found</h3>
            <p className="text-brand-muted text-sm">
              {search ? `No results for "${search}"` : 'No products available yet'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-sm text-brand-blue hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.length < total && (
              <div className="mt-10 text-center">
                <Button
                  variant="secondary"
                  onClick={loadMore}
                  loading={loading}
                  size="lg"
                >
                  Load more ({total - products.length} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
