'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { BatchForm } from '@/components/admin/BatchForm'
import { QRCodeDisplay } from '@/components/admin/QRCodeDisplay'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface BatchItem {
  id: string
  quantity: number
  status: string
  notes: string | null
  createdAt: string
  product: { id: string; name: string }
}

interface ProductItem {
  id: string
  name: string
}

export default function BatchesPage() {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const [batches, setBatches] = useState<BatchItem[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [batchRes, productRes] = await Promise.all([
        fetch('/api/inventory/batches'),
        fetch('/api/products?admin=true&limit=100'),
      ])
      const batchData = await batchRes.json()
      const productData = await productRes.json()
      setBatches(batchData.batches || [])
      setProducts(
        (productData.products || []).map((p: ProductItem) => ({ id: p.id, name: p.name }))
      )
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const completeBatch = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/batches/${id}`, { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
      toast.success('Batch completed!')
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete batch')
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/inventory"
          className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Print Batches</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">New Batch</h2>
          <BatchForm products={products} onCreated={fetchData} />
        </div>

        {/* Batch list */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-sm shadow-card">
          <div className="p-4 border-b border-brand-border">
            <h2 className="text-sm font-bold text-brand-text">All Batches</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Qty</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">QR</th>
                  <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                      No batches yet
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className="border-b border-brand-border last:border-0">
                      <td className="px-4 py-3 font-medium text-brand-text">{batch.product.name}</td>
                      <td className="px-4 py-3 font-bold text-brand-text">{batch.quantity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            batch.status === 'completed'
                              ? 'text-green-600 bg-green-50'
                              : 'text-amber-600 bg-amber-50'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <QRCodeDisplay
                          value={`${appUrl}/admin/inventory/scan?batch=${batch.id}`}
                          size={40}
                        />
                      </td>
                      <td className="px-4 py-3">
                        {batch.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => completeBatch(batch.id)}
                          >
                            Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
