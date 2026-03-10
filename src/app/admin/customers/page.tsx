'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  email: string
  role: string
  marketingEmails: boolean
  createdAt: string
  orderCount: number
  totalSpent: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/customers?${params}`)
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
    } finally {
      setLoading(false)
    }
  }, [search, offset])

  useEffect(() => { fetch_() }, [fetch_])

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    customer_service: 'bg-blue-100 text-blue-700',
    customer: 'bg-brand-arctic text-brand-muted',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-brand-text">Customers</h1>
          <p className="text-sm text-brand-muted mt-0.5">{total} total</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0) }}
          className="w-full max-w-sm px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
        />
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Orders</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Total Spent</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Marketing</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-muted text-sm">Loading…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brand-muted text-sm">No customers found</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b border-brand-border last:border-0 hover:bg-brand-arctic/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-text">{c.name}</p>
                    <p className="text-xs text-brand-muted">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${roleColors[c.role] ?? roleColors.customer}`}>
                      {c.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-text">{c.orderCount}</td>
                  <td className="px-4 py-3 text-brand-text font-medium">{formatPrice(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-brand-muted text-xs">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.marketingEmails ? 'bg-green-50 text-green-600' : 'bg-brand-arctic text-brand-muted'}`}>
                      {c.marketingEmails ? 'Opted in' : 'Opted out'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="text-xs text-brand-blue hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border text-sm">
            <span className="text-brand-muted">
              Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="px-3 py-1.5 border border-brand-border rounded-lg disabled:opacity-40 hover:bg-brand-arctic"
              >
                Previous
              </button>
              <button
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1.5 border border-brand-border rounded-lg disabled:opacity-40 hover:bg-brand-arctic"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
