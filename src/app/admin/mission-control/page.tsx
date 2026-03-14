'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatPrice, cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import type { AdminEvent } from '@/lib/redis'
import {
  RocketIcon,
  LightningBoltIcon,
  TimerIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  CounterClockwiseClockIcon,
} from '@radix-ui/react-icons'

interface LiveOrder {
  id: string
  orderNumber: string
  email: string
  total: number
  status: string
  createdAt: string
  items: { name: string; quantity: number }[]
}

interface LiveEvent {
  id: string
  type: string
  message: string
  ts: number
}

interface MissionStats {
  totalOrders: number
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  paidOrders: number
}

const STATUS_PRIORITY: Record<string, number> = {
  paid: 0,
  processing: 1,
  preparing: 2,
  prepared: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 6,
  refunded: 7,
}

export default function MissionControlPage() {
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [stats, setStats] = useState<MissionStats | null>(null)
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventCounter = useRef(0)

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mission-control')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setOrders(data.orders)
      setStats(data.stats)
    } catch {
      // Silently fail — will retry on next event
    } finally {
      setLoading(false)
    }
  }, [])

  // SSE connection for real-time updates
  useEffect(() => {
    fetchOrders()

    const connect = () => {
      if (esRef.current) esRef.current.close()
      const es = new EventSource('/api/admin/events')
      esRef.current = es

      es.addEventListener('connected', () => setConnected(true))

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as AdminEvent & { ts?: number }
          const eid = `evt-${++eventCounter.current}`

          if (event.type === 'new_order') {
            setEvents((prev) => [
              { id: eid, type: 'new_order', message: `New order ${event.orderNumber} — ${formatPrice(event.total)} from ${event.email}`, ts: event.ts || Date.now() },
              ...prev.slice(0, 49),
            ])
            fetchOrders()
          } else if (event.type === 'order_status_changed') {
            setEvents((prev) => [
              { id: eid, type: 'status_change', message: `Order ${event.orderNumber} → ${event.status}`, ts: event.ts || Date.now() },
              ...prev.slice(0, 49),
            ])
            fetchOrders()
          } else if (event.type === 'low_stock') {
            setEvents((prev) => [
              { id: eid, type: 'low_stock', message: `Low stock: ${event.name} (${event.stock} left)`, ts: event.ts || Date.now() },
              ...prev.slice(0, 49),
            ])
          } else if (event.type === 'stats_invalidated') {
            fetchOrders()
          }
        } catch {}
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        setConnected(false)
        reconnectTimer.current = setTimeout(connect, 3000)
      }
    }

    connect()

    // Periodic refresh every 30 seconds as a fallback
    const interval = setInterval(fetchOrders, 30_000)

    return () => {
      esRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      clearInterval(interval)
    }
  }, [fetchOrders])

  const filtered = filter
    ? orders.filter((o) => o.status === filter)
    : orders

  const sortedOrders = [...filtered].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 10
    const pb = STATUS_PRIORITY[b.status] ?? 10
    if (pa !== pb) return pa - pb
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <RocketIcon className="w-6 h-6 text-brand-blue" />
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Mission Control</h1>
            <p className="text-xs text-brand-muted">Real-time order tracking and monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            connected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
          )}>
            <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
            {connected ? 'Live' : 'Reconnecting…'}
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
            title="Refresh"
          >
            <CounterClockwiseClockIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            label="Today's Revenue"
            value={formatPrice(stats.todayRevenue)}
            icon={<LightningBoltIcon className="w-4 h-4" />}
            color="text-brand-blue"
            bg="bg-brand-blue/10"
          />
          <StatCard
            label="Today's Orders"
            value={stats.todayOrders.toString()}
            icon={<RocketIcon className="w-4 h-4" />}
            color="text-purple-600"
            bg="bg-purple-50"
          />
          <StatCard
            label="Paid (Awaiting)"
            value={(stats.paidOrders).toString()}
            icon={<TimerIcon className="w-4 h-4" />}
            color="text-amber-600"
            bg="bg-amber-50"
            pulse={stats.paidOrders > 0}
          />
          <StatCard
            label="Processing"
            value={stats.processingOrders.toString()}
            icon={<LightningBoltIcon className="w-4 h-4" />}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            label="Shipped"
            value={stats.shippedOrders.toString()}
            icon={<CheckCircledIcon className="w-4 h-4" />}
            color="text-green-600"
            bg="bg-green-50"
          />
          <StatCard
            label="Total Active"
            value={orders.length.toString()}
            icon={<ExclamationTriangleIcon className="w-4 h-4" />}
            color="text-brand-text"
            bg="bg-brand-arctic"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders panel */}
        <div className="xl:col-span-2">
          {/* Status filter pills */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                !filter ? 'bg-brand-blue text-white' : 'bg-brand-arctic text-brand-muted hover:text-brand-text'
              )}
            >
              All ({orders.length})
            </button>
            {Object.entries(statusCounts)
              .sort(([a], [b]) => (STATUS_PRIORITY[a] ?? 10) - (STATUS_PRIORITY[b] ?? 10))
              .map(([s, count]) => (
                <button
                  key={s}
                  onClick={() => setFilter(filter === s ? null : s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize',
                    filter === s ? 'bg-brand-blue text-white' : 'bg-brand-arctic text-brand-muted hover:text-brand-text'
                  )}
                >
                  {s} ({count})
                </button>
              ))}
          </div>

          {/* Orders table */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="text-center py-16 text-brand-muted text-sm">
                {filter ? `No ${filter} orders` : 'No active orders'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-brand-arctic/50">
                      {['Order', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {sortedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={cn(
                          'hover:bg-brand-arctic/50 transition-colors cursor-pointer',
                          order.status === 'paid' && 'bg-amber-50/30'
                        )}
                        onClick={() => window.open(`/admin/orders/${order.id}`, '_blank')}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-brand-blue font-medium">
                            {order.orderNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-brand-text truncate max-w-[160px] block text-xs">
                            {order.email}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-brand-muted text-xs">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand-text text-xs">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-brand-muted text-xs">
                          {timeAgo(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Event feed */}
        <div>
          <h2 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
            <LightningBoltIcon className="w-4 h-4 text-brand-blue" />
            Live Event Feed
          </h2>
          <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card overflow-hidden">
            {events.length === 0 ? (
              <div className="text-center py-12 text-brand-muted text-xs">
                <p>Listening for events…</p>
                <p className="mt-1 text-brand-muted/60">Events will appear here in real-time</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border max-h-[600px] overflow-y-auto">
                {events.map((evt) => (
                  <div key={evt.id} className="px-4 py-3 flex items-start gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full mt-1.5 shrink-0',
                      evt.type === 'new_order' ? 'bg-green-500' :
                      evt.type === 'status_change' ? 'bg-blue-500' :
                      evt.type === 'low_stock' ? 'bg-amber-500' : 'bg-brand-muted'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-brand-text leading-relaxed">{evt.message}</p>
                      <p className="text-[10px] text-brand-muted mt-0.5">{timeAgo(new Date(evt.ts).toISOString())}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-4 space-y-2">
            <a
              href="/admin/orders?status=paid"
              className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <span>Process paid orders</span>
              <span className="text-xs bg-amber-200 px-2 py-0.5 rounded-full">{statusCounts.paid || 0}</span>
            </a>
            <a
              href="/admin/orders?status=prepared"
              className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <span>Ship prepared orders</span>
              <span className="text-xs bg-blue-200 px-2 py-0.5 rounded-full">{statusCounts.prepared || 0}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, bg, pulse }: {
  label: string; value: string; icon: React.ReactNode; color: string; bg: string; pulse?: boolean
}) {
  return (
    <div className={cn('rounded-xl p-4 border border-brand-border', bg)}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider text-brand-muted')}>{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={cn('text-xl font-bold', color, pulse && 'animate-pulse')}>{value}</p>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
