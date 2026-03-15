'use client'

import { useState } from 'react'
import { Cross1Icon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AppliedCoupon {
  couponId: string
  code: string
  discountAmount: number
}

interface Props {
  subtotal: number
  onApply: (coupon: AppliedCoupon) => void
  onRemove: () => void
  applied: AppliedCoupon | null
}

export function CouponInput({ subtotal, onApply, onRemove, applied }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    if (!code.trim()) return
    setLoading(true)

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Invalid coupon')
        return
      }

      onApply({
        couponId: data.couponId,
        code: data.code,
        discountAmount: data.discountAmount,
      })
      toast.success(`Coupon applied: -${formatPrice(data.discountAmount)}`)
    } catch {
      toast.error('Failed to validate coupon')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-3 py-2">
        <div>
          <span className="text-xs font-semibold text-green-700 font-mono">{applied.code}</span>
          <span className="text-xs text-green-600 ml-2">-{formatPrice(applied.discountAmount)}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          <Cross1Icon className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        className="flex-1 bg-brand-surface border border-brand-border rounded-sm px-3 py-2 text-sm text-brand-text placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
      />
      <Button variant="secondary" size="sm" onClick={handleApply} loading={loading}>
        Apply
      </Button>
    </div>
  )
}
