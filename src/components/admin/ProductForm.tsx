'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UploadIcon, Cross1Icon, ChevronDownIcon } from '@radix-ui/react-icons'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'
import type { ProductWithImagesAndOptions } from '@/types'
import type { Filament } from '@/lib/db/schema'

interface OptionChoiceForm { label: string; priceModifier: string }
interface OptionGroupForm { name: string; type: 'select' | 'boolean' | 'text'; choices: OptionChoiceForm[] }
interface CustomFieldForm { type: 'text' | 'image' | 'number' | 'select'; label: string; required: boolean; placeholder: string; options: string }
interface ProductFormProps { product?: ProductWithImagesAndOptions }
interface ImageItem { url: string; alt: string; isNew?: boolean }

type ProductRecord = Record<string, unknown>
type Tab = 'basic' | 'media' | 'pricing' | 'print' | 'options'

const LS_KEY = 'stratum-pricing-defaults'

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic', label: 'Basic' },
  { id: 'media', label: 'Media' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'print', label: 'Print & Inventory' },
  { id: 'options', label: 'Options' },
]

function calcRecommendedPrice(opts: {
  printMinutes: number; filamentGrams: number; filamentCostPerKg: number
  electricity: number; wattage: number; labourMinutes: number; labourRate: number
  failure: number; profit: number
}): number {
  const hrs = opts.printMinutes / 60
  const filament = (opts.filamentGrams / 1000) * opts.filamentCostPerKg
  const elec = hrs * (opts.wattage / 1000) * opts.electricity
  const labour = (opts.labourMinutes / 60) * opts.labourRate
  const sub = filament + elec + labour
  return Math.round(sub * (1 + opts.failure / 100) * (1 + opts.profit / 100))
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 ${
        on ? 'bg-brand-blue' : 'bg-brand-arctic border border-brand-border'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-brand-surface shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
  )
}

