'use client'

import { useEffect } from 'react'
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'

export function ProductViewTracker({ slug }: { slug: string }) {
  const { addViewed } = useRecentlyViewed()

  useEffect(() => {
    addViewed(slug)
  }, [slug, addViewed])

  return null
}
