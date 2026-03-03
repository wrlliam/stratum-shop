'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'stratum-recently-viewed'
const MAX_ITEMS = 10

export function useRecentlyViewed() {
  const [recentSlugs, setRecentSlugs] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentSlugs(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const addViewed = useCallback((slug: string) => {
    setRecentSlugs((prev) => {
      const filtered = prev.filter((s) => s !== slug)
      const updated = [slug, ...filtered].slice(0, MAX_ITEMS)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }, [])

  const clearRecent = useCallback(() => {
    setRecentSlugs([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return { recentSlugs, addViewed, clearRecent }
}
