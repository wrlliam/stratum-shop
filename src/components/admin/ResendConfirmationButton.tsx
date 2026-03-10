'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { EnvelopeClosedIcon } from '@radix-ui/react-icons'

export function ResendConfirmationButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-confirmation`, { method: 'POST' })
      if (!res.ok) throw new Error()
      toast.success('Confirmation email resent!')
    } catch {
      toast.error('Failed to resend email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-arctic border border-brand-border rounded-xl transition-colors disabled:opacity-50"
    >
      <EnvelopeClosedIcon className="w-4 h-4" />
      {loading ? 'Sending…' : 'Resend email'}
    </button>
  )
}
