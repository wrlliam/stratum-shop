'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Select } from '@/components/ui/Select'
import { formatPrice } from '@/lib/utils'

interface CustomerDetail {
  customer: {
    id: string
    name: string
    email: string
    role: string
    marketingEmails: boolean
    tosAcceptedAt: string | null
    createdAt: string
  }
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
  }>
}

const ROLES = ['customer', 'customer_service', 'admin'] as const

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setRole(d.customer?.role || 'customer')
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleRoleChange = async () => {
    setSavingRole(true)
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast.success('Role updated')
      setData((prev) => prev ? { ...prev, customer: { ...prev.customer, role } } : prev)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setSavingRole(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) return <div className="p-8 text-brand-muted">Customer not found</div>

  const { customer, orders } = data

  const statusColors: Record<string, string> = {
    paid: 'bg-green-50 text-green-700',
    refunded: 'bg-red-50 text-red-700',
    pending: 'bg-amber-50 text-amber-700',
    shipped: 'bg-blue-50 text-blue-700',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-brand-arctic text-brand-muted',
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/customers" className="text-brand-muted hover:text-brand-text text-sm">
          ← Customers
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-sm p-5 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Account Info</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-brand-muted">Name:</span> <span className="font-medium text-brand-text">{customer.name}</span></p>
              <p><span className="text-brand-muted">Email:</span> <span className="font-medium text-brand-text">{customer.email}</span></p>
              <p><span className="text-brand-muted">Joined:</span> <span className="text-brand-text">{new Date(customer.createdAt).toLocaleDateString('en-GB')}</span></p>
              <p><span className="text-brand-muted">Marketing:</span> <span className={customer.marketingEmails ? 'text-green-600' : 'text-brand-muted'}>{customer.marketingEmails ? 'Opted in' : 'Opted out'}</span></p>
              <p><span className="text-brand-muted">ToS:</span> <span className="text-brand-text">{customer.tosAcceptedAt ? new Date(customer.tosAcceptedAt).toLocaleDateString('en-GB') : 'Not recorded'}</span></p>
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-sm p-5 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Role Management</h2>
            <div className="flex gap-2">
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={ROLES.map((r) => ({ value: r, label: r }))}
                className="flex-1"
              />
              <button
                onClick={handleRoleChange}
                disabled={savingRole || role === customer.role}
                className="px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-sm hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {savingRole ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card">
            <div className="p-4 border-b border-brand-border">
              <h2 className="text-sm font-bold text-brand-text">Order History ({orders.length})</h2>
            </div>
            {orders.length === 0 ? (
              <p className="p-6 text-sm text-brand-muted text-center">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Order</th>
                      <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Total</th>
                      <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Date</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-brand-border last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-brand-text">{o.orderNumber}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[o.status] ?? ''}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-text">{formatPrice(o.total)}</td>
                        <td className="px-4 py-3 text-xs text-brand-muted">
                          {new Date(o.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="text-xs text-brand-blue hover:underline">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
