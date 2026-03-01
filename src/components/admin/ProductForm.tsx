'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadIcon, Cross1Icon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import type { ProductWithImagesAndOptions } from '@/types'

interface OptionChoiceForm {
  label: string
  priceModifier: string
}

interface OptionGroupForm {
  name: string
  choices: OptionChoiceForm[]
}

interface ProductFormProps {
  product?: ProductWithImagesAndOptions
}

interface ImageItem {
  url: string
  alt: string
  isNew?: boolean
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product ? String(product.price / 100) : '',
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice / 100) : '',
    stock: product ? String(product.stock) : '0',
    tags: product?.tags?.join(', ') || '',
    featured: product?.featured || false,
    active: product?.active ?? true,
    material: product?.material || '',
    color: product?.color || '',
    weight: product?.weight ? String(product.weight) : '',
    printTime: product?.printTime ? String(product.printTime) : '',
  })

  const [images, setImages] = useState<ImageItem[]>(
    product?.images.map((img) => ({ url: img.url, alt: img.alt || '' })) || []
  )

  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>(
    product?.optionGroups?.map((g) => ({
      name: g.name,
      choices: g.choices.map((c) => ({
        label: c.label,
        priceModifier: String(c.priceModifier / 100),
      })),
    })) || []
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (const file of Array.from(files)) {
        formData.append('files', file)
      }

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setImages((prev) => [
        ...prev,
        ...data.urls.map((url: string) => ({ url, alt: form.name || '', isNew: true })),
      ])
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      newErrors.price = 'Valid price is required'
    }
    if (form.stock === '' || isNaN(Number(form.stock))) {
      newErrors.stock = 'Valid stock count is required'
    }
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
        shortDescription: form.shortDescription || undefined,
        price: Math.round(Number(form.price) * 100),
        compareAtPrice: form.compareAtPrice ? Math.round(Number(form.compareAtPrice) * 100) : undefined,
        stock: Number(form.stock),
        tags: form.tags
          ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        featured: form.featured,
        active: form.active,
        material: form.material || undefined,
        color: form.color || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        printTime: form.printTime ? Number(form.printTime) : undefined,
        images: images.map((img) => ({ url: img.url, alt: img.alt })),
        optionGroups: optionGroups
          .filter((g) => g.name.trim() && g.choices.some((c) => c.label.trim()))
          .map((g) => ({
            name: g.name.trim(),
            choices: g.choices
              .filter((c) => c.label.trim())
              .map((c) => ({
                label: c.label.trim(),
                priceModifier: Math.round(Number(c.priceModifier || 0) * 100),
              })),
          })),
      }

      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      toast.success(product ? 'Product updated!' : 'Product created!')
      router.push('/admin/products')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
            <h2 className="text-sm font-bold text-brand-text">Product Info</h2>

            <Input
              label="Product Name"
              placeholder="Articulated Dragon"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />

            <Textarea
              label="Short Description"
              placeholder="Brief one-liner shown in listings..."
              rows={2}
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
            />

            <Textarea
              label="Full Description"
              placeholder="Detailed description, print settings, uses..."
              rows={6}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Images */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Images</h2>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-brand-arctic group">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-1.5 bg-red-500/90 rounded-lg text-white"
                    >
                      <Cross1Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {i === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-brand-blue/90 text-white text-[9px] font-bold text-center py-0.5">
                      COVER
                    </div>
                  )}
                </div>
              ))}

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-brand-border hover:border-brand-slate flex flex-col items-center justify-center gap-1 text-brand-muted hover:text-brand-text transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full" />
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5" />
                    <span className="text-[10px]">Add</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleImageUpload(e.target.files)}
            />

            <p className="text-xs text-brand-muted">
              First image is the cover. Drag to reorder (coming soon).
            </p>
          </div>

          {/* Details */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Print Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Material"
                placeholder="PLA+"
                value={form.material}
                onChange={(e) => set('material', e.target.value)}
              />
              <Input
                label="Color"
                placeholder="Silk Gold"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
              />
              <Input
                label="Weight (grams)"
                type="number"
                placeholder="85"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
              />
              <Input
                label="Print Time (minutes)"
                type="number"
                placeholder="180"
                value={form.printTime}
                onChange={(e) => set('printTime', e.target.value)}
              />
            </div>
          </div>
          {/* Custom Options */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-brand-text">Custom Options</h2>
              <button
                type="button"
                onClick={() =>
                  setOptionGroups((prev) => [
                    ...prev,
                    { name: '', choices: [{ label: '', priceModifier: '0' }] },
                  ])
                }
                className="text-xs font-semibold text-brand-blue hover:underline"
              >
                + Add Option Group
              </button>
            </div>

            {optionGroups.length === 0 && (
              <p className="text-xs text-brand-muted">
                No custom options. Add groups like &quot;Color&quot; or &quot;Size&quot; with choices that can modify the price.
              </p>
            )}

            <div className="space-y-4">
              {optionGroups.map((group, gi) => (
                <div
                  key={gi}
                  className="border border-brand-border rounded-xl p-4 space-y-3 bg-brand-arctic"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Group name (e.g. Color)"
                      value={group.name}
                      onChange={(e) =>
                        setOptionGroups((prev) =>
                          prev.map((g, i) =>
                            i === gi ? { ...g, name: e.target.value } : g
                          )
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setOptionGroups((prev) => prev.filter((_, i) => i !== gi))
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                    >
                      <Cross1Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 pl-2">
                    {group.choices.map((choice, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <input
                          placeholder="Choice label"
                          value={choice.label}
                          onChange={(e) =>
                            setOptionGroups((prev) =>
                              prev.map((g, i) =>
                                i === gi
                                  ? {
                                      ...g,
                                      choices: g.choices.map((c, j) =>
                                        j === ci
                                          ? { ...c, label: e.target.value }
                                          : c
                                      ),
                                    }
                                  : g
                              )
                            )
                          }
                          className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-brand-muted">+£</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={choice.priceModifier}
                            onChange={(e) =>
                              setOptionGroups((prev) =>
                                prev.map((g, i) =>
                                  i === gi
                                    ? {
                                        ...g,
                                        choices: g.choices.map((c, j) =>
                                          j === ci
                                            ? { ...c, priceModifier: e.target.value }
                                            : c
                                        ),
                                      }
                                    : g
                                )
                              )
                            }
                            className="w-20 px-2 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setOptionGroups((prev) =>
                              prev.map((g, i) =>
                                i === gi
                                  ? {
                                      ...g,
                                      choices: g.choices.filter(
                                        (_, j) => j !== ci
                                      ),
                                    }
                                  : g
                              )
                            )
                          }
                          className="p-1.5 text-red-400 hover:text-red-500"
                          disabled={group.choices.length <= 1}
                        >
                          <Cross1Icon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOptionGroups((prev) =>
                        prev.map((g, i) =>
                          i === gi
                            ? {
                                ...g,
                                choices: [
                                  ...g.choices,
                                  { label: '', priceModifier: '0' },
                                ],
                              }
                            : g
                        )
                      )
                    }
                    className="text-xs font-medium text-brand-blue hover:underline ml-2"
                  >
                    + Add Choice
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Pricing */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
            <h2 className="text-sm font-bold text-brand-text">Pricing</h2>
            <Input
              label="Price (£)"
              type="number"
              step="0.01"
              placeholder="12.99"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              error={errors.price}
            />
            <Input
              label="Compare at Price (£)"
              type="number"
              step="0.01"
              placeholder="19.99"
              value={form.compareAtPrice}
              onChange={(e) => set('compareAtPrice', e.target.value)}
              hint="Original price (for sale display)"
            />
          </div>

          {/* Inventory */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
            <h2 className="text-sm font-bold text-brand-text">Inventory</h2>
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              placeholder="10"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              error={errors.stock}
            />
          </div>

          {/* Tags */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Tags & SEO</h2>
            <Input
              label="Tags"
              placeholder="dragon, articulated, flexi"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              hint="Comma-separated tags for search & SEO"
            />
          </div>

          {/* Status */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
            <h2 className="text-sm font-bold text-brand-text">Status</h2>

            {[
              { key: 'active', label: 'Active', description: 'Visible in the shop' },
              { key: 'featured', label: 'Featured', description: 'Shown on homepage' },
            ].map((toggle) => (
              <label key={toggle.key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-brand-text">{toggle.label}</p>
                  <p className="text-xs text-brand-muted">{toggle.description}</p>
                </div>
                <div
                  onClick={() => set(toggle.key, !form[toggle.key as keyof typeof form])}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    form[toggle.key as keyof typeof form]
                      ? 'bg-brand-blue'
                      : 'bg-brand-arctic border border-brand-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      form[toggle.key as keyof typeof form] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {product ? 'Update Product' : 'Create Product'}
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
