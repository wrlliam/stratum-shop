'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatPrice, cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import type { AdminEvent } from '@/lib/redis'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  RocketIcon,
  LightningBoltIcon,
  TimerIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  CounterClockwiseClockIcon,
  BarChartIcon,
  ClockIcon,
  CaretSortIcon,
  CaretUpIcon,
  CaretDownIcon,
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
  avgFulfillmentHours: number
  weekRevenue: number
  weekOrders: number
  readyToPrint: number
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

const STATUS_COLORS: Record<string, string> = {
  paid: '#f59e0b',
  processing: '#3b82f6',
  preparing: '#8b5cf6',
  prepared: '#6366f1',
  shipped: '#22c55e',
  delivered: '#16a34a',
  cancelled: '#94a3b8',
  refunded: '#ef4444',
}

type SortKey = 'order' | 'customer' | 'items' | 'total' | 'status' | 'time'
type SortDir = 'asc' | 'desc'

function useIsDarkMode() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const check = () => setDark(el.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

export default function MissionControlPage() {
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [stats, setStats] = useState<MissionStats | null>(null)
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('time')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventCounter = useRef(0)
  const dark = useIsDarkMode()

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'time' ? 'desc' : 'asc')
    }
  }

  const sortedOrders = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'order':
        return a.orderNumber.localeCompare(b.orderNumber) * dir
      case 'customer':
        return a.email.localeCompare(b.email) * dir
      case 'items': {
        const ai = a.items.reduce((s, i) => s + i.quantity, 0)
        const bi = b.items.reduce((s, i) => s + i.quantity, 0)
        return (ai - bi) * dir
      }
      case 'total':
        return (a.total - b.total) * dir
      case 'status': {
        const pa = STATUS_PRIORITY[a.status] ?? 10
        const pb = STATUS_PRIORITY[b.status] ?? 10
        return (pa - pb) * dir
      }
      case 'time':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      default:
        return 0
    }
  })

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  // Chart data
  const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: STATUS_COLORS[status] || '#94a3b8',
  }))

  // Orders by hour of day (from current orders)
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    orders: orders.filter((o) => new Date(o.createdAt).getHours() === h).length,
  }))

  const gridColor = dark ? '#374151' : '#E8EAED'
  const tickColor = dark ? '#9ca3af' : '#6b7280'

  const SortTh = ({ label, keyName }: { label: string; keyName: SortKey }) => {
    const active = sortKey === keyName
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider cursor-pointer hover:text-brand-text select-none group transition-colors"
        onClick={() => handleSort(keyName)}
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
            connected
              ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
          )}>
            <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
            {connected ? 'Live' : 'Reconnecting…'}
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
            title="Refresh"
          >
            <CounterClockwiseClockIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <StatCard
            label="Today's Revenue"
            value={formatPrice(stats.todayRevenue)}
            icon={<LightningBoltIcon className="w-4 h-4" />}
            color="text-brand-blue"
          />
          <StatCard
            label="Today's Orders"
            value={stats.todayOrders.toString()}
            icon={<RocketIcon className="w-4 h-4" />}
            color="text-purple-600 dark:text-purple-400"
          />
          <StatCard
            label="Week Revenue"
            value={formatPrice(stats.weekRevenue)}
            icon={<BarChartIcon className="w-4 h-4" />}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Week Orders"
            value={stats.weekOrders.toString()}
            icon={<BarChartIcon className="w-4 h-4" />}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Paid (Awaiting)"
            value={stats.paidOrders.toString()}
            icon={<TimerIcon className="w-4 h-4" />}
            color="text-amber-600 dark:text-amber-400"
            pulse={stats.paidOrders > 0}
          />
          <StatCard
            label="Processing"
            value={stats.processingOrders.toString()}
            icon={<LightningBoltIcon className="w-4 h-4" />}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Shipped"
            value={stats.shippedOrders.toString()}
            icon={<CheckCircledIcon className="w-4 h-4" />}
            color="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Avg Fulfillment"
            value={stats.avgFulfillmentHours > 0 ? `${stats.avgFulfillmentHours}h` : '—'}
            icon={<ClockIcon className="w-4 h-4" />}
            color="text-brand-text"
          />
          {stats.readyToPrint > 0 && (
            <a href="/admin/recommendations?filter=paid">
              <StatCard
                label="Ready to Print"
                value={stats.readyToPrint.toString()}
                icon={<RocketIcon className="w-4 h-4" />}
                color="text-emerald-600 dark:text-emerald-400"
                pulse
              />
            </a>
          )}
        </div>
      )}

      {/* Charts row */}
      {stats && statusChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status breakdown donut */}
          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h3 className="text-sm font-semibold text-brand-text mb-1">Active Orders by Status</h3>
            <p className="text-xs text-brand-muted mb-4">Current pipeline</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: dark ? '#1f2937' : '#fff',
                    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    color: dark ? '#e5e7eb' : '#1a1a2e',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: tickColor }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by hour */}
          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h3 className="text-sm font-semibold text-brand-text mb-1">Orders by Hour</h3>
            <p className="text-xs text-brand-muted mb-4">Active order distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: tickColor, fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={3}
                />
                <YAxis
                  tick={{ fill: tickColor, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: dark ? '#1f2937' : '#fff',
                    border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    color: dark ? '#e5e7eb' : '#1a1a2e',
                  }}
                />
                <Bar dataKey="orders" fill="#6CBCE3" radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                'px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors',
                !filter ? 'bg-brand-blue text-white' : 'bg-brand-arctic dark:bg-brand-surface text-brand-muted hover:text-brand-text'
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
                    'px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors capitalize',
                    filter === s ? 'bg-brand-blue text-white' : 'bg-brand-arctic dark:bg-brand-surface text-brand-muted hover:text-brand-text'
                  )}
                >
                  {s} ({count})
                </button>
              ))}
          </div>

          {/* Orders table */}
          <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
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
                    <tr className="border-b border-brand-border bg-brand-arctic/50 dark:bg-brand-surface">
                      <SortTh label="Order" keyName="order" />
                      <SortTh label="Customer" keyName="customer" />
                      <SortTh label="Items" keyName="items" />
                      <SortTh label="Total" keyName="total" />
                      <SortTh label="Status" keyName="status" />
                      <SortTh label="Time" keyName="time" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {sortedOrders.map((order) => {
                      const ageMs = Date.now() - new Date(order.createdAt).getTime()
                      const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000))
                      const urgent = ageDays >= 2 && !['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)
                      return (
                        <tr
                          key={order.id}
                          className={cn(
                            'hover:bg-brand-arctic/50 dark:hover:bg-brand-arctic/10 transition-colors cursor-pointer',
                            urgent ? 'bg-red-50/40 dark:bg-red-950/15' :
                            order.status === 'paid' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
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
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <span className={urgent ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-brand-muted'}>
                              {timeAgo(order.createdAt)}
                            </span>
                            {urgent && (
                              <span className="ml-1 text-[10px] text-red-500 dark:text-red-400">!</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Event feed + quick actions */}
        <div>
          <h2 className="text-sm font-bold text-brand-text mb-3 flex items-center gap-2">
            <LightningBoltIcon className="w-4 h-4 text-brand-blue" />
            Live Event Feed
          </h2>
          <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
            {events.length === 0 ? (
              <div className="text-center py-12 text-brand-muted text-xs">
                <p>Listening for events…</p>
                <p className="mt-1 text-brand-muted/60">Events will appear here in real-time</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border max-h-[400px] overflow-y-auto">
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

          {/* Pipeline summary */}
          {stats && (
            <div className="mt-4 bg-brand-surface border border-brand-border rounded-sm shadow-card p-4">
              <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-3">Pipeline Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'Paid → Awaiting Processing', count: statusCounts.paid || 0, color: 'bg-amber-500' },
                  { label: 'Processing', count: (statusCounts.processing || 0) + (statusCounts.preparing || 0), color: 'bg-blue-500' },
                  { label: 'Prepared → Ready to Ship', count: statusCounts.prepared || 0, color: 'bg-indigo-500' },
                  { label: 'Shipped → In Transit', count: statusCounts.shipped || 0, color: 'bg-green-500' },
                ].map((stage) => (
                  <div key={stage.label} className="flex items-center gap-3">
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', stage.color)} />
                    <span className="text-xs text-brand-muted flex-1">{stage.label}</span>
                    <span className="text-xs font-bold text-brand-text">{stage.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="mt-4 space-y-2">
            <a
              href="/admin/orders?status=paid"
              className="flex items-center justify-between px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-sm text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
            >
              <span>Process paid orders</span>
              <span className="text-xs bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">{statusCounts.paid || 0}</span>
            </a>
            <a
              href="/admin/orders?status=prepared"
              className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-sm text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
            >
              <span>Ship prepared orders</span>
              <span className="text-xs bg-blue-200 dark:bg-blue-800 px-2 py-0.5 rounded-full">{statusCounts.prepared || 0}</span>
            </a>
            {stats && stats.readyToPrint > 0 && (
              <a
                href="/admin/recommendations?filter=paid"
                className="flex items-center justify-between px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-sm text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors"
              >
                <span>Custom prints ready</span>
                <span className="text-xs bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded-full">{stats.readyToPrint}</span>
              </a>
            )}
            <a
              href="/admin/orders"
              className="flex items-center justify-between px-4 py-3 bg-brand-arctic dark:bg-brand-surface border border-brand-border rounded-sm text-sm font-medium text-brand-text hover:bg-brand-arctic/80 dark:hover:bg-brand-arctic/10 transition-colors"
            >
              <span>View all orders</span>
              <ExclamationTriangleIcon className="w-4 h-4 text-brand-muted" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, pulse }: {
  label: string; value: string; icon: React.ReactNode; color: string; pulse?: boolean
}) {
  return (
    <div className="rounded-sm p-4 border border-brand-border bg-brand-surface shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">{label}</span>
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
