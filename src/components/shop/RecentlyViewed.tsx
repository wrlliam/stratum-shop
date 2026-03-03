'use client'

import { useState, useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import { ProductCard } from '@/components/shop/ProductCard'
import type { ProductWithImages } from '@/types'

interface RecentlyViewedProps {
  excludeSlug?: string
}

export function RecentlyViewed({ excludeSlug }: RecentlyViewedProps) {
  const { recentSlugs } = useRecentlyViewed()
  const [products, setProducts] = useState<ProductWithImages[]>([])

  const slugsToFetch = recentSlugs.filter((s) => s !== excludeSlug).slice(0, 4)

  useEffect(() => {
    if (slugsToFetch.length === 0) return

    const fetchProducts = async () => {
      try {
        const results = await Promise.all(
          slugsToFetch.map((slug) =>
            fetch(`/api/products/${slug}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        )
        setProducts(results.filter(Boolean))
      } catch {
        // ignore
      }
    }

    fetchProducts()
  }, [slugsToFetch.join(',')])

  if (products.length === 0) return null

  return (
    <div className="mt-24">
      <h2 className="text-2xl font-bold text-brand-text mb-8">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
