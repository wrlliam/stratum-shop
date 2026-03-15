'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { OrderStatusSelect } from './OrderStatusSelect'
import { formatPrice } from '@/lib/utils'
import { formatDeliveryMethod } from '@/lib/delivery'
import { printBulkBarcodes } from './PrintOrderBarcodeButton'
import { bulkLabelsHtml, getSender } from '@/lib/label-html'
import { PrintOrderBarcodeButton } from './PrintOrderBarcodeButton'
import type { DeliveryAddress } from '@/types'
import {
  CaretSortIcon,
  CaretUpIcon,
  CaretDownIcon,
} from '@radix-ui/react-icons'

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
  deliveryAddress: unknown
  total: number
  status: string
  createdAt: Date
  items: OrderItem[]
}

interface Props {
  orders: Order[]
}

type SortKey = 'orderNumber' | 'email' | 'items' | 'delivery' | 'total' | 'status' | 'date'
type SortDir = 'asc' | 'desc'

const STATUS_PRIORITY: Record<string, number> = {
  paid: 0, processing: 1, preparing: 2, prepared: 3, shipped: 4,
  delivered: 5, cancelled: 6, refunded: 7, pending: 8,
}

function isUrgent(createdAt: Date): boolean {
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000
  return Date.now() - new Date(createdAt).getTime() > twoDaysMs
}

function daysOld(createdAt: Date): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000))
}

export function BulkOrdersTable({ orders }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('processing')
  const [applying, setApplying] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'orderNumber':
        return a.orderNumber.localeCompare(b.orderNumber) * dir
      case 'email':
        return a.email.localeCompare(b.email) * dir
      case 'items': {
        const ai = a.items.reduce((s, i) => s + i.quantity, 0)
        const bi = b.items.reduce((s, i) => s + i.quantity, 0)
        return (ai - bi) * dir
      }
      case 'delivery':
        return formatDeliveryMethod(a.deliveryMethod).localeCompare(formatDeliveryMethod(b.deliveryMethod)) * dir
      case 'total':
        return (a.total - b.total) * dir
      case 'status': {
        const pa = STATUS_PRIORITY[a.status] ?? 10
        const pb = STATUS_PRIORITY[b.status] ?? 10
        return (pa - pb) * dir
      }
      case 'date':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      default:
        return 0
    }
  })

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

  const handlePrintLabels = () => {
    const selectedOrders = orders.filter((o) => selected.has(o.id))
    const labelsData = selectedOrders
      .filter((o) => o.deliveryAddress)
      .map((o) => ({
        orderNumber: o.orderNumber,
        deliveryLabel: formatDeliveryMethod(o.deliveryMethod),
        address: o.deliveryAddress as DeliveryAddress,
        meta: {
          orderDate: new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
          total: formatPrice(o.total),
        },
      }))

    if (labelsData.length === 0) {
      toast.error('No orders with delivery addresses selected')
      return
    }

    const sender = getSender()
    const html = bulkLabelsHtml(labelsData, 'branded', sender)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => {
    const active = sortKey === sortKeyName
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-brand-text select-none group transition-colors"
        onClick={() => handleSort(sortKeyName)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active ? (
            sortDir === 'asc' ? <CaretUpIcon className="w-3.5 h-3.5 text-brand-blue" /> : <CaretDownIcon className="w-3.5 h-3.5 text-brand-blue" />
          ) : (
            <CaretSortIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
          )}
        </span>
      </th>
    )
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
              <SortHeader label="Order #" sortKeyName="orderNumber" />
              <SortHeader label="Customer" sortKeyName="email" />
              <SortHeader label="Items" sortKeyName="items" />
              <SortHeader label="Delivery" sortKeyName="delivery" />
              <SortHeader label="Total" sortKeyName="total" />
              <SortHeader label="Status" sortKeyName="status" />
              <SortHeader label="Date" sortKeyName="date" />
              <th className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {sortedOrders.map((order) => {
              const urgent = isUrgent(order.createdAt) && !['delivered', 'cancelled', 'refunded', 'shipped'].includes(order.status)
              const age = daysOld(order.createdAt)
              return (
                <tr
                  key={order.id}
                  className={`hover:bg-brand-arctic transition-colors ${
                    selected.has(order.id) ? 'bg-blue-50/40 dark:bg-blue-950/20' :
                    urgent ? 'bg-red-50/40 dark:bg-red-950/15' : ''
                  }`}
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
                  <td className="px-4 py-4 text-xs whitespace-nowrap">
                    <span className={urgent ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-brand-muted'}>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {urgent && (
                      <span className="ml-1.5 text-[10px] text-red-500 dark:text-red-400 font-medium">
                        {age}d ago
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 flex items-center gap-2">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-brand-blue hover:underline font-medium"
                    >
                      View
                    </Link>
                    <PrintOrderBarcodeButton orderId={order.id} orderNumber={order.orderNumber} />
                  </td>
                </tr>
              )
            })}
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white px-6 py-3 rounded-sm shadow-xl flex items-center gap-4 z-50 border border-white/10">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <span className="text-white/30">—</span>
          <span className="text-sm text-white/70">Update status:</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="bg-brand-surface/10 border border-white/20 rounded-sm px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
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
            className="bg-brand-blue text-white px-4 py-1.5 rounded-sm text-sm font-semibold hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
          >
            {applying ? 'Applying...' : 'Apply'}
          </button>
          <span className="text-white/30">|</span>
          <button
            onClick={handlePrintLabels}
            className="bg-white/10 text-white px-4 py-1.5 rounded-sm text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Print Labels
          </button>
          <button
            onClick={() => {
              const selectedOrders = orders
                .filter((o) => selected.has(o.id))
                .map((o) => ({ id: o.id, orderNumber: o.orderNumber }))
              printBulkBarcodes(selectedOrders)
            }}
            className="bg-white/10 text-white px-4 py-1.5 rounded-sm text-sm font-semibold hover:bg-white/20 transition-colors"
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
