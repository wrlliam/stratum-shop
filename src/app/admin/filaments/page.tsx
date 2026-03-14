'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConfirm } from '@/components/providers/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  CopyIcon,
  BookmarkIcon,
  BookmarkFilledIcon,
  PlusIcon,
  Cross2Icon,
  DownloadIcon,
} from '@radix-ui/react-icons'
import type { Filament } from '@/lib/db/schema'

const MATERIALS = ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'Resin', 'Nylon', 'Carbon Fibre', 'Other']

const EMPTY: Partial<Filament> & { pricePerKgPounds: string; weightGrams: string } = {
  brand: '',
  material: 'PLA',
  color: '',
  colorHex: '#ffffff',
  pricePerKgPounds: '17.99',
  weightGrams: '1000',
  notes: '',
  active: true,
}

interface FilamentTemplate {
  id: string
  name: string
  brand: string
  material: string
  pricePerKgPounds: string
  weightGrams: string
  notes: string
}

const TEMPLATES_KEY = 'stratum_filament_templates'

function loadTemplates(): FilamentTemplate[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveTemplates(templates: FilamentTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export default function FilamentsPage() {
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<FilamentTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [quickMode, setQuickMode] = useState(false)
  const [quickColors, setQuickColors] = useState<{ color: string; colorHex: string }[]>([{ color: '', colorHex: '#ffffff' }])
  const [quickSaving, setQuickSaving] = useState(false)
  const confirm = useConfirm()

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/filaments')
    if (res.ok) setFilaments(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    setTemplates(loadTemplates())
  }, [load])

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }))

  const openNew = () => {
    setForm(EMPTY)
    setEditId(null)
    setQuickMode(false)
    setShowForm(true)
  }

  const openEdit = (f: Filament) => {
    setForm({
      ...f,
      pricePerKgPounds: String(f.pricePerKgPence / 100),
      weightGrams: String(f.weightRemainingGrams),
    })
    setEditId(f.id)
    setQuickMode(false)
    setShowForm(true)
  }

  const duplicateFilament = (f: Filament) => {
    setForm({
      ...f,
      pricePerKgPounds: String(f.pricePerKgPence / 100),
      weightGrams: String(f.weightRemainingGrams),
      color: '',
      colorHex: '#ffffff',
    })
    setEditId(null)
    setQuickMode(false)
    setShowForm(true)
    toast.success('Duplicated — just change the color')
  }

  const loadTemplate = (t: FilamentTemplate) => {
    setForm({
      ...EMPTY,
      brand: t.brand,
      material: t.material,
      pricePerKgPounds: t.pricePerKgPounds,
      weightGrams: t.weightGrams,
      notes: t.notes,
    })
    setEditId(null)
    setShowForm(true)
    setShowTemplates(false)
    toast.success(`Template "${t.name}" loaded`)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Enter a template name')
      return
    }
    const newTemplate: FilamentTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      brand: form.brand || '',
      material: form.material || 'PLA',
      pricePerKgPounds: form.pricePerKgPounds || '17.99',
      weightGrams: form.weightGrams || '1000',
      notes: form.notes || '',
    }
    const updated = [...templates, newTemplate]
    setTemplates(updated)
    saveTemplates(updated)
    setTemplateName('')
    setShowSaveTemplate(false)
    toast.success(`Template "${newTemplate.name}" saved`)
  }

  const deleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id)
    setTemplates(updated)
    saveTemplates(updated)
    toast.success('Template deleted')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      brand: form.brand || undefined,
      material: form.material,
      color: form.color,
      colorHex: form.colorHex || undefined,
      pricePerKgPence: Math.round(Number(form.pricePerKgPounds) * 100),
      weightRemainingGrams: Number(form.weightGrams),
      notes: form.notes || undefined,
      active: form.active,
    }
    try {
      const res = await fetch(editId ? `/api/admin/filaments/${editId}` : '/api/admin/filaments', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed')
      toast.success(editId ? 'Filament updated' : 'Filament added')
      setShowForm(false)
      load()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const submitQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const validColors = quickColors.filter((c) => c.color.trim())
    if (validColors.length === 0) {
      toast.error('Add at least one color')
      return
    }
    setQuickSaving(true)
    let successCount = 0
    let failCount = 0
    for (const c of validColors) {
      const payload = {
        brand: form.brand || undefined,
        material: form.material,
        color: c.color.trim(),
        colorHex: c.colorHex || undefined,
        pricePerKgPence: Math.round(Number(form.pricePerKgPounds) * 100),
        weightRemainingGrams: Number(form.weightGrams),
        notes: form.notes || undefined,
        active: true,
      }
      try {
        const res = await fetch('/api/admin/filaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }
    setQuickSaving(false)
    if (successCount > 0) toast.success(`${successCount} filament(s) added`)
    if (failCount > 0) toast.error(`${failCount} failed`)
    setShowForm(false)
    setQuickColors([{ color: '', colorHex: '#ffffff' }])
    load()
  }

  const addQuickColor = () => {
    setQuickColors((prev) => [...prev, { color: '', colorHex: '#ffffff' }])
  }

  const removeQuickColor = (index: number) => {
    setQuickColors((prev) => prev.filter((_, i) => i !== index))
  }

  const setQuickColor = (index: number, field: 'color' | 'colorHex', value: string) => {
    setQuickColors((prev) => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const toggleActive = async (f: Filament) => {
    await fetch(`/api/admin/filaments/${f.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !f.active }),
    })
    load()
  }

  const del = async (id: string) => {
    if (!await confirm({ message: 'Delete this filament?', confirmLabel: 'Delete', danger: true })) return
    await fetch(`/api/admin/filaments/${id}`, { method: 'DELETE' })
    toast.success('Deleted')
    load()
  }

  const totalValue = filaments.reduce((sum, f) => sum + (f.weightRemainingGrams / 1000) * f.pricePerKgPence, 0)

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Filament Inventory</h1>
          <p className="text-sm text-brand-muted mt-1">
            {filaments.length} spools · Stock value: {formatPrice(Math.round(totalValue))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
              <DownloadIcon className="w-3.5 h-3.5" />
              Templates ({templates.length})
            </Button>
          )}
          <Button onClick={openNew}>Add Filament</Button>
        </div>
      </div>

      {/* Templates dropdown */}
      {showTemplates && templates.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-card mb-6">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-3">Saved Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-3 rounded-xl border border-brand-border hover:border-brand-blue/40 transition-colors group">
                <button
                  onClick={() => loadTemplate(t)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium text-brand-text truncate">{t.name}</p>
                  <p className="text-xs text-brand-muted truncate">
                    {t.brand ? `${t.brand} ` : ''}{t.material} · £{t.pricePerKgPounds}/kg · {t.weightGrams}g
                  </p>
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="p-1 text-brand-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete template"
                >
                  <Cross2Icon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand-text">
              {editId ? 'Edit' : quickMode ? 'Quick Add Multiple Colors' : 'Add'} Filament
            </h2>
            {!editId && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuickMode(!quickMode)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    quickMode
                      ? 'bg-brand-blue text-white'
                      : 'bg-brand-arctic text-brand-muted hover:text-brand-text'
                  }`}
                >
                  {quickMode ? 'Single Mode' : 'Quick Add (Multi-Color)'}
                </button>
                {!showSaveTemplate ? (
                  <button
                    onClick={() => setShowSaveTemplate(true)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-brand-arctic text-brand-muted hover:text-brand-text transition-colors flex items-center gap-1"
                  >
                    <BookmarkIcon className="w-3.5 h-3.5" />
                    Save Template
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Template name..."
                      className="px-2 py-1 text-xs border border-brand-border rounded-lg bg-brand-surface text-brand-text w-36 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTemplate}
                      className="p-1.5 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 transition-colors"
                    >
                      <BookmarkFilledIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setShowSaveTemplate(false); setTemplateName('') }}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text transition-colors"
                    >
                      <Cross2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shared fields (brand, material, price, weight) */}
          <form onSubmit={quickMode ? submitQuickAdd : submit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Brand" placeholder="Bambu, Polymaker..." value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} />
              <Select
                label="Material"
                value={form.material ?? 'PLA'}
                onChange={(e) => set('material', e.target.value)}
                options={MATERIALS.map((m) => ({ value: m, label: m }))}
              />
              <Input label="Price per kg (£)" type="number" step="0.01" min="0.01" placeholder="17.99"
                value={form.pricePerKgPounds ?? ''} onChange={(e) => set('pricePerKgPounds', e.target.value)} required />
              <Input label="Weight (g)" type="number" min="0" placeholder="1000"
                value={form.weightGrams ?? ''} onChange={(e) => set('weightGrams', e.target.value)} required />
            </div>

            {quickMode ? (
              /* Quick-add: multiple color rows */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-brand-text uppercase tracking-wider">Colors</label>
                  <button
                    type="button"
                    onClick={addQuickColor}
                    className="text-xs text-brand-blue hover:text-brand-blue-dark font-medium flex items-center gap-1 transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Color
                  </button>
                </div>
                <div className="space-y-2">
                  {quickColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={c.colorHex}
                        onChange={(e) => setQuickColor(i, 'colorHex', e.target.value)}
                        className="w-9 h-9 rounded-lg border border-brand-border cursor-pointer p-0.5 shrink-0"
                      />
                      <input
                        placeholder={`Color name ${i + 1}...`}
                        value={c.color}
                        onChange={(e) => setQuickColor(i, 'color', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      />
                      {quickColors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuickColor(i)}
                          className="p-1.5 text-brand-muted hover:text-red-500 transition-colors"
                        >
                          <Cross2Icon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-brand-muted mt-2">
                  {quickColors.filter((c) => c.color.trim()).length} color(s) will be added as {form.brand ? `${form.brand} ` : ''}{form.material} at £{form.pricePerKgPounds}/kg
                </p>
              </div>
            ) : (
              /* Standard single-add fields */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Color Name" placeholder="Silk Gold" value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} required />
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">Color Swatch</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.colorHex ?? '#ffffff'} onChange={(e) => set('colorHex', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer p-0.5" />
                    <span className="text-xs text-brand-muted font-mono">{form.colorHex}</span>
                  </div>
                </div>
                <Input label="Notes" placeholder="Optional notes..." value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button type="submit" loading={quickMode ? quickSaving : saving}>
                {editId ? 'Save' : quickMode ? `Add ${quickColors.filter((c) => c.color.trim()).length} Filament(s)` : 'Add'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" /></div>
      ) : (
        <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-arctic">
                  {['Filament', 'Material', 'Price/kg', 'Remaining', 'Value', 'Status', 'Actions'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filaments.map((f) => (
                  <tr key={f.id} className="hover:bg-brand-arctic transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full border border-brand-border flex-shrink-0" style={{ backgroundColor: f.colorHex ?? '#ccc' }} />
                        <div>
                          <p className="font-medium text-brand-text">{f.color}</p>
                          {f.brand && <p className="text-xs text-brand-muted">{f.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-muted">{f.material}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(f.pricePerKgPence)}/kg</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-brand-arctic rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue rounded-full" style={{ width: `${Math.min(100, (f.weightRemainingGrams / 1000) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-brand-muted">{f.weightRemainingGrams}g</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatPrice(Math.round((f.weightRemainingGrams / 1000) * f.pricePerKgPence))}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(f)}>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${f.active ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
                          {f.active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>Edit</Button>
                        <button
                          onClick={() => duplicateFilament(f)}
                          className="p-1.5 text-brand-muted hover:text-brand-blue transition-colors rounded-lg hover:bg-brand-arctic"
                          title="Duplicate (same brand/material, new color)"
                        >
                          <CopyIcon className="w-3.5 h-3.5" />
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => del(f.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filaments.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-brand-muted">No filaments yet. Add your first spool.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
