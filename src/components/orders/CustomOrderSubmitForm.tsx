'use client'

import { useState } from 'react'
import { UploadIcon, Cross1Icon, CheckCircledIcon } from '@radix-ui/react-icons'
import toast from 'react-hot-toast'

interface CustomField {
  type: 'text' | 'image' | 'number' | 'select'
  label: string
  required?: boolean
  placeholder?: string
  options?: string[]
}

interface Props {
  orderId: string
  itemId: string
  itemName: string
  fields: CustomField[]
  existingSubmission?: Record<string, string> | null
}

export function CustomOrderSubmitForm({ orderId, itemId, itemName, fields, existingSubmission }: Props) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(existingSubmission ?? {})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(!!existingSubmission)

  const setValue = (label: string, val: string) =>
    setValues((prev) => ({ ...prev, [label]: val }))

  const handleImageUpload = async (label: string, file: File) => {
    setUploading((prev) => ({ ...prev, [label]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/customer', { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      const data = await res.json()
      setValue(label, data.url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading((prev) => ({ ...prev, [label]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validate required fields
    for (const field of fields) {
      if (field.required && !values[field.label]?.trim()) {
        toast.error(`"${field.label}" is required`)
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/customize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: values }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save')
      toast.success('Customisation submitted!')
      setSubmitted(true)
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors ${
          submitted
            ? 'bg-green-50 text-green-700 hover:bg-green-100'
            : 'bg-brand-blue text-white hover:bg-brand-blue/90'
        }`}
      >
        {submitted ? (
          <><CheckCircledIcon className="w-3.5 h-3.5" /> Customisation submitted — edit</>
        ) : (
          <>Submit your customisation →</>
        )}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 border border-brand-border rounded-sm p-4 bg-brand-arctic space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-text">Customise: {itemName}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-brand-muted hover:text-brand-text">
          <Cross1Icon className="w-4 h-4" />
        </button>
      </div>

      {fields.map((field) => (
        <div key={field.label}>
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              placeholder={field.placeholder || ''}
              value={values[field.label] || ''}
              onChange={(e) => setValue(field.label, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-sm bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              placeholder={field.placeholder || ''}
              value={values[field.label] || ''}
              onChange={(e) => setValue(field.label, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-sm bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          )}

          {field.type === 'select' && (
            <select
              value={values[field.label] || ''}
              onChange={(e) => setValue(field.label, e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-sm px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            >
              <option value="">— Select —</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {field.type === 'image' && (
            <div>
              {values[field.label] ? (
                <div className="flex flex-col gap-2">
                  <div className="w-full rounded-sm overflow-hidden border border-brand-border bg-brand-surface">
                    <img src={values[field.label]} alt={field.label} className="w-full h-auto object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue(field.label, '')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-sm text-sm cursor-pointer transition-colors ${
                  uploading[field.label]
                    ? 'border-brand-blue/30 text-brand-blue'
                    : 'border-brand-border text-brand-muted hover:border-brand-slate hover:text-brand-text'
                }`}>
                  {uploading[field.label] ? (
                    <div className="animate-spin w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full" />
                  ) : (
                    <><UploadIcon className="w-4 h-4" />Upload image</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(field.label, file)
                    }}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || Object.values(uploading).some(Boolean)}
          className="flex-1 py-2 text-sm font-semibold bg-brand-blue text-white rounded-sm hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Submit customisation'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-brand-muted hover:text-brand-text border border-brand-border rounded-sm hover:border-brand-slate transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
