'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { StatusBadge } from '@/components/ui/Badge'

const STATUS_OPTIONS = ['pending', 'reviewing', 'accepted', 'declined']

interface Props {
  recId: string
  currentStatus: string
}

export function RecommendationStatusSelect({ recId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [open, setOpen] = useState(false)
  const router = useRouter()

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
        <span className="text-[10px] text-brand-muted">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-brand-border rounded-xl shadow-card-lg overflow-hidden z-20 animate-fade-in">
          {STATUS_OPTIONS.map((s) => (
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
