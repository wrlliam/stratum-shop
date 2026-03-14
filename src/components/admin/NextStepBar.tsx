'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

interface Props {
  orderId: string
  currentStatus: string
  hasTrackingNumber: boolean
}

const STATUS_CONFIG: Record<string, {
  message: string
  actions: { label: string; status: string; variant?: 'primary' | 'secondary' }[]
  color: string
  showTracking?: boolean
}> = {
  paid: {
    message: 'Order is paid and ready to process',
    actions: [
      { label: 'Mark as Processing', status: 'processing', variant: 'primary' },
    ],
    color: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/50',
  },
  processing: {
    message: 'Order is being processed',
    actions: [
      { label: 'Mark as Preparing', status: 'preparing', variant: 'primary' },
    ],
    color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700/50',
  },
  preparing: {
    message: 'Items are being prepared',
    actions: [
      { label: 'Mark as Prepared', status: 'prepared', variant: 'primary' },
    ],
    color: 'border-purple-300 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-700/50',
  },
  prepared: {
    message: 'Ready to ship',
    actions: [
      { label: 'Ship Order', status: 'shipped', variant: 'primary' },
    ],
    color: 'border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700/50',
    showTracking: true,
  },
  shipped: {
    message: 'Order has been shipped',
    actions: [
      { label: 'Mark as Delivered', status: 'delivered', variant: 'primary' },
    ],
    color: 'border-sky-300 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-700/50',
  },
  delivered: {
    message: 'Order complete',
    actions: [],
    color: 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700/50',
  },
  cancelled: {
    message: 'Order cancelled',
    actions: [],
    color: 'border-gray-300 bg-gray-50 dark:bg-gray-800/30 dark:border-gray-700/50',
  },
  refunded: {
    message: 'Order refunded',
    actions: [],
    color: 'border-gray-300 bg-gray-50 dark:bg-gray-800/30 dark:border-gray-700/50',
  },
}

export function NextStepBar({ orderId, currentStatus, hasTrackingNumber }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState('')

  const config = STATUS_CONFIG[currentStatus]
  if (!config) return null

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus)
    try {
      // If shipping with a tracking number, save tracking first
      if (newStatus === 'shipped' && trackingInput.trim() && !hasTrackingNumber) {
        await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingNumber: trackingInput.trim() }),
        })
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`Status updated to "${newStatus}"`)
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  const isComplete = currentStatus === 'delivered'
  const isTerminal = currentStatus === 'cancelled' || currentStatus === 'refunded'

  return (
    <div className={`border rounded-xl px-5 py-3 flex items-center gap-4 flex-wrap mb-6 ${config.color}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isComplete && (
          <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className={`text-sm font-medium ${isTerminal ? 'text-gray-500 dark:text-gray-400' : isComplete ? 'text-green-700 dark:text-green-400' : 'text-brand-text'}`}>
          {config.message}
        </span>
      </div>

      {config.showTracking && !hasTrackingNumber && (
        <input
          type="text"
          placeholder="Tracking number (optional)"
          value={trackingInput}
          onChange={(e) => setTrackingInput(e.target.value)}
          className="px-3 py-1.5 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/30 w-52"
        />
      )}

      {config.actions.map((action) => (
        <Button
          key={action.status}
          variant={action.variant || 'primary'}
          size="sm"
          loading={loading === action.status}
          onClick={() => updateStatus(action.status)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
