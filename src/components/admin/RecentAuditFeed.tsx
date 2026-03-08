'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ClipboardIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  adminName: string | null
  adminId: string | null
  createdAt: string
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const ENTITY_COLORS: Record<string, string> = {
  order: 'bg-blue-500',
  product: 'bg-emerald-500',
  coupon: 'bg-purple-500',
  banner: 'bg-amber-500',
  filament: 'bg-orange-500',
  customer: 'bg-pink-500',
}

export function RecentAuditFeed() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/audit?limit=8')
      if (!res.ok) return
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      // ignore — sidebar feed is non-critical
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="border-t border-brand-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
      >
        <ClipboardIcon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="flex-1 text-left uppercase tracking-wider">Recent Activity</span>
        {logs.length > 0 && (
          <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          open ? 'max-h-72' : 'max-h-0'
        )}
      >
        <div className="px-3 pb-2 space-y-0.5 overflow-y-auto max-h-72">
          {logs.length === 0 ? (
            <p className="px-2 py-3 text-xs text-brand-muted text-center">No recent activity</p>
          ) : (
            <>
              {logs.map((entry) => {
                const dot = ENTITY_COLORS[entry.entityType] ?? 'bg-gray-400'
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-arctic transition-colors"
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-brand-text leading-tight truncate">
                        {formatAction(entry.action)}
                      </p>
                      <p className="text-[10px] text-brand-muted leading-tight">
                        {entry.adminName ?? entry.adminId?.slice(0, 6) ?? 'System'} · {timeAgo(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <Link
                href="/admin/audit"
                className="block text-center text-[10px] text-brand-blue hover:underline py-1.5"
              >
                View full audit log →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
