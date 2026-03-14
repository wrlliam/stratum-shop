'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'

interface StockAdjustFormProps {
  productId: string
  productName: string
  currentStock: number
  onAdjusted?: (newStock: number) => void
}

export function StockAdjustForm({ productId, productName, currentStock, onAdjusted }: StockAdjustFormProps) {
  const [change, setChange] = useState('')
  const [reason, setReason] = useState('manual')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(change)
    if (!qty || isNaN(qty)) {
      toast.error('Enter a valid quantity')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantityChange: qty, reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to adjust')
      }
      const data = await res.json()
      toast.success(`Stock updated to ${data.stock}`)
      setChange('')
      onAdjusted?.(data.stock)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-brand-text">{productName}</p>
        <p className="text-xs text-brand-muted">Current stock: {currentStock}</p>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="+5 or -3"
          value={change}
          onChange={(e) => setChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
        />
        <Select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { value: 'manual', label: 'Manual' },
            { value: 'batch_completed', label: 'Batch Completed' },
            { value: 'refund', label: 'Refund' },
          ]}
        />
      </div>
      <Button type="submit" variant="primary" size="sm" loading={loading}>
        Adjust Stock
      </Button>
    </form>
  )
}
