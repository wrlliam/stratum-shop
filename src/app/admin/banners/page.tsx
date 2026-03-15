'use client'

import { useState, useEffect } from 'react'
import { useConfirm } from '@/components/providers/ConfirmProvider'
import { TrashIcon, Pencil1Icon, Cross1Icon, CheckIcon } from '@radix-ui/react-icons'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'
import type { Banner } from '@/lib/db/schema'
import { OptionDropdown } from '@/components/shop/AddToCartButton'

const TYPE_META: Record<string, { label: string; colors: string }> = {
  info:    { label: 'Info',    colors: 'bg-blue-100 text-blue-800 border-blue-200' },
  sale:    { label: 'Sale',    colors: 'bg-amber-100 text-amber-800 border-amber-200' },
  warning: { label: 'Warning', colors: 'bg-orange-100 text-orange-800 border-orange-200' },
  success: { label: 'Success', colors: 'bg-green-100 text-green-800 border-green-200' },
}

const EMPTY_FORM = {
  message: '',
  type: 'info' as Banner['type'],
  link: '',
  linkText: '',
  active: true,
  dismissible: true,
  opacity: 100,
  expiresAt: '',
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const confirm = useConfirm()

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners')
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBanners() }, [])

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id)
    setForm({
      message: banner.message,
      type: banner.type as typeof EMPTY_FORM.type,
      link: banner.link ?? '',
      linkText: banner.linkText ?? '',
      active: banner.active,
      dismissible: banner.dismissible,
      opacity: banner.opacity ?? 100,
      expiresAt: banner.expiresAt
        ? new Date(banner.expiresAt).toISOString().slice(0, 16)
        : '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.message.trim()) { toast.error('Message is required'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        link: form.link || null,
        linkText: form.linkText || null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      }

      const res = await fetch(
        editingId ? `/api/admin/banners/${editingId}` : '/api/admin/banners',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) throw new Error('Failed to save')

      toast.success(editingId ? 'Banner updated' : 'Banner created')
      setShowForm(false)
      setEditingId(null)
      fetchBanners()
    } catch {
      toast.error('Failed to save banner')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !banner.active }),
      })
      if (!res.ok) throw new Error()
      fetchBanners()
    } catch {
      toast.error('Failed to update banner')
    }
  }

  const deleteBanner = async (id: string) => {
    if (!await confirm({ message: 'Delete this banner?', confirmLabel: 'Delete', danger: true })) return
    try {
      await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      toast.success('Banner deleted')
      fetchBanners()
    } catch {
      toast.error('Failed to delete banner')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display text-brand-text">Announcement Banners</h1>
          <p className="text-brand-muted text-sm mt-1">
            Banners appear at the top of every shop page. Only the most recently created active banner is shown.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-semibold bg-brand-blue text-white rounded-sm hover:bg-brand-blue/90 transition-colors"
        >
          + New Banner
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-brand-text">
              {editingId ? 'Edit Banner' : 'New Banner'}
            </h2>
            <button onClick={() => setShowForm(false)} className="p-1 text-brand-muted hover:text-brand-text">
              <Cross1Icon className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">Message *</label>
              <input
                type="text"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="🎉 Summer sale — 20% off everything this weekend!"
                className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Type */}
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                options={Object.entries(TYPE_META).map(([value, { label }]) => ({ value, label }))}
              />

              {/* Link */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Link URL (optional)</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => set('link', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                />
              </div>

              {/* Link text */}
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">Link Text</label>
                <input
                  type="text"
                  value={form.linkText}
                  onChange={(e) => set('linkText', e.target.value)}
                  placeholder="Shop now"
                  className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                />
              </div>
            </div>

            {/* Expires at + Opacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">
                  Expires at (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => set('expiresAt', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">
                  Background Opacity ({form.opacity}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={form.opacity}
                  onChange={(e) => set('opacity', Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              {[
                { key: 'active', label: 'Active' },
                { key: 'dismissible', label: 'Dismissible by users' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => set(key, !form[key as keyof typeof form])}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                      form[key as keyof typeof form]
                        ? 'bg-brand-blue'
                        : 'bg-brand-arctic border border-brand-border'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-brand-surface shadow transition-transform duration-200 ${
                      form[key as keyof typeof form] ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </div>
                  <span className="text-sm font-medium text-brand-text">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-brand-blue text-white rounded-sm hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banner list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-brand-muted text-sm">
          No banners yet. Create one to display an announcement on the shop.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => {
            const meta = TYPE_META[banner.type] ?? TYPE_META.info
            const expired = banner.expiresAt && new Date(banner.expiresAt) < new Date()
            return (
              <div
                key={banner.id}
                className={`bg-brand-surface border rounded-sm p-5 shadow-card flex items-start gap-4 ${
                  !banner.active || expired ? 'opacity-60' : ''
                } border-brand-border`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${meta.colors}`}>
                      {meta.label}
                    </span>
                    {!banner.active && (
                      <span className="text-[10px] font-medium text-brand-muted bg-brand-arctic px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                    {expired && (
                      <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Expired
                      </span>
                    )}
                    {!banner.dismissible && (
                      <span className="text-[10px] font-medium text-brand-muted bg-brand-arctic px-2 py-0.5 rounded-full">
                        Non-dismissible
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brand-text font-medium">{banner.message}</p>
                  {banner.link && (
                    <p className="text-xs text-brand-muted mt-1">
                      Link: <span className="font-mono">{banner.link}</span>
                      {banner.linkText && ` → "${banner.linkText}"`}
                    </p>
                  )}
                  {banner.expiresAt && (
                    <p className="text-xs text-brand-muted mt-0.5">
                      Expires: {new Date(banner.expiresAt).toLocaleString('en-GB')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(banner)}
                    title={banner.active ? 'Deactivate' : 'Activate'}
                    className={`p-2 rounded-sm transition-colors ${
                      banner.active
                        ? 'text-green-600 bg-green-50 hover:bg-green-100'
                        : 'text-brand-muted hover:bg-brand-arctic'
                    }`}
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(banner)}
                    className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-arctic rounded-sm transition-colors"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
