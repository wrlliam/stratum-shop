'use client'

import { useState } from 'react'
import { TrashIcon } from '@radix-ui/react-icons'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export function DeleteBundleButton({ bundleId }: { bundleId: string }) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }

    try {
      const res = await fetch(`/api/bundles/${bundleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Bundle deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <button
      onClick={handleDelete}
      className={`p-1.5 rounded-sm transition-colors ${
        confirming
          ? 'text-red-600 bg-red-50'
          : 'text-brand-muted hover:text-red-600 hover:bg-red-50'
      }`}
      title={confirming ? 'Click again to confirm' : 'Delete'}
    >
      <TrashIcon className="w-3.5 h-3.5" />
    </button>
  )
}
