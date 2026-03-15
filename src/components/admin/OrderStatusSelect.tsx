'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { StatusBadge } from '@/components/ui/Badge'

const STATUS_OPTIONS = [
  'pending',
  'paid',
  'processing',
  'preparing',
  'prepared',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

interface Props {
  orderId: string
  currentStatus: string
}

export function OrderStatusSelect({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const updatePosition = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 4, left: rect.left })
    }
  }, [])

  useEffect(() => {
    if (!open) return

    updatePosition()

    const handleClickOutside = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  const handleChange = async (newStatus: string) => {
    if (newStatus === status) {
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setStatus(newStatus)
      toast.success(`Status updated to ${newStatus}`)
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1"
      >
        <StatusBadge status={status} />
        <span className="text-[10px] text-brand-muted">▾</span>
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="fixed w-36 bg-brand-surface border border-brand-border rounded-sm shadow-card-lg overflow-hidden z-50 animate-fade-in"
          style={{ top: pos.top, left: pos.left }}
        >
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleChange(s)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-brand-arctic ${
                s === status ? 'bg-brand-arctic' : ''
              }`}
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
