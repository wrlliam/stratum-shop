'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConfirm } from '@/components/providers/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Coupon } from '@/lib/db/schema'
import { PRESET_CONDITIONS, conditionToLabel, type CouponCondition } from '@/lib/coupon-conditions'

const CONDITION_FIELDS = [
  { value: 'account.orderCount', label: 'Order count' },
  { value: 'account.totalSpent', label: 'Total spent (pence)' },
  { value: 'account.createdAt', label: 'Account age (days)' },
  { value: 'cart.itemCount', label: 'Cart item count' },
  { value: 'cart.hasProduct', label: 'Cart has product ID' },
]

const OPERATORS = [
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
]

type CouponWithRestrictions = Coupon & {
  productRestrictions: { productId: string; productName: string }[]
}

type SimpleProduct = { id: string; name: string }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponWithRestrictions[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const confirm = useConfirm()

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
    if (!await confirm({ message: 'Delete this coupon?', confirmLabel: 'Delete', danger: true })) return
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
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-arctic">
                  {['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Applies To', 'Status', 'Expires', 'Actions'].map(
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
                    <td className="px-4 py-4 text-xs text-brand-muted max-w-[160px]">
                      {coupon.productRestrictions.length === 0 ? (
                        <span className="text-green-700 font-medium">All products</span>
                      ) : (
                        <span title={coupon.productRestrictions.map((r) => r.productName).join(', ')}>
                          {coupon.productRestrictions.length === 1
                            ? coupon.productRestrictions[0].productName
                            : `${coupon.productRestrictions.length} products`}
                        </span>
                      )}
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
                    <td colSpan={9} className="px-4 py-12 text-center text-brand-muted">
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
  const [allProducts, setAllProducts] = useState<SimpleProduct[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [conditions, setConditions] = useState<CouponCondition[]>([])
  const [condField, setCondField] = useState('account.orderCount')
  const [condOperator, setCondOperator] = useState<CouponCondition['operator']>('lt')
  const [condValue, setCondValue] = useState('')

  useEffect(() => {
    fetch('/api/products?limit=200')
      .then((r) => r.json())
      .then((data) => {
        const items = Array.isArray(data) ? data : (data.products ?? [])
        setAllProducts(items.map((p: SimpleProduct) => ({ id: p.id, name: p.name })))
      })
      .catch(() => {})
  }, [])

  const addCondition = () => {
    if (!condValue) return
    const parsed = isNaN(Number(condValue)) ? condValue : Number(condValue)
    setConditions((prev) => [...prev, { field: condField, operator: condOperator, value: parsed } as CouponCondition])
    setCondValue('')
  }

  const removeCondition = (i: number) => setConditions((prev) => prev.filter((_, idx) => idx !== i))

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

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
          productIds: selectedProductIds,
          conditions: conditions.length > 0 ? conditions : undefined,
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
    <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card mb-6">
      <h2 className="text-base font-bold text-brand-text mb-4">Create Coupon</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue"
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
        </div>

        {/* Product restrictions */}
        <div>
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
            Applies To
          </label>
          <p className="text-xs text-brand-muted mb-3">
            Leave all unchecked to apply to every product. Select specific products to restrict this coupon.
          </p>
          {allProducts.length === 0 ? (
            <p className="text-xs text-brand-muted">Loading products…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {allProducts.map((product) => {
                const checked = selectedProductIds.includes(product.id)
                return (
                  <label
                    key={product.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-colors ${
                      checked
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue font-medium'
                        : 'border-brand-border text-brand-muted hover:border-brand-blue/40 hover:text-brand-text'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                      checked ? 'border-brand-blue bg-brand-blue' : 'border-current'
                    }`}>
                      {checked && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white fill-current">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="truncate">{product.name}</span>
                  </label>
                )
              })}
            </div>
          )}
          {selectedProductIds.length > 0 && (
            <p className="text-xs text-brand-blue mt-2 font-medium">
              Restricted to {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''}.{' '}
              <button type="button" className="underline" onClick={() => setSelectedProductIds([])}>
                Clear selection
              </button>
            </p>
          )}
        </div>

        {/* Conditions builder */}
        <div>
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
            Conditions
          </label>
          <p className="text-xs text-brand-muted mb-3">
            Optional rules the customer must meet to use this coupon.
          </p>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_CONDITIONS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setConditions((prev) => [...prev, ...preset.conditions] as CouponCondition[])}
                className="px-2.5 py-1 rounded-full text-xs border border-brand-blue/30 bg-brand-blue/5 text-brand-blue hover:bg-brand-blue/10 transition-colors"
              >
                + {preset.label}
              </button>
            ))}
          </div>

          {/* Active conditions */}
          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {conditions.map((cond, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-arctic border border-brand-border text-brand-text"
                >
                  {conditionToLabel(cond)}
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="text-brand-muted hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Custom condition row */}
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-[10px] text-brand-muted mb-1">Field</label>
              <select
                value={condField}
                onChange={(e) => setCondField(e.target.value)}
                className="bg-brand-surface border border-brand-border rounded-lg px-2 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {CONDITION_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-brand-muted mb-1">Operator</label>
              <select
                value={condOperator}
                onChange={(e) => setCondOperator(e.target.value as CouponCondition['operator'])}
                className="bg-brand-surface border border-brand-border rounded-lg px-2 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-brand-muted mb-1">Value</label>
              <input
                value={condValue}
                onChange={(e) => setCondValue(e.target.value)}
                placeholder="e.g. 1"
                className="bg-brand-surface border border-brand-border rounded-lg px-2 py-2 text-xs text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue w-24"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCondition}>
              Add
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
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
