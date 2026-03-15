'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { StatusBadge } from '@/components/ui/Badge'

const STATUS_OPTIONS = [
  'pending',
  'reviewing',
  'quoted',
  'awaiting_payment',
  'paid',
  'printing',
  'completed',
  'declined',
]

// Valid transitions — prevents moving backwards in the flow
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['reviewing', 'declined'],
  reviewing: ['pending', 'declined'], // quote is done via the quote panel, not status select
  quoted: ['declined'], // awaiting_payment set by system
  awaiting_payment: ['declined'],
  paid: ['printing'],
  printing: ['completed'],
  completed: [],
  declined: ['pending'], // allow re-opening
}

interface Props {
  recId: string
  currentStatus: string
}

export function RecommendationStatusSelect({ recId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const allowedStatuses = VALID_TRANSITIONS[status] || []

  const handleChange = async (newStatus: string) => {
    if (newStatus === status) {
      setOpen(false)
      return
    }

    try {
      const res = await fetch('/api/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recId, status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setStatus(newStatus)
      router.refresh()
    } catch {
      toast.error('Failed to update')
    } finally {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1">
        <StatusBadge status={status} />
        {allowedStatuses.length > 0 && (
          <span className="text-[10px] text-brand-muted">▾</span>
        )}
      </button>

      {open && allowedStatuses.length > 0 && (
        <div className="absolute right-0 mt-1 w-40 bg-brand-surface border border-brand-border rounded-sm shadow-card-lg overflow-hidden z-20 animate-fade-in">
          {allowedStatuses.map((s) => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-brand-arctic"
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
