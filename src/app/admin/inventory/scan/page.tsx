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

interface OrderData {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  user?: { name: string; email: string } | null
}

export default function ScanPage() {
  const searchParams = useSearchParams()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [completingBatch, setCompletingBatch] = useState(false)
  const [markingPrepared, setMarkingPrepared] = useState(false)
  const textInputRef = useRef<HTMLInputElement>(null)

  // Handle initial URL params
  useEffect(() => {
    const productId = searchParams.get('product')
    const batchId = searchParams.get('batch')
    const orderId = searchParams.get('order')
    if (productId) loadProduct(productId)
    if (batchId) loadBatch(batchId)
    if (orderId) loadOrder(orderId)
  }, [searchParams])

  const loadOrder = async (id: string) => {
    setLoading(true)
    setProduct(null)
    setBatch(null)
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) throw new Error('Order not found')
      const data = await res.json()
      setOrder(data)
    } catch {
      toast.error('Order not found')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const SCAN_PROGRESSION: Record<string, string> = {
    paid: 'preparing',
    processing: 'preparing',
    preparing: 'prepared',
    prepared: 'shipped',
  }

  const SCAN_BUTTON_LABELS: Record<string, string> = {
    paid: 'Start Preparing',
    processing: 'Start Preparing',
    preparing: 'Mark as Prepared',
    prepared: 'Mark as Shipped',
  }

  const advanceOrderStatus = async () => {
    if (!order) return
    const nextStatus = SCAN_PROGRESSION[order.status]
    if (!nextStatus) return
    setMarkingPrepared(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Order updated to ${nextStatus}`)
      setOrder({ ...order, status: nextStatus })
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setMarkingPrepared(false)
    }
  }

  const loadProduct = async (id: string) => {
    setLoading(true)
    setBatch(null)
    setOrder(null)
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
    setOrder(null)
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

  const parseScanInput = async (text: string) => {
    try {
      const url = new URL(text)
      const productId = url.searchParams.get('product')
      const batchId = url.searchParams.get('batch')
      const orderId = url.searchParams.get('order')
      if (productId) { loadProduct(productId); return }
      if (batchId) { loadBatch(batchId); return }
      if (orderId) { loadOrder(orderId); return }
    } catch {
      // Not a URL - try as raw UUID: attempt order lookup first, then product
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(text.trim())) {
        const id = text.trim()
        // Try order first (order labels are more commonly scanned in inventory context)
        setLoading(true)
        const orderRes = await fetch(`/api/orders/${id}`)
        if (orderRes.ok) {
          const data = await orderRes.json()
          setOrder(data)
          setProduct(null)
          setBatch(null)
          setLoading(false)
          return
        }
        // Fall back to product
        setLoading(false)
        loadProduct(id)
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
    <div className="p-8">
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
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">Camera Scanner</h2>
          <QRScanner onScan={handleScan} />
        </div>

        {/* Text input (USB scanner / paste) */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card">
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
            className="w-full px-3 py-2.5 text-sm border border-brand-border rounded-lg bg-brand-surface focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            autoFocus
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card text-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-brand-muted mt-2">Loading...</p>
        </div>
      )}

      {/* Product result */}
      {product && !loading && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4">Product Found</h2>
          <StockAdjustForm
            productId={product.id}
            productName={product.name}
            currentStock={product.stock}
            onAdjusted={(newStock) => setProduct({ ...product, stock: newStock })}
          />
        </div>
      )}

      {/* Order result */}
      {order && !loading && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-text">Order Found</h2>
            <Link
              href={`/admin/orders/${order.id}`}
              className="text-xs text-brand-blue hover:underline font-medium"
            >
              View Details
            </Link>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="text-brand-muted">Order ID:</span> <span className="font-mono text-xs">{order.id}</span></p>
            {order.user && (
              <p><span className="text-brand-muted">Customer:</span> <span className="font-medium text-brand-text">{order.user.name} ({order.user.email})</span></p>
            )}
            <p><span className="text-brand-muted">Status:</span>{' '}
              <span className={`font-medium capitalize ${
                order.status === 'preparing' ? 'text-amber-600' :
                order.status === 'prepared' ? 'text-purple-600' :
                order.status === 'shipped' || order.status === 'delivered' ? 'text-green-600' :
                'text-brand-text'
              }`}>
                {order.status}
              </span>
            </p>
          </div>
          {SCAN_PROGRESSION[order.status] ? (
            <Button
              variant="primary"
              size="sm"
              loading={markingPrepared}
              onClick={advanceOrderStatus}
            >
              {SCAN_BUTTON_LABELS[order.status]}
            </Button>
          ) : (
            <p className="text-sm text-brand-muted">
              {['shipped', 'delivered'].includes(order.status)
                ? 'Order has already been shipped.'
                : ['cancelled', 'refunded'].includes(order.status)
                  ? 'No further action available for this order.'
                  : 'Order is pending payment.'}
            </p>
          )}
        </div>
      )}

      {/* Batch result */}
      {batch && !loading && (
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card space-y-3">
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
