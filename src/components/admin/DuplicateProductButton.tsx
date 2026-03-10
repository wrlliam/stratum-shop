'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CopyIcon } from '@radix-ui/react-icons'

export function DuplicateProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { id } = await res.json()
      toast.success('Product duplicated!')
      router.push(`/admin/products/${id}`)
    } catch {
      toast.error('Failed to duplicate product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      title="Duplicate"
      className="p-1.5 text-brand-muted hover:text-brand-blue hover:bg-brand-arctic rounded-lg transition-colors disabled:opacity-50"
    >
      {loading
        ? <div className="w-3.5 h-3.5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        : <CopyIcon className="w-3.5 h-3.5" />}
    </button>
  )
}
