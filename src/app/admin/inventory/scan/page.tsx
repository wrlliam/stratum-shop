'use client'

import { useState, useEffect, useRef } from 'react'
import { QRScanner } from '@/components/admin/QRScanner'
import { StockAdjustForm } from '@/components/admin/StockAdjustForm'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'

interface ProductData {
  id: string
  name: string
  stock: number
}

interface BatchData {
  id: string
  quantity: number
  status: string
  notes?: string | null
  product: { id: string; name: string }
}

export default function ScanPage() {
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [loading, setLoading] = useState(false)
  const [completingBatch, setCompletingBatch] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Handle initial URL params
  useEffect(() => {
    const productId = searchParams.get('product')
    const batchId = searchParams.get('batch')
    if (productId) loadProduct(productId)
    if (batchId) loadBatch(batchId)
  }, [searchParams])

  const loadProduct = async (id: string) => {
    setLoading(true)
    setBatch(null)
    try {
      const res = await fetch(`/api/products/${id}`)
      if (!res.ok) throw new Error('Product not found')
      const data = await res.json()
      setProduct({ id: data.id, name: data.name, stock: data.stock })
    } catch {
      toast.error('Product not found')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const loadBatch = async (id: string) => {
    setLoading(true)
    setProduct(null)
    try {
      const res = await fetch(`/api/inventory/batches/${id}`)
      if (!res.ok) throw new Error('Batch not found')
      const data = await res.json()
      setBatch(data)
    } catch {
      toast.error('Batch not found')
      setBatch(null)
    } finally {
      setLoading(false)
    }
  }

  const completeBatch = async () => {
    if (!batch) return
    setCompletingBatch(true)
    try {
      const res = await fetch(`/api/inventory/batches/${batch.id}`, { method: 'PATCH' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to complete')
      }
      toast.success(`Batch completed! +${batch.quantity} stock added`)
      setBatch({ ...batch, status: 'completed' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete batch')
    } finally {
      setCompletingBatch(false)
    }
  }

  const handleScan = (text: string) => {
    parseScanInput(text)
  }

  const parseScanInput = (text: string) => {
    try {
      const url = new URL(text)
      const productId = url.searchParams.get('product')
      const batchId = url.searchParams.get('batch')
      if (productId) {
        loadProduct(productId)
        return
      }
      if (batchId) {
        loadBatch(batchId)
        return
      }
    } catch {
      // Not a URL - try as raw UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(text.trim())) {
        loadProduct(text.trim())
        return
      }
    }
    toast.error('Unrecognized scan input')
  }

  const handleTextInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = (e.target as HTMLInputElement).value.trim()
      if (value) {
        parseScanInput(value)
        ;(e.target as HTMLInputElement).value = ''
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim()
    if (text) {
      e.preventDefault()
      parseScanInput(text)
      ;(e.target as HTMLInputElement).value = ''
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/inventory"
          className="p-2 rounded-xl text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-brand-text">Scan QR Code</h1>
      </div>

      {/* Scanner modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Camera */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">Camera Scanner</h2>
          <QRScanner onScan={handleScan} />
        </div>

        {/* Text input (USB scanner / paste) */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">USB Scanner / Paste</h2>
          <p className="text-xs text-brand-muted mb-3">
            Focus this field and scan with a USB barcode scanner, or paste a QR URL.
          </p>
          <input
            ref={textInputRef}
            type="text"
            placeholder="Scan or paste URL here..."
            onKeyDown={handleTextInput}
            onPaste={handlePaste}
            className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            autoFocus
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card text-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-brand-muted mt-2">Loading...</p>
        </div>
      )}

      {/* Product result */}
      {product && !loading && (
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">Product Found</h2>
          <StockAdjustForm
            productId={product.id}
            productName={product.name}
            currentStock={product.stock}
            onAdjusted={(newStock) => setProduct({ ...product, stock: newStock })}
          />
        </div>
      )}

      {/* Batch result */}
      {batch && !loading && (
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card space-y-3">
          <h2 className="text-sm font-bold text-brand-text">Batch Found</h2>
          <div className="space-y-1 text-sm">
            <p><span className="text-brand-muted">Product:</span> <span className="font-medium text-brand-text">{batch.product.name}</span></p>
            <p><span className="text-brand-muted">Quantity:</span> <span className="font-bold text-brand-text">{batch.quantity}</span></p>
            <p><span className="text-brand-muted">Status:</span>{' '}
              <span className={`font-medium ${batch.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                {batch.status}
              </span>
            </p>
            {batch.notes && (
              <p><span className="text-brand-muted">Notes:</span> {batch.notes}</p>
            )}
          </div>
          {batch.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              loading={completingBatch}
              onClick={completeBatch}
            >
              Complete Batch (+{batch.quantity} to stock)
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