const sel = 'w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
const selSm = 'bg-brand-surface border border-brand-border rounded-lg px-2.5 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
const fieldInput = `flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue`

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const p = product as ProductRecord | undefined

  const [activeTab, setActiveTab] = useState<Tab>('basic')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [digitalUploading, setDigitalUploading] = useState(false)
  const [modelUploading, setModelUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const digitalFileRef = useRef<HTMLInputElement>(null)
  const modelFileRef = useRef<HTMLInputElement>(null)

  const [filaments, setFilaments] = useState<Filament[]>([])
  const [digitalFilePath, setDigitalFilePath] = useState((p?.digitalFilePath as string) || '')

  const [elecRate, setElecRate] = useState(29)
  const [wattage, setWattage] = useState(200)
  const [elecOpen, setElecOpen] = useState(false)

  const [saleOpen, setSaleOpen] = useState(!!(p?.saleEndsAt || p?.compareAtPrice))
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')

  const [calcOpen, setCalcOpen] = useState(false)
  const [calc, setCalc] = useState({ filamentId: '', grams: '', labourMinutes: '10', labourRate: '12', failure: '5', profit: '40' })

  const existingPrintMins = product?.printTime ?? 0
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
    printTimeHours: existingPrintMins ? String(Math.floor(existingPrintMins / 60)) : '',
    printTimeMinutes: existingPrintMins ? String(existingPrintMins % 60) : '',
    sku: product?.sku || '',
    lowStockThreshold: product?.lowStockThreshold ? String(product.lowStockThreshold) : '',
    lowStockAlerts: product?.lowStockAlerts ?? false,
    productType: (p?.productType as string) || 'physical',
    modelUrl: (p?.modelUrl as string) || '',
    digitalFileUrl: (p?.digitalFileUrl as string) || '',
    filamentId: (p?.filamentId as string) || '',
    saleEndsAt: p?.saleEndsAt ? new Date(p.saleEndsAt as string).toISOString().slice(0, 16) : '',
    saleStopAtStock: p?.saleStopAtStock ? String(p.saleStopAtStock) : '',
  })

  const [images, setImages] = useState<ImageItem[]>(
    product?.images.map((img) => ({ url: img.url, alt: img.alt || '' })) || []
  )
  const [optionGroups, setOptionGroups] = useState<OptionGroupForm[]>(
    product?.optionGroups?.map((g) => ({
      name: g.name,
      type: (g.type as 'select' | 'boolean' | 'text') || 'select',
      choices: g.choices.map((c) => ({ label: c.label, priceModifier: String(c.priceModifier / 100) })),
    })) || []
  )
  const [customFields, setCustomFields] = useState<CustomFieldForm[]>(() => {
    const existing = p?.customOrderFields
    if (Array.isArray(existing)) {
      return (existing as ProductRecord[]).map((f) => ({
        type: (f.type as CustomFieldForm['type']) || 'text',
        label: (f.label as string) || '',
        required: Boolean(f.required),
        placeholder: (f.placeholder as string) || '',
        options: Array.isArray(f.options) ? (f.options as string[]).join(', ') : '',
      }))
    }
    return []
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/filaments').then((r) => r.json()).then(setFilaments).catch(() => {})
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
      if (saved.electricityCostPerKwh) setElecRate(Number(saved.electricityCostPerKwh))
      if (saved.printerWattage) setWattage(Number(saved.printerWattage))
      setCalc((prev) => ({
        ...prev,
        labourRate: saved.labourCostPerHour ? String(saved.labourCostPerHour / 100) : prev.labourRate,
        labourMinutes: saved.labourMinutes ? String(saved.labourMinutes) : prev.labourMinutes,
        failure: saved.failureRate ? String(saved.failureRate) : prev.failure,
        profit: saved.profitMargin ? String(saved.profitMargin) : prev.profit,
      }))
    } catch {}
  }, [])

  const set = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }))
  const setC = (key: string, value: string) => setCalc((prev) => ({ ...prev, [key]: value }))

  const selectedFilament = filaments.find((f) => f.id === form.filamentId)

  const printMins = Number(form.printTimeHours || 0) * 60 + Number(form.printTimeMinutes || 0)
  const printHrs = printMins / 60
  const gramsNum = Number(form.weight) || 0
  const autoFilamentCost = selectedFilament && gramsNum
    ? Math.round((gramsNum / 1000) * selectedFilament.pricePerKgPence)
    : 0
  const autoElecCost = printHrs > 0 ? Math.round(printHrs * (wattage / 1000) * elecRate) : 0
  const autoTotalCost = autoFilamentCost + autoElecCost

  const calcFilament = filaments.find((f) => f.id === calc.filamentId) || selectedFilament
  const recommendedPrice = calcOpen ? calcRecommendedPrice({
    printMinutes: printMins,
    filamentGrams: Number(calc.grams) || gramsNum,
    filamentCostPerKg: calcFilament?.pricePerKgPence ?? 1799,
    electricity: elecRate,
    wattage,
    labourMinutes: Number(calc.labourMinutes) || 10,
    labourRate: Math.round(Number(calc.labourRate) * 100) || 1200,
    failure: Number(calc.failure) || 5,
    profit: Number(calc.profit) || 40,
  }) : 0

  const currentPriceNum = Number(form.price) || 0
  const discountNum = Number(discountValue) || 0
  const salePrice = discountNum > 0
    ? discountType === 'percent' ? currentPriceNum * (1 - discountNum / 100) : currentPriceNum - discountNum
    : 0

  const applySale = () => {
    if (salePrice <= 0 || !currentPriceNum) return
    setForm((prev) => ({
      ...prev,
      compareAtPrice: String(currentPriceNum),
      price: String(Math.round(salePrice * 100) / 100),
    }))
    setDiscountValue('')
  }

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      for (const f of Array.from(files)) fd.append('files', f)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setImages((prev) => [...prev, ...data.urls.map((url: string) => ({ url, alt: form.name || '', isNew: true }))])
    } catch { toast.error('Image upload failed') }
    finally { setUploading(false) }
  }

  const handleDigitalUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setDigitalUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', files[0])
      fd.append('type', 'digital')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.paths?.[0]) { setDigitalFilePath(data.paths[0]); toast.success('File uploaded') }
    } catch { toast.error('File upload failed') }
    finally { setDigitalUploading(false) }
  }

  const handleModelUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setModelUploading(true)
    try {
      const fd = new FormData()
      fd.append('files', files[0])
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.urls?.[0]) { set('modelUrl', data.urls[0]); toast.success('Model uploaded') }
    } catch { toast.error('Model upload failed') }
    finally { setModelUploading(false) }
  }

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Valid price is required'
    if (form.stock === '' || isNaN(Number(form.stock))) e.stock = 'Valid stock count is required'
    setErrors(e)
    return Object.keys(e).length === 0
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
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        featured: form.featured,
        active: form.active,
        material: selectedFilament?.material || form.material || undefined,
        color: selectedFilament?.color || form.color || undefined,
        weight: gramsNum || undefined,
        printTime: printMins || undefined,
        sku: form.sku || undefined,
        lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
        lowStockAlerts: form.lowStockAlerts,
        filamentCostPence: autoFilamentCost || undefined,
        estimatedMinutes: printMins || undefined,
        productType: form.productType,
        modelUrl: form.modelUrl || undefined,
        digitalFileUrl: form.digitalFileUrl || undefined,
        filamentId: form.filamentId || undefined,
        digitalFilePath: digitalFilePath || undefined,
        saleEndsAt: form.saleEndsAt || undefined,
        saleStopAtStock: form.saleStopAtStock ? Number(form.saleStopAtStock) : undefined,
        customOrderFields:
          form.productType === 'custom_order' && customFields.length > 0
            ? customFields.map((f) => ({
                type: f.type,
                label: f.label,
                required: f.required,
                placeholder: f.placeholder || undefined,
                options: f.type === 'select' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
              }))
            : undefined,
        images: images.map((img) => ({ url: img.url, alt: img.alt })),
        optionGroups: optionGroups
          .filter((g) => g.name.trim() && g.choices.some((c) => c.label.trim()))
          .map((g) => ({
            name: g.name.trim(),
            type: g.type,
            choices: g.choices.filter((c) => c.label.trim()).map((c) => ({
              label: c.label.trim(),
              priceModifier: Math.round(Number(c.priceModifier || 0) * 100),
            })),
          })),
      }

      const url = product ? `/api/products/${product.id}` : '/api/products'
      const res = await fetch(url, {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save') }
      toast.success(product ? 'Product updated!' : 'Product created!')
      router.push('/admin/products')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally { setLoading(false) }
  }

  const updateCustomField = (i: number, key: keyof CustomFieldForm, value: string | boolean) =>
    setCustomFields((prev) => prev.map((f, j) => (j === i ? { ...f, [key]: value } : f)))

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      {/* Tab bar */}
      <div className="bg-brand-surface border border-brand-border rounded-t-2xl px-2 pt-2 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-brand-blue text-brand-blue bg-brand-blue/5'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-brand-surface border border-brand-border border-t-0 rounded-b-2xl p-6 shadow-card space-y-6">

        {/* ── Basic ── */}
        {activeTab === 'basic' && (
          <>
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-brand-text">Product Info</h2>
              <Input label="Product Name" placeholder="Articulated Dragon" value={form.name}
                onChange={(e) => set('name', e.target.value)} error={errors.name} />
              <Textarea label="Short Description" placeholder="Brief one-liner shown in listings…" rows={2}
                value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
              <Textarea label="Full Description" placeholder="Detailed description, print settings, uses…" rows={6}
                value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <div className="border-t border-brand-border pt-5">
              <h2 className="text-sm font-bold text-brand-text mb-3">Identifier</h2>
              <Input label="SKU" placeholder="STR-DRG-001" value={form.sku}
                onChange={(e) => set('sku', e.target.value)} hint="Optional stock keeping unit" />
            </div>

            <div className="border-t border-brand-border pt-5">
              <h2 className="text-sm font-bold text-brand-text mb-3">Tags</h2>
              <Input label="Tags" placeholder="dragon, articulated, flexi" value={form.tags}
                onChange={(e) => set('tags', e.target.value)} hint="Comma-separated · used for search and SEO" />
            </div>

            <div className="border-t border-brand-border pt-5 space-y-4">
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
                  <Toggle on={!!form[toggle.key as keyof typeof form]}
                    onClick={() => set(toggle.key, !form[toggle.key as keyof typeof form])} />
                </label>
              ))}
            </div>
          </>
        )}

        {/* ── Media ── */}
        {activeTab === 'media' && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-brand-text">Images</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-brand-arctic group">
                  <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="120px" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => removeImage(i)} className="p-1.5 bg-red-500/90 rounded-lg text-white">
                      <Cross1Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {i === 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-brand-blue/90 text-white text-[9px] font-bold text-center py-0.5">COVER</div>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-brand-border hover:border-brand-slate flex flex-col items-center justify-center gap-1 text-brand-muted hover:text-brand-text transition-colors">
                {uploading
                  ? <div className="animate-spin w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full" />
                  : <><UploadIcon className="w-5 h-5" /><span className="text-[10px]">Add</span></>}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only"
              onChange={(e) => handleImageUpload(e.target.files)} />
            <p className="text-xs text-brand-muted">First image is the cover.</p>

            {form.productType === '3d_model' && (
              <div className="pt-4 border-t border-brand-border">
                <FieldLabel>3D Model File (.glb / .gltf)</FieldLabel>
                {form.modelUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-brand-arctic rounded-xl">
                    <span className="flex-1 text-xs font-mono text-brand-text truncate">{form.modelUrl.split('/').pop()}</span>
                    <button type="button" onClick={() => set('modelUrl', '')} className="text-red-400 hover:text-red-500">
                      <Cross1Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => modelFileRef.current?.click()} disabled={modelUploading}
                    className="w-full py-3 border-2 border-dashed border-brand-border rounded-xl text-sm text-brand-muted hover:border-brand-slate hover:text-brand-text transition-colors flex items-center justify-center gap-2">
                    {modelUploading
                      ? <div className="animate-spin w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full" />
                      : <><UploadIcon className="w-4 h-4" />Upload 3D model</>}
                  </button>
                )}
                <input ref={modelFileRef} type="file" accept=".glb,.gltf" className="sr-only"
                  onChange={(e) => handleModelUpload(e.target.files)} />
              </div>
            )}
          </div>
        )}

        {/* ── Pricing ── */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-brand-text">Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (£)" type="number" step="0.01" placeholder="12.99" value={form.price}
                  onChange={(e) => set('price', e.target.value)} error={errors.price} />
                <Input label="Compare at Price (£)" type="number" step="0.01" placeholder="19.99"
                  value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)}
                  hint="Original shown as strikethrough" />
              </div>
            </div>

            {/* Sale */}
            <div className="border-t border-brand-border pt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-brand-text">Sale</h2>
                <Toggle on={saleOpen} onClick={() => setSaleOpen((v) => !v)} />
              </div>
              {saleOpen && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                      className={selSm}>
                      <option value="percent">% off</option>
                      <option value="fixed">£ off</option>
                    </select>
                    <input type="number" step={discountType === 'percent' ? '1' : '0.01'} min="0"
                      placeholder={discountType === 'percent' ? '20' : '5.00'} value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className={`flex-1 ${selSm}`} />
                  </div>
                  {salePrice > 0 && (
                    <div className="p-3 bg-brand-arctic rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-brand-muted uppercase tracking-wider">Sale price</p>
                        <p className="font-bold text-brand-text text-sm">£{Math.max(0, salePrice).toFixed(2)}</p>
                      </div>
                      <button type="button" onClick={applySale}
                        className="text-xs font-semibold text-white bg-brand-blue px-3 py-1.5 rounded-lg hover:bg-brand-blue/90">
                        Apply
                      </button>
                    </div>
                  )}
                  <div>
                    <FieldLabel>Sale ends</FieldLabel>
                    <input type="datetime-local" value={form.saleEndsAt}
                      onChange={(e) => set('saleEndsAt', e.target.value)} className={sel} />
                  </div>
                  <Input label="Stop sale when stock ≤" type="number" min="0" placeholder="0"
                    value={form.saleStopAtStock} onChange={(e) => set('saleStopAtStock', e.target.value)}
                    hint="Automatically ends sale at this stock level" />
                </div>
              )}
            </div>

            {/* Recommended Price */}
            <div className="border-t border-brand-border pt-5">
              <button type="button" onClick={() => setCalcOpen((v) => !v)}
                className="w-full flex items-center justify-between text-left">
                <h2 className="text-sm font-bold text-brand-text">Recommended Price Calculator</h2>
                <ChevronDownIcon className={`w-4 h-4 text-brand-muted transition-transform duration-200 ${calcOpen ? 'rotate-180' : ''}`} />
              </button>
              {calcOpen && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-brand-muted">Uses print details plus labour and margins.</p>
                  <div>
                    <FieldLabel>Override filament</FieldLabel>
                    <select value={calc.filamentId} onChange={(e) => setC('filamentId', e.target.value)} className={sel}>
                      <option value="">{selectedFilament ? `${selectedFilament.material} – ${selectedFilament.color} (from print tab)` : '— Select filament —'}</option>
                      {filaments.map((f) => (
                        <option key={f.id} value={f.id}>{f.material} – {f.color}{f.brand ? ` (${f.brand})` : ''} · £{(f.pricePerKgPence / 100).toFixed(2)}/kg</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Override grams</FieldLabel>
                    <input type="number" min="0" placeholder={form.weight || '85'} value={calc.grams}
                      onChange={(e) => setC('grams', e.target.value)} className={sel} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Labour (min)</FieldLabel>
                      <input type="number" min="0" placeholder="10" value={calc.labourMinutes}
                        onChange={(e) => setC('labourMinutes', e.target.value)} className={sel} />
                    </div>
                    <div>
                      <FieldLabel>Labour (£/hr)</FieldLabel>
                      <input type="number" step="0.5" placeholder="12" value={calc.labourRate}
                        onChange={(e) => setC('labourRate', e.target.value)} className={sel} />
                    </div>
                    <div>
                      <FieldLabel>Failure %</FieldLabel>
                      <input type="number" min="0" max="100" placeholder="5" value={calc.failure}
                        onChange={(e) => setC('failure', e.target.value)} className={sel} />
                    </div>
                    <div>
                      <FieldLabel>Profit %</FieldLabel>
                      <input type="number" min="0" placeholder="40" value={calc.profit}
                        onChange={(e) => setC('profit', e.target.value)} className={sel} />
                    </div>
                  </div>
                  <div className="p-3 bg-brand-arctic rounded-xl">
                    <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Suggested price (ex. VAT)</p>
                    <p className="text-lg font-bold text-brand-text font-mono">{formatPrice(recommendedPrice)}</p>
                  </div>
                  <button type="button" onClick={() => set('price', String(recommendedPrice / 100))}
                    className="w-full py-2 text-sm font-semibold bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 transition-colors">
                    Apply to price
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Print & Inventory ── */}
        {activeTab === 'print' && (
          <div className="space-y-6">
            {/* Filament + print details */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-brand-text">Print Details</h2>
              <div>
                <FieldLabel>Filament</FieldLabel>
                <div className="flex items-center gap-2">
                  {selectedFilament?.colorHex && (
                    <span
                      className="w-7 h-7 rounded-md border border-brand-border flex-shrink-0"
                      style={{ backgroundColor: selectedFilament.colorHex }}
                    />
                  )}
                  <select
                    value={form.filamentId}
                    onChange={(e) => {
                      const f = filaments.find((fl) => fl.id === e.target.value)
                      setForm((prev) => ({
                        ...prev,
                        filamentId: e.target.value,
                        material: f?.material || prev.material,
                        color: f?.color || prev.color,
                      }))
                    }}
                    className={sel}
                  >
                    <option value="">— Select filament from inventory —</option>
                    {filaments.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.material} – {f.color}{f.brand ? ` (${f.brand})` : ''} · {f.weightRemainingGrams}g left
                      </option>
                    ))}
                  </select>
                </div>
                {filaments.length === 0 && (
                  <p className="text-[11px] text-brand-muted mt-1">No filaments in inventory — <a href="/admin/filaments" className="text-brand-blue hover:underline">add some first</a>.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Filament used (grams)" type="number" placeholder="85" value={form.weight}
                  onChange={(e) => set('weight', e.target.value)} />
                <div>
                  <FieldLabel>Print Time</FieldLabel>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="number" min="0" placeholder="2" value={form.printTimeHours}
                        onChange={(e) => set('printTimeHours', e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-brand-muted pointer-events-none">h</span>
                    </div>
                    <div className="relative flex-1">
                      <input type="number" min="0" max="59" placeholder="30" value={form.printTimeMinutes}
                        onChange={(e) => set('printTimeMinutes', e.target.value)}
                        className="w-full px-3 py-2.5 pr-8 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-brand-muted pointer-events-none">m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="border-t border-brand-border pt-5 space-y-4">
              <h2 className="text-sm font-bold text-brand-text">Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Stock Quantity" type="number" min="0" placeholder="10" value={form.stock}
                  onChange={(e) => set('stock', e.target.value)} error={errors.stock} />
                <Input label="Low Stock Alert Threshold" type="number" min="0" placeholder="5"
                  value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)}
                  hint="Alert when stock hits this level" />
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-brand-text">Low Stock Alerts</p>
                  <p className="text-xs text-brand-muted">Email admin when stock hits threshold</p>
                </div>
                <Toggle on={form.lowStockAlerts} onClick={() => set('lowStockAlerts', !form.lowStockAlerts)} />
              </label>
            </div>

            {/* Cost Tracking */}
            <div className="border-t border-brand-border pt-5">
              <h2 className="text-sm font-bold text-brand-text mb-3">Cost Tracking</h2>
              {autoTotalCost > 0 ? (
                <div className="space-y-2 mb-3">
                  {autoFilamentCost > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-muted">
                        Filament ({gramsNum}g × £{((selectedFilament?.pricePerKgPence ?? 0) / 100).toFixed(2)}/kg)
                      </span>
                      <span className="font-mono font-medium text-brand-text">{formatPrice(autoFilamentCost)}</span>
                    </div>
                  )}
                  {autoElecCost > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-muted">
                        Electricity ({printHrs.toFixed(1)}h × {wattage}W × {elecRate}p/kWh)
                      </span>
                      <span className="font-mono font-medium text-brand-text">{formatPrice(autoElecCost)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-brand-border">
                    <span className="font-semibold text-brand-text">Total material cost</span>
                    <span className="font-mono font-bold text-brand-blue">{formatPrice(autoTotalCost)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-brand-muted mb-3">
                  Select a filament and enter grams + print time above to auto-calculate.
                </p>
              )}
              <button type="button" onClick={() => setElecOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-text transition-colors">
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${elecOpen ? 'rotate-180' : ''}`} />
                Electricity settings
              </button>
              {elecOpen && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Rate (p/kWh)</FieldLabel>
                    <input type="number" min="0" step="0.1" value={elecRate}
                      onChange={(e) => setElecRate(Number(e.target.value) || 0)} className={sel} />
                  </div>
                  <div>
                    <FieldLabel>Wattage (W)</FieldLabel>
                    <input type="number" min="0" value={wattage}
                      onChange={(e) => setWattage(Number(e.target.value) || 0)} className={sel} />
                  </div>
                </div>
              )}
            </div>

            {/* Product Type */}
            <div className="border-t border-brand-border pt-5 space-y-4">
              <h2 className="text-sm font-bold text-brand-text">Product Type</h2>
              <div>
                <FieldLabel>Type</FieldLabel>
                <select value={form.productType} onChange={(e) => set('productType', e.target.value)} className={sel}>
                  <option value="physical">Physical</option>
                  <option value="digital">Digital Download</option>
                  <option value="3d_model">3D Model File</option>
                  <option value="custom_order">Custom Order</option>
                </select>
              </div>
              {(form.productType === 'digital' || form.productType === '3d_model') && (
                <div>
                  <FieldLabel>{form.productType === 'digital' ? 'Digital File' : 'Download File'}</FieldLabel>
                  {digitalFilePath ? (
                    <div className="flex items-center gap-2 p-3 bg-brand-arctic rounded-xl">
                      <span className="flex-1 text-xs font-mono text-brand-text truncate">{digitalFilePath.split('/').pop()}</span>
                      <button type="button" onClick={() => setDigitalFilePath('')} className="text-red-400 hover:text-red-500">
                        <Cross1Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => digitalFileRef.current?.click()} disabled={digitalUploading}
                      className="w-full py-3 border-2 border-dashed border-brand-border rounded-xl text-sm text-brand-muted hover:border-brand-slate hover:text-brand-text transition-colors flex items-center justify-center gap-2">
                      {digitalUploading
                        ? <div className="animate-spin w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full" />
                        : <><UploadIcon className="w-4 h-4" />Upload file</>}
                    </button>
                  )}
                  <input ref={digitalFileRef} type="file" accept=".pdf,.zip,.glb,.gltf,.stl,.step,.obj,.fbx,.blend" className="sr-only"
                    onChange={(e) => handleDigitalUpload(e.target.files)} />
                  <p className="text-[11px] text-brand-muted mt-1">Stored securely · license included on download</p>
                </div>
              )}
            </div>

            {/* Custom Order Fields */}
            {form.productType === 'custom_order' && (
              <div className="border-t border-brand-border pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-brand-text">Custom Order Fields</h2>
                  <button type="button"
                    onClick={() => setCustomFields((prev) => [...prev, { type: 'text', label: '', required: false, placeholder: '', options: '' }])}
                    className="text-xs font-semibold text-brand-blue hover:underline">
                    + Add Field
                  </button>
                </div>
                <p className="text-xs text-brand-muted mb-3">Define what customers submit when claiming this order after purchase.</p>
                <div className="space-y-3">
                  {customFields.map((field, i) => (
                    <div key={i} className="border border-brand-border rounded-xl p-3 bg-brand-arctic space-y-2">
                      <div className="flex items-center gap-2">
                        <select value={field.type}
                          onChange={(e) => updateCustomField(i, 'type', e.target.value as CustomFieldForm['type'])}
                          className={selSm}>
                          <option value="text">Text</option>
                          <option value="image">Image</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown</option>
                        </select>
                        <input placeholder="Field label" value={field.label}
                          onChange={(e) => updateCustomField(i, 'label', e.target.value)}
                          className={fieldInput} />
                        <button type="button" onClick={() => setCustomFields((prev) => prev.filter((_, j) => j !== i))}
                          className="p-1.5 text-red-400 hover:text-red-500 flex-shrink-0">
                          <Cross1Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {field.type !== 'image' && (
                        <input placeholder="Placeholder text (optional)" value={field.placeholder}
                          onChange={(e) => updateCustomField(i, 'placeholder', e.target.value)}
                          className={`w-full ${fieldInput}`} />
                      )}
                      {field.type === 'select' && (
                        <input placeholder="Options, comma-separated (e.g. Red, Green, Blue)" value={field.options}
                          onChange={(e) => updateCustomField(i, 'options', e.target.value)}
                          className={`w-full ${fieldInput}`} />
                      )}
                      <label className="flex items-center gap-2 text-xs text-brand-muted cursor-pointer">
                        <input type="checkbox" checked={field.required}
                          onChange={(e) => updateCustomField(i, 'required', e.target.checked)} className="rounded" />
                        Required
                      </label>
                    </div>
                  ))}
                  {customFields.length === 0 && (
                    <p className="text-xs text-brand-muted text-center py-4">No fields yet. Add fields to define what customers submit.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Options ── */}
        {activeTab === 'options' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-brand-text">Custom Options</h2>
              <button type="button"
                onClick={() => setOptionGroups((prev) => [...prev, { name: '', type: 'select', choices: [{ label: '', priceModifier: '0' }] }])}
                className="text-xs font-semibold text-brand-blue hover:underline">
                + Add Option Group
              </button>
            </div>
            {optionGroups.length === 0 && (
              <p className="text-xs text-brand-muted">No custom options. Add groups like &quot;Color&quot; or &quot;Size&quot; with choices that can modify the price.</p>
            )}
            <div className="space-y-4">
              {optionGroups.map((group, gi) => (
                <div key={gi} className="border border-brand-border rounded-xl p-4 space-y-3 bg-brand-arctic">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Group name (e.g. Color)" value={group.name}
                      onChange={(e) => setOptionGroups((prev) => prev.map((g, i) => i === gi ? { ...g, name: e.target.value } : g))} />
                    <select value={group.type}
                      onChange={(e) => {
                        const newType = e.target.value as 'select' | 'boolean' | 'text'
                        setOptionGroups((prev) => prev.map((g, i) => i === gi
                          ? { ...g, type: newType, choices: newType !== 'select' ? [g.choices[0] || { label: '', priceModifier: '0' }] : g.choices }
                          : g))
                      }}
                      className={selSm}>
                      <option value="select">Select</option>
                      <option value="boolean">Boolean</option>
                      <option value="text">Text</option>
                    </select>
                    <button type="button" onClick={() => setOptionGroups((prev) => prev.filter((_, i) => i !== gi))}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                      <Cross1Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(group.type === 'boolean' || group.type === 'text') && (
                    <div className="space-y-2 pl-2">
                      <p className="text-xs text-brand-muted">
                        {group.type === 'boolean' ? 'Toggle option — shown as a switch to customers' : 'Text input — customers type custom text (e.g. engraving)'}
                      </p>
                      <div className="flex items-center gap-2">
                        <input placeholder={group.type === 'boolean' ? 'Label (e.g. Gift wrap)' : 'Placeholder text'}
                          value={group.choices[0]?.label || ''}
                          onChange={(e) => setOptionGroups((prev) => prev.map((g, i) => i === gi ? { ...g, choices: [{ ...g.choices[0], label: e.target.value }] } : g))}
                          className={fieldInput} />
                        <span className="text-xs text-brand-muted flex-shrink-0">+£</span>
                        <input type="number" step="0.01" placeholder="0"
                          value={group.choices[0]?.priceModifier || '0'}
                          onChange={(e) => setOptionGroups((prev) => prev.map((g, i) => i === gi
                            ? { ...g, choices: [{ ...g.choices[0], label: g.choices[0]?.label || '', priceModifier: e.target.value }] }
                            : g))}
                          className={`w-20 ${selSm}`} />
                      </div>
                    </div>
                  )}

                  {group.type === 'select' && (
                    <>
                      <div className="space-y-2 pl-2">
                        {group.choices.map((choice, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <input placeholder="Choice label" value={choice.label}
                              onChange={(e) => setOptionGroups((prev) => prev.map((g, i) => i === gi
                                ? { ...g, choices: g.choices.map((c, j) => j === ci ? { ...c, label: e.target.value } : c) }
                                : g))}
                              className={fieldInput} />
                            <span className="text-xs text-brand-muted flex-shrink-0">+£</span>
                            <input type="number" step="0.01" placeholder="0" value={choice.priceModifier}
                              onChange={(e) => setOptionGroups((prev) => prev.map((g, i) => i === gi
                                ? { ...g, choices: g.choices.map((c, j) => j === ci ? { ...c, priceModifier: e.target.value } : c) }
                                : g))}
                              className={`w-20 ${selSm}`} />
                            <button type="button" disabled={group.choices.length <= 1}
                              onClick={() => setOptionGroups((prev) => prev.map((g, i) => i === gi
                                ? { ...g, choices: g.choices.filter((_, j) => j !== ci) }
                                : g))}
                              className="p-1.5 text-red-400 hover:text-red-500 disabled:opacity-30">
                              <Cross1Icon className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button"
                        onClick={() => setOptionGroups((prev) => prev.map((g, i) => i === gi ? { ...g, choices: [...g.choices, { label: '', priceModifier: '0' }] } : g))}
                        className="text-xs font-medium text-brand-blue hover:underline ml-2">
                        + Add Choice
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Always-visible actions */}
        <div className="border-t border-brand-border pt-5 flex items-center gap-3">
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {product ? 'Update Product' : 'Create Product'}
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  )
}
