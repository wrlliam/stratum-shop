'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon, Cross1Icon, ChevronDownIcon, MixerHorizontalIcon } from '@radix-ui/react-icons'
import { ProductCard } from '@/components/shop/ProductCard'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import type { ProductWithImages } from '@/types'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
]

interface FilterData {
  materials: string[]
  tags: string[]
  priceRange: { min: number; max: number }
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="skeleton h-4 w-16 rounded mb-2" />
            <div className="skeleton h-9 w-40 rounded" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-brand-border overflow-hidden">
                <div className="skeleton aspect-square" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 rounded w-3/4" />
                  <div className="skeleton h-3 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}

function ProductsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<ProductWithImages[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [sortOpen, setSortOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterData, setFilterData] = useState<FilterData | null>(null)
  const limit = 24

  // Read initial state from URL
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'createdAt-desc')
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(() => {
    const m = searchParams.get('material')
    return m ? m.split(',') : []
  })
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '')

  // Fetch filter data on mount
  useEffect(() => {
    fetch('/api/products/filters')
      .then((r) => r.json())
      .then(setFilterData)
      .catch(console.error)
  }, [])

  // Sync filters to URL
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (sort !== 'createdAt-desc') params.set('sort', sort)
    if (selectedMaterials.length > 0) params.set('material', selectedMaterials.join(','))
    if (inStock) params.set('inStock', 'true')
    if (selectedTag) params.set('tag', selectedTag)
    const qs = params.toString()
    router.replace(`/products${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [search, sort, selectedMaterials, inStock, selectedTag, router])

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
        ...(inStock && { inStock: 'true' }),
        ...(selectedTag && { tag: selectedTag }),
      })

      // Add material filters
      if (selectedMaterials.length > 0) {
        params.set('material', selectedMaterials[0])
      }

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
  }, [search, sort, page, selectedMaterials, inStock, selectedTag])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(true)
      syncUrl()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, sort, selectedMaterials, inStock, selectedTag])

  const loadMore = () => {
    setPage((p) => p + 1)
    fetchProducts()
  }

  const clearFilters = () => {
    setSelectedMaterials([])
    setInStock(false)
    setSelectedTag('')
    setSearch('')
  }

  const hasActiveFilters = selectedMaterials.length > 0 || inStock || selectedTag

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

        {/* Search + Sort + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors',
              hasActiveFilters
                ? 'bg-brand-blue-light border-brand-blue text-brand-blue'
                : 'bg-white border-brand-border text-brand-text hover:border-brand-slate'
            )}
          >
            <MixerHorizontalIcon className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 bg-brand-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {(selectedMaterials.length > 0 ? 1 : 0) + (inStock ? 1 : 0) + (selectedTag ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-xl text-sm text-brand-text hover:border-brand-slate transition-colors min-w-[180px] justify-between"
            >
              <span>{currentSortLabel}</span>
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

        {/* Filter panel */}
        {filtersOpen && filterData && (
          <div className="mb-6 p-5 bg-white border border-brand-border rounded-2xl shadow-card animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-brand-text">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-blue hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Materials */}
              {filterData.materials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Material</p>
                  <div className="space-y-1.5">
                    {filterData.materials.map((mat) => (
                      <label key={mat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMaterials.includes(mat)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMaterials((prev) => [...prev, mat])
                            } else {
                              setSelectedMaterials((prev) => prev.filter((m) => m !== mat))
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue focus:ring-brand-blue/20"
                        />
                        <span className="text-sm text-brand-text">{mat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {filterData.tags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {filterData.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                          selectedTag === tag
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-brand-text border-brand-border hover:border-brand-slate'
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* In Stock */}
              <div>
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Availability</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-brand-border text-brand-blue focus:ring-brand-blue/20"
                  />
                  <span className="text-sm text-brand-text">In stock only</span>
                </label>
              </div>

              {/* Price Range info */}
              {filterData.priceRange.max > 0 && (
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Price Range</p>
                  <p className="text-sm text-brand-text">
                    {formatPrice(filterData.priceRange.min)} &ndash; {formatPrice(filterData.priceRange.max)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedMaterials.map((mat) => (
              <span
                key={mat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-blue-light text-brand-blue text-xs font-medium rounded-lg"
              >
                {mat}
                <button onClick={() => setSelectedMaterials((prev) => prev.filter((m) => m !== mat))}>
                  <Cross1Icon className="w-3 h-3" />
                </button>
              </span>
            ))}
            {inStock && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-blue-light text-brand-blue text-xs font-medium rounded-lg">
                In stock
                <button onClick={() => setInStock(false)}>
                  <Cross1Icon className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-blue-light text-brand-blue text-xs font-medium rounded-lg">
                #{selectedTag}
                <button onClick={() => setSelectedTag('')}>
                  <Cross1Icon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

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
              {search ? `No results for "${search}"` : 'No products match your filters'}
            </p>
            {(search || hasActiveFilters) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-brand-blue hover:underline"
              >
                Clear all filters
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
