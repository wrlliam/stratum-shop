'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

interface TrackingFormProps {
  orderId: string
  initialTrackingNumber: string | null
}

export function TrackingForm({ orderId, initialTrackingNumber }: TrackingFormProps) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: trackingNumber || null,
          ...(trackingNumber && !initialTrackingNumber ? { status: 'shipped' } : {}),
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      toast.success(trackingNumber ? 'Tracking number saved' : 'Tracking number removed')
    } catch {
      toast.error('Failed to save tracking number')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Input
          label="Tracking Number"
          placeholder="e.g. RM123456789GB"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
        />
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={handleSave}
        loading={saving}
        className="mb-0.5"
      >
        Save
      </Button>
    </div>
  )
}
