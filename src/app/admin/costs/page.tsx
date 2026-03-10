'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CostData {
  totalMinutes: number
  totalCostsPence: number
  labourCostPence: number
  hourlyRatePence: number
  timeEntries: Array<{ id: string; description: string; minutes: number; createdAt: string }>
  costEntries: Array<{ id: string; type: string; description: string; amountPence: number; createdAt: string }>
}

const COST_TYPES = ['electricity', 'filament', 'shipping', 'other'] as const

export default function CostsPage() {
  const [data, setData] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [saving, setSaving] = useState(false)

  const [timeForm, setTimeForm] = useState({ description: '', minutes: '' })
  const [costForm, setCostForm] = useState({ costType: 'filament', description: '', amountPounds: '' })

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/costs?month=${month}`)
      const d = await res.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => { fetch_() }, [fetch_])

  const submitTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeForm.description.trim() || !timeForm.minutes) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'time', description: timeForm.description, minutes: Number(timeForm.minutes) }),
      })
      if (!res.ok) throw new Error()
      toast.success('Time entry added')
      setTimeForm({ description: '', minutes: '' })
      fetch_()
    } catch {
      toast.error('Failed to add time entry')
    } finally {
      setSaving(false)
    }
  }

  const submitCost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!costForm.description.trim() || !costForm.amountPounds) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cost',
          costType: costForm.costType,
          description: costForm.description,
          amountPence: Math.round(Number(costForm.amountPounds) * 100),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Cost entry added')
      setCostForm({ costType: 'filament', description: '', amountPounds: '' })
      fetch_()
    } catch {
      toast.error('Failed to add cost entry')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-brand-text">Cost Tracking</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">Time Logged</p>
            <p className="text-2xl font-bold text-brand-text">{Math.floor(data.totalMinutes / 60)}h {data.totalMinutes % 60}m</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">Labour Cost</p>
            <p className="text-2xl font-bold text-brand-text">{formatPrice(data.labourCostPence)}</p>
            <p className="text-xs text-brand-muted">@ {formatPrice(data.hourlyRatePence)}/hr</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">Material Costs</p>
            <p className="text-2xl font-bold text-brand-text">{formatPrice(data.totalCostsPence)}</p>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-red-600">{formatPrice(data.labourCostPence + data.totalCostsPence)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Log Time */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">Log Time</h2>
          <form onSubmit={submitTime} className="space-y-3">
            <input
              placeholder="Description (e.g. Print run for order #123)"
              value={timeForm.description}
              onChange={(e) => setTimeForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Minutes"
                value={timeForm.minutes}
                onChange={(e) => setTimeForm((p) => ({ ...p, minutes: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 disabled:opacity-50">
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Log Cost */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">Log Cost</h2>
          <form onSubmit={submitCost} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={costForm.costType}
                onChange={(e) => setCostForm((p) => ({ ...p, costType: e.target.value }))}
                className="px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none bg-brand-surface capitalize"
              >
                {COST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount (£)"
                value={costForm.amountPounds}
                onChange={(e) => setCostForm((p) => ({ ...p, amountPounds: e.target.value }))}
                className="px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Description"
                value={costForm.description}
                onChange={(e) => setCostForm((p) => ({ ...p, description: e.target.value }))}
                className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              />
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 disabled:opacity-50">
                Add
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent entries */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card">
            <div className="p-4 border-b border-brand-border">
              <h2 className="text-sm font-bold text-brand-text">Time Entries</h2>
            </div>
            {data.timeEntries.length === 0 ? (
              <p className="p-4 text-sm text-brand-muted">No time entries</p>
            ) : (
              <div className="divide-y divide-brand-border">
                {data.timeEntries.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-text">{t.description}</p>
                      <p className="text-xs text-brand-muted">{new Date(t.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <span className="text-sm font-medium text-brand-text">{Math.floor(t.minutes / 60)}h {t.minutes % 60}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card">
            <div className="p-4 border-b border-brand-border">
              <h2 className="text-sm font-bold text-brand-text">Cost Entries</h2>
            </div>
            {data.costEntries.length === 0 ? (
              <p className="p-4 text-sm text-brand-muted">No cost entries</p>
            ) : (
              <div className="divide-y divide-brand-border">
                {data.costEntries.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-brand-text">{c.description}</p>
                      <p className="text-xs text-brand-muted capitalize">{c.type} · {new Date(c.createdAt).toLocaleDateString('en-GB')}</p>
                    </div>
                    <span className="text-sm font-medium text-brand-text">{formatPrice(c.amountPence)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
