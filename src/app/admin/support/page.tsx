'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { RealtimeAdmin } from '@/components/admin/RealtimeAdmin'

interface Ticket {
  id: string
  name: string
  email: string
  subject: string
  status: string
  createdAt: string
  updatedAt: string
}

const STATUS_OPTS = ['all', 'open', 'in_progress', 'resolved', 'closed'] as const
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-brand-arctic text-brand-muted',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('open')

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/support/tickets?${params}`)
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetch_() }, [fetch_])

  return (
    <div className="p-8">
      {/* Auto-refresh when new tickets arrive via SSE */}
      <RealtimeAdmin onTicketEvent={fetch_} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-display text-brand-text">Support Tickets</h1>
      </div>

      <div className="flex gap-1 mb-4 bg-brand-arctic p-1 rounded-sm w-fit">
        {STATUS_OPTS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors capitalize ${
              statusFilter === s ? 'bg-brand-surface text-brand-blue shadow-card' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Subject</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-muted">Loading…</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-brand-muted">No tickets found</td></tr>
              ) : tickets.map((t) => (
                <tr key={t.id} className="border-b border-brand-border last:border-0 hover:bg-brand-arctic/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-text">{t.name}</p>
                    <p className="text-xs text-brand-muted">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-text max-w-xs truncate">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status] ?? ''}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-muted">
                    {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-muted">
                    {new Date(t.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/support/${t.id}`} className="text-xs text-brand-blue hover:underline font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
