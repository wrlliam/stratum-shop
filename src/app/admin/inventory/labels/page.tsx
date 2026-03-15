'use client'

import { useState, useEffect } from 'react'
import { QRCodeDisplay } from '@/components/admin/QRCodeDisplay'
import Link from 'next/link'
import { ArrowLeftIcon } from '@radix-ui/react-icons'

interface ProductItem {
  id: string
  name: string
  price: number
}

export default function LabelsPage() {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const [products, setProducts] = useState<ProductItem[]>([])
  // Map of product id → quantity (0 = not selected)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [labelStyle, setLabelStyle] = useState<'qr' | 'barcode' | 'both'>('qr')

  useEffect(() => {
    fetch('/api/products?admin=true&limit=100')
      .then((res) => res.json())
      .then((data) => {
        const items = (data.products || []).map((p: ProductItem) => ({
          id: p.id,
          name: p.name,
          price: p.price,
        }))
        setProducts(items)
        // Initialise all quantities to 0
        const init: Record<string, number> = {}
        for (const p of items) init[p.id] = 0
        setQuantities(init)
      })
      .finally(() => setLoading(false))
  }, [])

  const setQty = (id: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, value) }))
  }

  const toggleProduct = (id: string) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: prev[id] > 0 ? 0 : 1,
    }))
  }

  const selectAll = () => {
    const anySelected = Object.values(quantities).some((q) => q > 0)
    const next: Record<string, number> = {}
    for (const p of products) next[p.id] = anySelected ? 0 : 1
    setQuantities(next)
  }

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length
  const totalLabels = Object.values(quantities).reduce((sum, q) => sum + q, 0)

  // Expand: repeat each product label by its quantity
  const labelList = products.flatMap((p) =>
    Array.from({ length: quantities[p.id] ?? 0 }, (_, i) => ({ ...p, key: `${p.id}-${i}` }))
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header + controls — hidden during print */}
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/inventory"
            className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Print Labels</h1>
          <div className="flex items-center gap-1 ml-4 bg-brand-arctic border border-brand-border rounded-sm p-1">
            {(['qr', 'barcode', 'both'] as const).map((style) => (
              <button
                key={style}
                onClick={() => setLabelStyle(style)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                  labelStyle === style
                    ? 'bg-brand-surface text-brand-text shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {style === 'both' ? 'QR + Barcode' : style.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            disabled={totalLabels === 0}
            className="ml-auto px-4 py-2 text-sm font-medium bg-brand-blue text-white rounded-sm hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
          >
            Print {totalLabels > 0 ? `(${totalLabels} label${totalLabels !== 1 ? 's' : ''})` : ''}
          </button>
        </div>

        {/* Product selector with quantity inputs */}
        <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand-text">Select Products &amp; Quantities</h2>
            <button
              onClick={selectAll}
              className="text-xs font-medium text-brand-blue hover:underline"
            >
              {selectedCount > 0 ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2">
            {products.map((product) => {
              const qty = quantities[product.id] ?? 0
              const isSelected = qty > 0
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-sm border transition-colors ${
                    isSelected
                      ? 'border-brand-blue bg-brand-blue/5'
                      : 'border-brand-border hover:bg-brand-arctic'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleProduct(product.id)}
                    className="rounded border-brand-border text-brand-blue focus:ring-brand-blue shrink-0"
                  />
                  <span className="text-sm font-medium text-brand-text flex-1 truncate">
                    {product.name}
                  </span>
                  {isSelected && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-brand-muted">Qty:</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={qty}
                        onChange={(e) => setQty(product.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-sm border border-brand-border rounded-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {totalLabels > 0 && (
            <p className="text-xs text-brand-muted mt-3">
              {totalLabels} label{totalLabels !== 1 ? 's' : ''} will be printed
            </p>
          )}
        </div>
      </div>

      {/* Printable label area — visibility-isolated so ONLY this prints */}
      {labelList.length > 0 && (
        <div className="label-print-area grid grid-cols-3 gap-4 print:gap-3">
          {labelList.map((item) => (
            <div
              key={item.key}
              className="border border-brand-border print:border-gray-400 rounded-sm p-4 text-center space-y-2 break-inside-avoid"
            >
              <QRCodeDisplay
                value={`${appUrl}/admin/inventory/scan?product=${item.id}`}
                size={120}
                showBarcode={labelStyle === 'barcode' || labelStyle === 'both'}
              />
              <p className="text-sm font-bold text-brand-text print:text-black">{item.name}</p>
              <p className="text-xs text-brand-muted print:text-gray-500 font-mono">{item.id.slice(0, 8)}</p>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media print {
          /* Hide everything */
          body * {
            visibility: hidden;
          }
          /* Show only the label area */
          .label-print-area,
          .label-print-area * {
            visibility: visible;
          }
          .label-print-area {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 16px;
            background: white;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}
