'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConfirm } from '@/components/providers/ConfirmProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'
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

export default function FilamentsPage() {
  const [filaments, setFilaments] = useState<Filament[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const confirm = useConfirm()

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/filaments')
    if (res.ok) setFilaments(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }))

  const openNew = () => {
    setForm(EMPTY)
    setEditId(null)
    setShowForm(true)
  }

  const openEdit = (f: Filament) => {
    setForm({
      ...f,
      pricePerKgPounds: String(f.pricePerKgPence / 100),
      weightGrams: String(f.weightRemainingGrams),
    })
    setEditId(f.id)
    setShowForm(true)
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
        <Button onClick={openNew}>Add Filament</Button>
      </div>

      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card mb-6">
          <h2 className="text-sm font-bold text-brand-text mb-4">{editId ? 'Edit' : 'Add'} Filament</h2>
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Input label="Brand" placeholder="Bambu, Polymaker..." value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} />

            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">Material</label>
              <select value={form.material ?? 'PLA'} onChange={(e) => set('material', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue">
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <Input label="Color Name" placeholder="Silk Gold" value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} required />

            <div>
              <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">Color Swatch</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.colorHex ?? '#ffffff'} onChange={(e) => set('colorHex', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-brand-border cursor-pointer p-0.5" />
                <span className="text-xs text-brand-muted font-mono">{form.colorHex}</span>
              </div>
            </div>

            <Input label="Price per kg (£)" type="number" step="0.01" min="0.01" placeholder="17.99"
              value={form.pricePerKgPounds ?? ''} onChange={(e) => set('pricePerKgPounds', e.target.value)} required />

            <Input label="Weight Remaining (g)" type="number" min="0" placeholder="1000"
              value={form.weightGrams ?? ''} onChange={(e) => set('weightGrams', e.target.value)} required />

            <Input label="Notes" placeholder="Optional notes..." value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />

            <div className="flex items-end gap-2 col-span-2 md:col-span-3 lg:col-span-4">
              <Button type="submit" loading={saving}>{editId ? 'Save' : 'Add'}</Button>
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
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${f.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {f.active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => del(f.id)}>Delete</Button>
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
