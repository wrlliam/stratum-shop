'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/providers/ConfirmProvider'

const RECIPIENT_OPTS = [
  { value: 'all', label: 'All opted-in users' },
  { value: 'with_orders', label: 'Users with at least one order' },
] as const

export default function MassEmailPage() {
  const [form, setForm] = useState({
    subject: '',
    body: '',
    recipientType: 'all' as string,
  })
  const [sending, setSending] = useState(false)
  const confirm = useConfirm()
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Subject and body are required')
      return
    }

    if (!await confirm({ title: 'Send mass email?', message: 'Send this email to all eligible recipients? This action cannot be undone.', confirmLabel: 'Send', danger: true })) return

    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
      toast.success(`Sent to ${data.sent} recipients`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-text">Mass Email</h1>
        <p className="text-sm text-brand-muted mt-1">
          Only sends to users who have opted in to marketing emails.
        </p>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-sm text-green-700">
          Successfully sent to <strong>{result.sent}</strong> recipients.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-brand-text">Recipients</h2>
          <div className="space-y-2">
            {RECIPIENT_OPTS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="recipientType"
                  value={opt.value}
                  checked={form.recipientType === opt.value}
                  onChange={(e) => setForm((p) => ({ ...p, recipientType: e.target.value }))}
                  className="text-brand-blue"
                />
                <span className="text-sm text-brand-text">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card space-y-4">
          <h2 className="text-sm font-bold text-brand-text">Content</h2>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">Subject *</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="New products this week — Stratum"
              className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">Body *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              placeholder="Write your email content here…"
              rows={12}
              className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue resize-none"
              required
            />
            <p className="text-xs text-brand-muted mt-1">Plain text. An unsubscribe link will be automatically added.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 text-sm font-semibold bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
        >
          {sending ? 'Sending…' : 'Send Email Campaign'}
        </button>
      </form>
    </div>
  )
}
