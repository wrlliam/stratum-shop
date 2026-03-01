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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products?admin=true&limit=100')
      .then((res) => res.json())
      .then((data) => {
        setProducts(
          (data.products || []).map((p: ProductItem) => ({
            id: p.id,
            name: p.name,
            price: p.price,
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === products.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(products.map((p) => p.id)))
    }
  }

  const selectedProducts = products.filter((p) => selected.has(p.id))

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header - hidden in print */}
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/inventory"
            className="p-2 rounded-xl text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-brand-text">Print QR Labels</h1>
          <button
            onClick={() => window.print()}
            disabled={selected.size === 0}
            className="ml-auto px-4 py-2 text-sm font-medium bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
          >
            Print ({selected.size})
          </button>
        </div>

        {/* Product selector */}
        <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand-text">Select Products</h2>
            <button
              onClick={selectAll}
              className="text-xs font-medium text-brand-blue hover:underline"
            >
              {selected.size === products.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {products.map((product) => (
              <label
                key={product.id}
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selected.has(product.id)
                    ? 'border-brand-blue bg-brand-blue/5'
                    : 'border-brand-border hover:bg-brand-arctic'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="rounded border-brand-border text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-sm font-medium text-brand-text truncate">
                  {product.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Printable label grid */}
      {selectedProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="border border-brand-border print:border-gray-300 rounded-xl p-4 text-center space-y-2 break-inside-avoid"
            >
              <QRCodeDisplay
                value={`${appUrl}/admin/inventory/scan?product=${product.id}`}
                size={120}
              />
              <p className="text-sm font-bold text-brand-text">{product.name}</p>
              <p className="text-xs text-brand-muted font-mono">{product.id.slice(0, 8)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, aside, header, .print\\:hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
