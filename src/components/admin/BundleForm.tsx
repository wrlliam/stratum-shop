'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckIcon, Cross1Icon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ProductWithImages } from '@/types'

interface Props {
  availableProducts: ProductWithImages[]
  bundle?: {
    id: string
    name: string
    description?: string | null
    discountPercent: number
    active: boolean
    productIds: string[]
  }
}

export function BundleForm({ availableProducts, bundle }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: bundle?.name || '',
    description: bundle?.description || '',
    discountPercent: bundle?.discountPercent ?? 10,
    active: bundle?.active ?? true,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(bundle?.productIds || [])
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedProducts = availableProducts.filter((p) => selectedIds.has(p.id))
  const originalTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0)
  const discountedTotal = Math.round(originalTotal * (1 - form.discountPercent / 100))
  const savings = originalTotal - discountedTotal

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (selectedIds.size < 2) newErrors.products = 'Select at least 2 products'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || undefined,
        discountPercent: Number(form.discountPercent),
        active: form.active,
        productIds: Array.from(selectedIds),
      }

      const url = bundle ? `/api/bundles/${bundle.id}` : '/api/bundles'
      const method = bundle ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error()

      toast.success(bundle ? 'Bundle updated!' : 'Bundle created!')
      router.push('/admin/bundles')
      router.refresh()
    } catch {
      toast.error('Failed to save bundle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product selector */}
        <div className="lg:col-span-2">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-brand-text">Select Products</h2>
              {selectedIds.size > 0 && (
                <span className="text-xs text-brand-blue">{selectedIds.size} selected</span>
              )}
            </div>

            {errors.products && (
              <p className="text-xs text-red-500 mb-3">{errors.products}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {availableProducts.map((product) => {
                const selected = selectedIds.has(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`relative rounded-xl border-2 overflow-hidden text-left transition-all duration-200 ${
                      selected
                        ? 'border-brand-blue bg-brand-blue-light'
                        : 'border-brand-border hover:border-brand-slate'
                    }`}
                  >
                    {/* Check indicator */}
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-blue flex items-center justify-center z-10">
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative aspect-square bg-brand-arctic">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-2xl">🖨️</div>
                      )}
                    </div>

                    <div className="p-2">
                      <p className="text-xs font-semibold text-brand-text leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-xs text-brand-blue font-bold mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected summary */}
          {selectedProducts.length > 0 && (
            <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 mt-4 shadow-card">
              <h3 className="text-sm font-bold text-brand-text mb-3">Bundle Summary</h3>
              <div className="space-y-2 mb-4">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-brand-text truncate pr-4">{p.name}</span>
                    <span className="text-brand-muted">{formatPrice(p.price)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-brand-border pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Original total</span>
                  <span className="text-brand-muted line-through">{formatPrice(originalTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-blue">Discount ({form.discountPercent}%)</span>
                  <span className="text-green-600">-{formatPrice(savings)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-brand-text">Bundle price</span>
                  <span className="text-brand-blue text-lg">{formatPrice(discountedTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-5">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
            <h2 className="text-sm font-bold text-brand-text">Bundle Info</h2>

            <Input
              label="Bundle Name"
              placeholder="The Starter Pack"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              error={errors.name}
            />

            <Textarea
              label="Description"
              placeholder="What's included and why it's great..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />

            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
                Discount Percent
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={form.discountPercent}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))
                  }
                  className="flex-1 accent-brand-blue"
                />
                <span className="text-lg font-bold text-brand-blue w-12 text-right">
                  {form.discountPercent}%
                </span>
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-brand-text">Active</p>
                <p className="text-xs text-brand-muted">Show in shop</p>
              </div>
              <div
                onClick={() => setForm((p) => ({ ...p, active: !p.active }))}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  form.active ? 'bg-brand-blue' : 'bg-brand-arctic border border-brand-border'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-brand-surface shadow transition-transform duration-200 ${
                    form.active ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              {bundle ? 'Update Bundle' : 'Create Bundle'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
