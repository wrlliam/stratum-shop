'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cross1Icon } from '@radix-ui/react-icons'
import type { Banner } from '@/lib/db/schema'

const TYPE_STYLES: Record<string, { bg: string; text: string; link: string; dismiss: string }> = {
  info: {
    bg: 'bg-blue-600/80',
    text: 'text-white',
    link: 'text-white underline font-semibold hover:text-blue-100',
    dismiss: 'hover:bg-blue-700 text-white/80 hover:text-white',
  },
  sale: {
    bg: 'bg-amber-500/80',
    text: 'text-amber-950',
    link: 'text-amber-950 underline font-semibold hover:text-amber-800',
    dismiss: 'hover:bg-amber-600 text-amber-900/70 hover:text-amber-950',
  },
  warning: {
    bg: 'bg-orange-500/80',
    text: 'text-white',
    link: 'text-white underline font-semibold hover:text-orange-100',
    dismiss: 'hover:bg-orange-600 text-white/80 hover:text-white',
  },
  success: {
    bg: 'bg-green-600/80',
    text: 'text-white',
    link: 'text-white underline font-semibold hover:text-green-100',
    dismiss: 'hover:bg-green-700 text-white/80 hover:text-white',
  },
}

const LS_KEY = 'stratum-dismissed-banners'

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function markDismissed(id: string) {
  const dismissed = getDismissed()
  if (!dismissed.includes(id)) {
    localStorage.setItem(LS_KEY, JSON.stringify([...dismissed, id]))
  }
}

export function AnnouncementBanner() {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/banners')
      .then((r) => r.json())
      .then((data: Banner | null) => {
        if (!data) return
        const dismissed = getDismissed()
        if (dismissed.includes(data.id)) return
        setBanner(data)
        setVisible(true)
      })
      .catch(() => {/* silently ignore */})
  }, [])

  if (!visible || !banner) return null

  const styles = TYPE_STYLES[banner.type] ?? TYPE_STYLES.info

  const dismiss = () => {
    setVisible(false)
    markDismissed(banner.id)
  }

  return (
    <div className={`${styles.bg} ${styles.text} relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3 text-sm font-medium">
        <span>{banner.message}</span>

        {banner.link && (
          <Link href={banner.link} className={`shrink-0 ${styles.link}`}>
            {banner.linkText || 'Learn more'}
          </Link>
        )}

        {banner.dismissible && (
          <button
            onClick={dismiss}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${styles.dismiss}`}
            aria-label="Dismiss banner"
          >
            <Cross1Icon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
