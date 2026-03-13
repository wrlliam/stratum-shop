'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { OrderStatusSelect } from './OrderStatusSelect'
import { formatPrice } from '@/lib/utils'
import { formatDeliveryMethod } from '@/lib/delivery'
import { printBulkBarcodes } from './PrintOrderBarcodeButton'

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'preparing', 'prepared', 'shipped', 'delivered', 'cancelled', 'refunded']

interface OrderItem {
  id: string
  quantity: number
}

interface Order {
  id: string
  orderNumber: string
  email: string
  deliveryMethod: string
  total: number
  status: string
  createdAt: Date
  items: OrderItem[]
}

interface Props {
  orders: Order[]
}

export function BulkOrdersTable({ orders }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('processing')
  const [applying, setApplying] = useState(false)

  const allSelected = selected.size === orders.length && orders.length > 0

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)))
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyBulk = async () => {
    if (!selected.size) return
    setApplying(true)
    const ids = Array.from(selected)
    let failed = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus }),
        })
        if (!res.ok) failed++
      } catch {
        failed++
      }
    }
    setApplying(false)
    const successCount = ids.length - failed
    setSelected(new Set())
    if (failed > 0) toast.error(`${failed} order(s) failed to update`)
    if (successCount > 0) toast.success(`${successCount} order(s) updated to "${bulkStatus}"`)
    router.refresh()
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-arctic">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-brand-border"
                />
              </th>
              {['Order #', 'Customer', 'Items', 'Delivery', 'Total', 'Status', 'Date', 'Actions'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`hover:bg-brand-arctic transition-colors ${selected.has(order.id) ? 'bg-blue-50/40' : ''}`}
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggle(order.id)}
                    className="rounded border-brand-border"
                  />
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-xs text-brand-blue font-bold">{order.orderNumber}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-[160px]">
                    <p className="text-brand-text truncate text-xs">{order.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-brand-muted">
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-brand-muted">
                    {formatDeliveryMethod(order.deliveryMethod)}
                  </span>
                </td>
                <td className="px-4 py-4 font-bold text-brand-text">{formatPrice(order.total)}</td>
                <td className="px-4 py-4">
                  <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                </td>
                <td className="px-4 py-4 text-brand-muted text-xs whitespace-nowrap">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs text-brand-blue hover:underline font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-brand-muted">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 z-50 border border-white/10">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <span className="text-white/30">—</span>
          <span className="text-sm text-white/70">Update status:</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="bg-brand-surface/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[#1a1a2e]">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={applyBulk}
            disabled={applying}
            className="bg-brand-blue text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
          >
            {applying ? 'Applying…' : 'Apply'}
          </button>
          <span className="text-white/30">|</span>
          <button
            onClick={() => {
              const selectedOrders = orders
                .filter((o) => selected.has(o.id))
                .map((o) => ({ id: o.id, orderNumber: o.orderNumber }))
              printBulkBarcodes(selectedOrders)
            }}
            className="bg-white/10 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Print Barcodes
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  )
}
