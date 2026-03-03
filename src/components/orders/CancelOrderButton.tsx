'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface Props {
  orderId: string
  orderNumber: string
}

export function CancelOrderButton({ orderId, orderNumber }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    if (!confirm(`Are you sure you want to cancel order #${orderNumber}? You will receive a full refund.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order')
      }

      toast.success('Order cancelled. A refund has been initiated.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="danger" size="sm" onClick={handleCancel} loading={loading}>
      Cancel Order
    </Button>
  )
}
