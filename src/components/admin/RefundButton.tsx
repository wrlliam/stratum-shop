'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface RefundButtonProps {
  orderId: string
  orderStatus: string
}

export function RefundButton({ orderId, orderStatus }: RefundButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const canRefund = ['paid', 'processing', 'shipped'].includes(orderStatus)
  if (!canRefund) return null

  const handleRefund = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Refund failed')
      }

      toast.success('Refund issued successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refund failed')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-sm">
        <p className="text-xs text-red-700 flex-1">
          This will issue a full refund via Stripe and restore stock. Continue?
        </p>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={handleRefund} loading={loading}>
          Confirm Refund
        </Button>
      </div>
    )
  }

  return (
    <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
      Issue Refund
    </Button>
  )
}
