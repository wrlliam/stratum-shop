'use client'

import { useState } from 'react'

export interface CustomOrderField {
  type: 'text' | 'textarea' | 'image' | 'select' | 'number'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[] // for select type
}

interface CustomOrderFormProps {
  fields: CustomOrderField[]
  onChange: (values: Record<string, string>) => void
}

export function CustomOrderForm({ fields, onChange }: CustomOrderFormProps) {
  const [values, setValues] = useState<Record<string, string>>({})

  const set = (label: string, value: string) => {
    const next = { ...values, [label]: value }
    setValues(next)
    onChange(next)
  }

  if (!fields || fields.length === 0) return null

  return (
    <div className="space-y-4 border border-brand-border rounded-sm p-4 bg-brand-arctic">
      <p className="text-xs font-semibold text-brand-text uppercase tracking-wider">
        Custom Order Details
      </p>
      {fields.map((field) => (
        <div key={field.label}>
          <label className="block text-sm font-medium text-brand-text mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {field.type === 'textarea' && (
            <textarea
              placeholder={field.placeholder}
              value={values[field.label] ?? ''}
              onChange={(e) => set(field.label, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none"
            />
          )}

          {(field.type === 'text' || field.type === 'number') && (
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.label] ?? ''}
              onChange={(e) => set(field.label, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            />
          )}

          {field.type === 'select' && field.options && (
            <select
              value={values[field.label] ?? ''}
              onChange={(e) => set(field.label, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-border rounded-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            >
              <option value="">Select an option...</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {field.type === 'image' && (
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Paste image URL or upload to an image host..."
                value={values[field.label] ?? ''}
                onChange={(e) => set(field.label, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-sm bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              />
              {values[field.label] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values[field.label]}
                  alt="Preview"
                  className="h-24 w-24 object-cover rounded-sm border border-brand-border"
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
