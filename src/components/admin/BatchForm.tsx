'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
}

interface BatchFormProps {
  products: Product[]
  onCreated?: () => void
}

export function BatchForm({ products, onCreated }: BatchFormProps) {
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity')
      return
    }
    if (!productId) {
      toast.error('Select a product')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: qty, notes: notes || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create batch')
      }
      toast.success('Batch created!')
      setQuantity('')
      setNotes('')
      onCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create batch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1 block">
          Product
        </label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1 block">
          Quantity
        </label>
        <input
          type="number"
          min="1"
          placeholder="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1 block">
          Notes
        </label>
        <input
          type="text"
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
        />
      </div>
      <Button type="submit" variant="primary" size="sm" loading={loading}>
        Create Batch
      </Button>
    </form>
  )
}
