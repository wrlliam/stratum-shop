'use client'

import { useState } from 'react'
import { EyeOpenIcon, EyeNoneIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  productId: string
  active: boolean
}

export function ToggleProductButton({ productId, active }: Props) {
  const [isActive, setIsActive] = useState(active)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isActive }),
      })
      if (!res.ok) throw new Error()
      setIsActive((a) => !a)
      router.refresh()
    } catch {
      toast.error('Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive
          ? 'text-green-600 hover:text-brand-muted hover:bg-brand-arctic'
          : 'text-brand-muted hover:text-green-600 hover:bg-green-50'
      }`}
      title={isActive ? 'Hide product' : 'Show product'}
    >
      {isActive ? <EyeOpenIcon className="w-3.5 h-3.5" /> : <EyeNoneIcon className="w-3.5 h-3.5" />}
    </button>
  )
}
