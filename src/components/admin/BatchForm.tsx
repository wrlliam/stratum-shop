'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import {
  BookmarkIcon,
  BookmarkFilledIcon,
  Cross2Icon,
  LightningBoltIcon,
} from '@radix-ui/react-icons'

interface Product {
  id: string
  name: string
}

interface BatchPreset {
  id: string
  name: string
  productId: string
  quantity: number
  notes: string
}

interface BatchFormProps {
  products: Product[]
  onCreated?: () => void
}

const PRESETS_KEY = 'stratum_batch_presets'

function loadPresets(): BatchPreset[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]')
  } catch {
    return []
  }
}

function savePresets(presets: BatchPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

export function BatchForm({ products, onCreated }: BatchFormProps) {
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [presets, setPresets] = useState<BatchPreset[]>([])
  const [showSavePreset, setShowSavePreset] = useState(false)
  const [presetName, setPresetName] = useState('')

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

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

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Enter a preset name')
      return
    }
    const qty = parseInt(quantity)
    if (!qty || qty <= 0 || !productId) {
      toast.error('Set product and quantity first')
      return
    }
    const newPreset: BatchPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      productId,
      quantity: qty,
      notes: notes || '',
    }
    const updated = [...presets, newPreset]
    setPresets(updated)
    savePresets(updated)
    setPresetName('')
    setShowSavePreset(false)
    toast.success(`Preset "${newPreset.name}" saved`)
  }

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id)
    setPresets(updated)
    savePresets(updated)
    toast.success('Preset deleted')
  }

  const applyPreset = (preset: BatchPreset) => {
    setProductId(preset.productId)
    setQuantity(preset.quantity.toString())
    setNotes(preset.notes)
    toast.success(`Loaded "${preset.name}"`)
  }

  const quickCreateFromPreset = async (preset: BatchPreset) => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventory/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: preset.productId,
          quantity: preset.quantity,
          notes: preset.notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success(`Batch "${preset.name}" created!`)
      onCreated?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name ?? 'Unknown'

  return (
    <div className="space-y-4">
      {/* Presets */}
      {presets.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-2">Quick Create</h3>
          <div className="space-y-1.5">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-brand-border hover:border-brand-blue/40 transition-colors group"
              >
                <button
                  onClick={() => quickCreateFromPreset(preset)}
                  disabled={loading}
                  className="flex-1 text-left min-w-0 flex items-center gap-2"
                  title="Click to instantly create this batch"
                >
                  <LightningBoltIcon className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-brand-text truncate">{preset.name}</p>
                    <p className="text-[10px] text-brand-muted truncate">
                      {getProductName(preset.productId)} x{preset.quantity}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => applyPreset(preset)}
                  className="p-1 text-brand-muted hover:text-brand-blue opacity-0 group-hover:opacity-100 transition-all"
                  title="Load into form"
                >
                  <BookmarkIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="p-1 text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete preset"
                >
                  <Cross2Icon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-border my-3" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Select
          label="Product"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          options={products.map((p) => ({ value: p.id, label: p.name }))}
        />
        <Input
          label="Quantity"
          type="number"
          min="1"
          placeholder="10"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <Input
          label="Notes"
          placeholder="Optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Create Batch
          </Button>
          {!showSavePreset ? (
            <button
              type="button"
              onClick={() => setShowSavePreset(true)}
              className="text-xs text-brand-muted hover:text-brand-text flex items-center gap-1 transition-colors"
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
              Save Preset
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="px-2 py-1 text-xs border border-brand-border rounded-lg bg-brand-surface text-brand-text w-28 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSavePreset())}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSavePreset}
                className="p-1.5 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 transition-colors"
              >
                <BookmarkFilledIcon className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => { setShowSavePreset(false); setPresetName('') }}
                className="p-1.5 text-brand-muted hover:text-brand-text transition-colors"
              >
                <Cross2Icon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
