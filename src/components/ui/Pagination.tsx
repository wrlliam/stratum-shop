'use client'

import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string>
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    return `${basePath}?${params.toString()}`
  }

  // Show at most 5 page numbers centered around current
  const pages: number[] = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
      ) : (
        <span className="p-2 text-brand-border">
          <ChevronLeftIcon className="w-4 h-4" />
        </span>
      )}

      {pages[0] > 1 && (
        <>
          <Link
            href={buildHref(1)}
            className="px-3 py-1.5 rounded-sm text-xs font-medium text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
          >
            1
          </Link>
          {pages[0] > 2 && <span className="px-1 text-brand-muted text-xs">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={cn(
            'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
            page === currentPage
              ? 'bg-brand-blue text-white'
              : 'text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
          )}
        >
          {page}
        </Link>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="px-1 text-brand-muted text-xs">...</span>
          )}
          <Link
            href={buildHref(totalPages)}
            className="px-3 py-1.5 rounded-sm text-xs font-medium text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      ) : (
        <span className="p-2 text-brand-border">
          <ChevronRightIcon className="w-4 h-4" />
        </span>
      )}
    </div>
  )
}
