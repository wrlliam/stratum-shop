'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Coupon } from '@/lib/db/schema'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchCoupons = useCallback(async () => {
    const res = await fetch('/api/admin/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const toggleActive = async (id: string, active: boolean) => {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    if (res.ok) {
      toast.success(active ? 'Coupon deactivated' : 'Coupon activated')
      fetchCoupons()
    } else {
      toast.error('Failed to update coupon')
    }
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Coupon deleted')
      fetchCoupons()
    } else {
      toast.error('Failed to delete coupon')
    }
  }

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Coupons</h1>
          <p className="text-brand-muted text-sm mt-1">{coupons.length} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Coupon</Button>
      </div>

      {showCreate && (
        <CreateCouponForm
          onCreated={() => { setShowCreate(false); fetchCoupons() }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-arctic">
                  {['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Status', 'Expires', 'Actions'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-brand-arctic transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-bold text-brand-blue">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted capitalize">
                      {coupon.type}
                    </td>
                    <td className="px-4 py-4 font-bold text-brand-text">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted">
                      {coupon.minOrderAmount ? formatPrice(coupon.minOrderAmount) : '—'}
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted">
                      {coupon.usedCount}{coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleActive(coupon.id, coupon.active)}>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            coupon.active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {coupon.active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs text-brand-muted whitespace-nowrap">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <Button variant="ghost" size="sm" onClick={() => deleteCoupon(coupon.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-brand-muted">
                      No coupons yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateCouponForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'fixed' | 'percentage'>('percentage')
  const [value, setValue] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          type,
          value: type === 'fixed' ? Math.round(parseFloat(value) * 100) : parseInt(value),
          minOrderAmount: minOrderAmount ? Math.round(parseFloat(minOrderAmount) * 100) : null,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      })

      if (res.ok) {
        toast.success('Coupon created')
        onCreated()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create coupon')
      }
    } catch {
      toast.error('Failed to create coupon')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card mb-6">
      <h2 className="text-base font-bold text-brand-text mb-4">Create Coupon</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label="Code"
          placeholder="e.g. SUMMER20"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <div>
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'fixed' | 'percentage')}
            className="w-full bg-white border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <Input
          label={type === 'percentage' ? 'Value (%)' : 'Value (£)'}
          type="number"
          step={type === 'fixed' ? '0.01' : '1'}
          min="1"
          placeholder={type === 'percentage' ? '10' : '5.00'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
        <Input
          label="Min Order (£)"
          type="number"
          step="0.01"
          min="0"
          placeholder="Optional"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
        />
        <Input
          label="Max Uses"
          type="number"
          min="1"
          placeholder="Unlimited"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
        />
        <Input
          label="Expires At"
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <div className="col-span-2 flex items-end gap-3">
          <Button type="submit" loading={loading}>
            Create
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
