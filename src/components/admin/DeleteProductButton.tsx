'use client'

import { useState } from 'react'
import { TrashIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function DeleteProductButton({ productId }: { productId: string }) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Product deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className={`p-1.5 rounded-lg transition-colors ${
        confirming
          ? 'text-red-600 bg-red-50 hover:bg-red-100'
          : 'text-brand-muted hover:text-red-600 hover:bg-red-50'
      }`}
      title={confirming ? 'Click again to confirm' : 'Delete'}
    >
      <TrashIcon className="w-3.5 h-3.5" />
    </button>
  )
}
