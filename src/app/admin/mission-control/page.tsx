'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { formatPrice, cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import type { AdminEvent } from '@/lib/redis'
import type { AdminStats } from '@/types'
import {
  RevenueChart,
  OrdersChart,
  DailyOrdersChart,
  OrderStatusChart,
  TopProductsChart,
  LowStockTable,
} from '@/components/admin/SalesChart'
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
  ArrowUpIcon,
  ArrowDownIcon,
  PersonIcon,
  BackpackIcon,
  BoxIcon,
  ChatBubbleIcon,
  GearIcon,
  CubeIcon,
  MixerHorizontalIcon,
  ArchiveIcon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons'

// ─── Types ───

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

const TABS = [
  { id: 'overview', label: 'Overview', icon: <RocketIcon className="w-4 h-4" /> },
  { id: 'orders', label: 'Live Orders', icon: <BackpackIcon className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChartIcon className="w-4 h-4" /> },
  { id: 'products', label: 'Products', icon: <CubeIcon className="w-4 h-4" /> },
  { id: 'customers', label: 'Customers', icon: <PersonIcon className="w-4 h-4" /> },
  { id: 'operations', label: 'Operations', icon: <GearIcon className="w-4 h-4" /> },
] as const

type TabId = (typeof TABS)[number]['id']

const STATUS_PRIORITY: Record<string, number> = {
  paid: 0, processing: 1, preparing: 2, prepared: 3, shipped: 4, delivered: 5, cancelled: 6, refunded: 7,
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#f59e0b', processing: '#3b82f6', preparing: '#8b5cf6', prepared: '#6366f1',
  shipped: '#22c55e', delivered: '#16a34a', cancelled: '#94a3b8', refunded: '#ef4444',
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

// ─── Main Component ───

export default function MissionControlPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [missionStats, setMissionStats] = useState<MissionStats | null>(null)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [connected, setConnected] = useState(false)
  const [filter, setFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('time')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventCounter = useRef(0)
  const dark = useIsDarkMode()

  const fetchData = useCallback(async () => {
    try {
      const [mcRes, statsRes] = await Promise.all([
        fetch('/api/admin/mission-control'),
        fetch('/api/admin/stats'),
      ])
      if (mcRes.ok) {
        const mcData = await mcRes.json()
        setOrders(mcData.orders)
        setMissionStats(mcData.stats)
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setAdminStats(statsData)
      }
    } catch {
      // will retry
    } finally {
      setLoading(false)
    }
  }, [])

  // SSE connection
  useEffect(() => {
    fetchData()

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
            fetchData()
          } else if (event.type === 'order_status_changed') {
            setEvents((prev) => [
              { id: eid, type: 'status_change', message: `Order ${event.orderNumber} → ${event.status}`, ts: event.ts || Date.now() },
              ...prev.slice(0, 49),
            ])
            fetchData()
          } else if (event.type === 'low_stock') {
            setEvents((prev) => [
              { id: eid, type: 'low_stock', message: `Low stock: ${event.name} (${event.stock} left)`, ts: event.ts || Date.now() },
              ...prev.slice(0, 49),
            ])
          } else if (event.type === 'stats_invalidated') {
            fetchData()
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
    const interval = setInterval(fetchData, 30_000)

    return () => {
      esRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      clearInterval(interval)
    }
  }, [fetchData])

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
            <RocketIcon className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-display text-brand-text">Mission Control</h1>
            <p className="text-xs text-brand-muted">Complete business overview — real-time data</p>
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
            onClick={fetchData}
            className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
            title="Refresh"
          >
            <CounterClockwiseClockIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-brand-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab
              missionStats={missionStats}
              adminStats={adminStats}
              statusCounts={statusCounts}
              orders={orders}
              events={events}
              dark={dark}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              filter={filter}
              setFilter={setFilter}
              statusCounts={statusCounts}
              sortKey={sortKey}
              setSortKey={setSortKey}
              sortDir={sortDir}
              setSortDir={setSortDir}
              events={events}
              missionStats={missionStats}
              dark={dark}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab adminStats={adminStats} dark={dark} />
          )}
          {activeTab === 'products' && (
            <ProductsTab adminStats={adminStats} />
          )}
          {activeTab === 'customers' && (
            <CustomersTab adminStats={adminStats} />
          )}
          {activeTab === 'operations' && (
            <OperationsTab
              missionStats={missionStats}
              adminStats={adminStats}
              statusCounts={statusCounts}
            />
          )}
        </>
      )}
    </div>
  )
}

// ─── Overview Tab ───

function OverviewTab({
  missionStats,
  adminStats,
  statusCounts,
  orders,
  events,
  dark,
}: {
  missionStats: MissionStats | null
  adminStats: AdminStats | null
  statusCounts: Record<string, number>
  orders: LiveOrder[]
  events: LiveEvent[]
  dark: boolean
}) {
  const todayChange = adminStats && adminStats.yesterdayRevenue > 0
    ? Math.round(((adminStats.todayRevenue - adminStats.yesterdayRevenue) / adminStats.yesterdayRevenue) * 100)
    : adminStats?.todayRevenue ? 100 : 0

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {missionStats && (
          <>
            <KPICard
              label="Today's Revenue"
              value={formatPrice(missionStats.todayRevenue)}
              icon={<LightningBoltIcon className="w-4 h-4" />}
              color="text-brand-blue"
              sub={todayChange !== 0 ? (
                <span className={cn('text-[10px] flex items-center gap-0.5', todayChange > 0 ? 'text-green-500' : 'text-red-500')}>
                  {todayChange > 0 ? <ArrowUpIcon className="w-2.5 h-2.5" /> : <ArrowDownIcon className="w-2.5 h-2.5" />}
                  {Math.abs(todayChange)}% vs yesterday
                </span>
              ) : undefined}
            />
            <KPICard
              label="Today's Orders"
              value={missionStats.todayOrders.toString()}
              icon={<RocketIcon className="w-4 h-4" />}
              color="text-purple-600 dark:text-purple-400"
            />
            <KPICard
              label="Week Revenue"
              value={formatPrice(missionStats.weekRevenue)}
              icon={<BarChartIcon className="w-4 h-4" />}
              color="text-green-600 dark:text-green-400"
            />
            <KPICard
              label="Paid (Awaiting)"
              value={missionStats.paidOrders.toString()}
              icon={<TimerIcon className="w-4 h-4" />}
              color="text-amber-600 dark:text-amber-400"
              pulse={missionStats.paidOrders > 0}
            />
            <KPICard
              label="Processing"
              value={missionStats.processingOrders.toString()}
              icon={<GearIcon className="w-4 h-4" />}
              color="text-blue-600 dark:text-blue-400"
            />
            <KPICard
              label="Avg Fulfillment"
              value={missionStats.avgFulfillmentHours > 0 ? `${missionStats.avgFulfillmentHours}h` : '—'}
              icon={<ClockIcon className="w-4 h-4" />}
              color="text-brand-text"
            />
          </>
        )}
      </div>

      {/* Business health row */}
      {adminStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <HealthCard
            label="Total Revenue"
            value={formatPrice(adminStats.totalRevenue)}
            change={adminStats.revenueChangePercent}
            changeSuffix="vs last month"
          />
          <HealthCard
            label="Total Orders"
            value={adminStats.totalOrders.toString()}
            sub={adminStats.pendingOrders > 0 ? `${adminStats.pendingOrders} need attention` : undefined}
            subColor="text-amber-600 dark:text-amber-400"
          />
          <HealthCard
            label="Avg Order Value"
            value={formatPrice(adminStats.avgOrderValue)}
          />
          <HealthCard
            label="Customers"
            value={adminStats.totalCustomers.toString()}
            sub={adminStats.repeatCustomerRate > 0 ? `${adminStats.repeatCustomerRate}% repeat` : undefined}
          />
        </div>
      )}

      {/* Three-column: Pipeline + Chart + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline summary */}
        <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card p-5">
          <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-4">Order Pipeline</h3>
          <div className="space-y-3">
            {[
              { label: 'Paid — Awaiting', count: statusCounts.paid || 0, color: 'bg-amber-500', href: '/admin/orders?status=paid' },
              { label: 'Processing', count: (statusCounts.processing || 0) + (statusCounts.preparing || 0), color: 'bg-blue-500', href: '/admin/orders?status=processing' },
              { label: 'Prepared — Ship', count: statusCounts.prepared || 0, color: 'bg-indigo-500', href: '/admin/orders?status=prepared' },
              { label: 'Shipped', count: statusCounts.shipped || 0, color: 'bg-green-500', href: '/admin/orders?status=shipped' },
            ].map((stage) => {
              const total = orders.length || 1
              const pct = Math.round((stage.count / total) * 100)
              return (
                <Link key={stage.label} href={stage.href} className="block group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-brand-muted group-hover:text-brand-text transition-colors">{stage.label}</span>
                    <span className="text-xs font-bold text-brand-text">{stage.count}</span>
                  </div>
                  <div className="w-full bg-brand-arctic dark:bg-brand-border rounded-full h-1.5 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', stage.color)} style={{ width: `${Math.max(pct, stage.count > 0 ? 4 : 0)}%` }} />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-4 border-t border-brand-border space-y-2">
            <h4 className="text-[10px] font-mono text-brand-muted uppercase tracking-[0.2em] mb-2">Quick Actions</h4>
            <QuickAction href="/admin/orders?status=paid" label="Process paid orders" count={statusCounts.paid || 0} color="amber" />
            <QuickAction href="/admin/orders?status=prepared" label="Ship prepared orders" count={statusCounts.prepared || 0} color="blue" />
            {missionStats && missionStats.readyToPrint > 0 && (
              <QuickAction href="/admin/recommendations?filter=paid" label="Custom prints ready" count={missionStats.readyToPrint} color="emerald" />
            )}
          </div>
        </div>

        {/* Status chart */}
        <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card p-5">
          <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-1">Active Orders by Status</h3>
          <p className="text-xs text-brand-muted mb-4">Current pipeline</p>
          <StatusDonut statusCounts={statusCounts} dark={dark} />
        </div>

        {/* Live event feed */}
        <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
          <div className="p-4 border-b border-brand-border">
            <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] flex items-center gap-2">
              <LightningBoltIcon className="w-3.5 h-3.5" />
              Live Event Feed
            </h3>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-12 text-brand-muted text-xs">
              <p>Listening for events…</p>
              <p className="mt-1 text-brand-muted/60">Events will appear here in real-time</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border max-h-[360px] overflow-y-auto">
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
      </div>

      {/* Alert cards */}
      {adminStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AlertCard
            label="Support Tickets"
            value={adminStats.openTickets}
            icon={<ChatBubbleIcon className="w-4 h-4" />}
            type={adminStats.openTickets > 0 ? 'warning' : 'success'}
            sub={adminStats.openTickets > 0 ? 'open tickets' : 'all clear'}
            href="/admin/support"
          />
          <AlertCard
            label="Low Stock"
            value={adminStats.lowStockCount}
            icon={<ExclamationTriangleIcon className="w-4 h-4" />}
            type={adminStats.lowStockCount > 0 ? 'warning' : 'success'}
            sub={adminStats.lowStockCount > 0 ? 'products low' : 'stock healthy'}
            href="/admin/products"
          />
          <AlertCard
            label="Shipped"
            value={missionStats?.shippedOrders || 0}
            icon={<CheckCircledIcon className="w-4 h-4" />}
            type="info"
            sub="in transit"
            href="/admin/orders?status=shipped"
          />
        </div>
      )}
    </div>
  )
}

// ─── Orders Tab ───

function OrdersTab({
  orders,
  filter,
  setFilter,
  statusCounts,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  events,
  missionStats,
  dark,
}: {
  orders: LiveOrder[]
  filter: string | null
  setFilter: (f: string | null) => void
  statusCounts: Record<string, number>
  sortKey: SortKey
  setSortKey: (k: SortKey) => void
  sortDir: SortDir
  setSortDir: (d: SortDir) => void
  events: LiveEvent[]
  missionStats: MissionStats | null
  dark: boolean
}) {
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'time' ? 'desc' : 'asc')
    }
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders

  const sortedOrders = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'order': return a.orderNumber.localeCompare(b.orderNumber) * dir
      case 'customer': return a.email.localeCompare(b.email) * dir
      case 'items': {
        const ai = a.items.reduce((s, i) => s + i.quantity, 0)
        const bi = b.items.reduce((s, i) => s + i.quantity, 0)
        return (ai - bi) * dir
      }
      case 'total': return (a.total - b.total) * dir
      case 'status': return ((STATUS_PRIORITY[a.status] ?? 10) - (STATUS_PRIORITY[b.status] ?? 10)) * dir
      case 'time': return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      default: return 0
    }
  })

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

  // Hourly chart
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    orders: orders.filter((o) => new Date(o.createdAt).getHours() === h).length,
  }))
  const gridColor = dark ? '#374151' : '#E8EAED'
  const tickColor = dark ? '#9ca3af' : '#6b7280'

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      {missionStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard label="Paid (Awaiting)" value={missionStats.paidOrders.toString()} icon={<TimerIcon className="w-4 h-4" />} color="text-amber-600 dark:text-amber-400" pulse={missionStats.paidOrders > 0} />
          <KPICard label="Processing" value={missionStats.processingOrders.toString()} icon={<GearIcon className="w-4 h-4" />} color="text-blue-600 dark:text-blue-400" />
          <KPICard label="Shipped" value={missionStats.shippedOrders.toString()} icon={<CheckCircledIcon className="w-4 h-4" />} color="text-green-600 dark:text-green-400" />
          <KPICard label="Active Total" value={orders.length.toString()} icon={<BackpackIcon className="w-4 h-4" />} color="text-brand-text" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders table */}
        <div className="xl:col-span-2">
          {/* Filter pills */}
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

          {/* Table */}
          <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
            {sortedOrders.length === 0 ? (
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
                            <span className="font-mono text-xs text-brand-blue font-medium">{order.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-brand-text truncate max-w-[160px] block text-xs">{order.email}</span>
                          </td>
                          <td className="px-4 py-3 text-brand-muted text-xs">
                            {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                          </td>
                          <td className="px-4 py-3 font-semibold text-brand-text text-xs font-mono">
                            {formatPrice(order.total)}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <span className={urgent ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-brand-muted'}>
                              {timeAgo(order.createdAt)}
                            </span>
                            {urgent && <span className="ml-1 text-[10px] text-red-500 dark:text-red-400">!</span>}
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

        {/* Right column: hour chart + events */}
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-sm p-5 shadow-card">
            <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-1">Orders by Hour</h3>
            <p className="text-xs text-brand-muted mb-4">Active order distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="hour" tick={{ fill: tickColor, fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{
                  background: dark ? '#1f2937' : '#fff',
                  border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: '2px',
                  color: dark ? '#e5e7eb' : '#1a1a2e',
                }} />
                <Bar dataKey="orders" fill="#6CBCE3" radius={[2, 2, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent events */}
          <div className="bg-brand-surface border border-brand-border rounded-sm shadow-card overflow-hidden">
            <div className="p-4 border-b border-brand-border">
              <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em]">Recent Events</h3>
            </div>
            {events.length === 0 ? (
              <div className="text-center py-8 text-brand-muted text-xs">Listening…</div>
            ) : (
              <div className="divide-y divide-brand-border max-h-[240px] overflow-y-auto">
                {events.slice(0, 10).map((evt) => (
                  <div key={evt.id} className="px-4 py-2.5 flex items-start gap-2">
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                      evt.type === 'new_order' ? 'bg-green-500' :
                      evt.type === 'status_change' ? 'bg-blue-500' : 'bg-amber-500'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-brand-text truncate">{evt.message}</p>
                      <p className="text-[10px] text-brand-muted">{timeAgo(new Date(evt.ts).toISOString())}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics Tab ───

function AnalyticsTab({ adminStats, dark }: { adminStats: AdminStats | null; dark: boolean }) {
  if (!adminStats) {
    return <div className="text-center py-16 text-brand-muted text-sm">Loading analytics…</div>
  }

  return (
    <div className="space-y-6">
      {/* Revenue + daily orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={adminStats.revenueByMonth} />
        </div>
        <OrderStatusChart data={adminStats.ordersByStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyOrdersChart data={adminStats.dailyOrders} />
        </div>
        <TopProductsChart data={adminStats.topProducts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrdersChart data={adminStats.revenueByMonth} />
        {/* Revenue KPIs */}
        <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
          <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-4">Revenue Metrics</h3>
          <div className="space-y-4">
            <MetricRow label="Total Revenue" value={formatPrice(adminStats.totalRevenue)} />
            <MetricRow label="This Month vs Last" value={`${adminStats.revenueChangePercent > 0 ? '+' : ''}${adminStats.revenueChangePercent}%`} color={adminStats.revenueChangePercent >= 0 ? 'text-green-500' : 'text-red-500'} />
            <MetricRow label="Avg Order Value" value={formatPrice(adminStats.avgOrderValue)} />
            <MetricRow label="Today" value={formatPrice(adminStats.todayRevenue)} />
            <MetricRow label="Today's Orders" value={adminStats.todayOrders.toString()} />
            <MetricRow label="Repeat Customer Rate" value={`${adminStats.repeatCustomerRate}%`} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Products Tab ───

function ProductsTab({ adminStats }: { adminStats: AdminStats | null }) {
  if (!adminStats) {
    return <div className="text-center py-16 text-brand-muted text-sm">Loading…</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Total Products"
          value={adminStats.totalProducts.toString()}
          icon={<CubeIcon className="w-4 h-4" />}
          color="text-brand-blue"
        />
        <KPICard
          label="Low Stock"
          value={adminStats.lowStockCount.toString()}
          icon={<ExclamationTriangleIcon className="w-4 h-4" />}
          color={adminStats.lowStockCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}
          pulse={adminStats.lowStockCount > 0}
        />
        <KPICard
          label="Avg Order Value"
          value={formatPrice(adminStats.avgOrderValue)}
          icon={<BoxIcon className="w-4 h-4" />}
          color="text-purple-600 dark:text-purple-400"
        />
        <KPICard
          label="Total Orders"
          value={adminStats.totalOrders.toString()}
          icon={<BackpackIcon className="w-4 h-4" />}
          color="text-brand-text"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <TopProductsChart data={adminStats.topProducts} />

        {/* Low stock */}
        <LowStockTable data={adminStats.lowStockProducts} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink href="/admin/products" label="Manage Products" icon={<CubeIcon className="w-4 h-4" />} description="Add, edit, or remove products" />
        <QuickLink href="/admin/filaments" label="Filament Stock" icon={<MixerHorizontalIcon className="w-4 h-4" />} description="Manage filament inventory" />
        <QuickLink href="/admin/inventory" label="Print Batches" icon={<ArchiveIcon className="w-4 h-4" />} description="Batch printing & labels" />
      </div>
    </div>
  )
}

// ─── Customers Tab ───

function CustomersTab({ adminStats }: { adminStats: AdminStats | null }) {
  if (!adminStats) {
    return <div className="text-center py-16 text-brand-muted text-sm">Loading…</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Total Customers"
          value={adminStats.totalCustomers.toString()}
          icon={<PersonIcon className="w-4 h-4" />}
          color="text-brand-blue"
        />
        <KPICard
          label="Repeat Rate"
          value={`${adminStats.repeatCustomerRate}%`}
          icon={<CounterClockwiseClockIcon className="w-4 h-4" />}
          color="text-green-600 dark:text-green-400"
        />
        <KPICard
          label="Support Tickets"
          value={adminStats.openTickets.toString()}
          icon={<ChatBubbleIcon className="w-4 h-4" />}
          color={adminStats.openTickets > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
        />
        <KPICard
          label="Avg Order Value"
          value={formatPrice(adminStats.avgOrderValue)}
          icon={<BarChartIcon className="w-4 h-4" />}
          color="text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Recent orders */}
      <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
        <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((col) => (
                  <th key={col} className="pb-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {adminStats.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-brand-arctic/50 dark:hover:bg-brand-arctic/10 transition-colors cursor-pointer"
                  onClick={() => window.open(`/admin/orders/${order.id}`, '_blank')}
                >
                  <td className="py-3 pr-4"><span className="font-mono text-xs text-brand-blue">{order.orderNumber}</span></td>
                  <td className="py-3 pr-4"><span className="text-brand-text truncate max-w-[140px] block text-xs">{order.email}</span></td>
                  <td className="py-3 pr-4 text-brand-muted text-xs">{order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td className="py-3 pr-4 font-semibold text-brand-text text-xs font-mono">{formatPrice(order.total)}</td>
                  <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
                  <td className="py-3 text-brand-muted text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {adminStats.recentOrders.length === 0 && (
            <p className="text-sm text-brand-muted text-center py-8">No orders yet</p>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLink href="/admin/customers" label="Customer List" icon={<PersonIcon className="w-4 h-4" />} description="View all customers" />
        <QuickLink href="/admin/support" label="Support Tickets" icon={<ChatBubbleIcon className="w-4 h-4" />} description="Manage customer enquiries" />
        <QuickLink href="/admin/emails" label="Email Campaigns" icon={<EnvelopeClosedIcon className="w-4 h-4" />} description="Send marketing emails" />
      </div>
    </div>
  )
}

// ─── Operations Tab ───

function OperationsTab({
  missionStats,
  adminStats,
  statusCounts,
}: {
  missionStats: MissionStats | null
  adminStats: AdminStats | null
  statusCounts: Record<string, number>
}) {
  return (
    <div className="space-y-6">
      {/* Fulfillment stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Avg Fulfillment"
          value={missionStats && missionStats.avgFulfillmentHours > 0 ? `${missionStats.avgFulfillmentHours}h` : '—'}
          icon={<ClockIcon className="w-4 h-4" />}
          color="text-brand-blue"
        />
        <KPICard
          label="Pending Orders"
          value={(adminStats?.pendingOrders || 0).toString()}
          icon={<TimerIcon className="w-4 h-4" />}
          color="text-amber-600 dark:text-amber-400"
          pulse={(adminStats?.pendingOrders || 0) > 0}
        />
        <KPICard
          label="Ready to Print"
          value={(missionStats?.readyToPrint || 0).toString()}
          icon={<RocketIcon className="w-4 h-4" />}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <KPICard
          label="Low Stock Items"
          value={(adminStats?.lowStockCount || 0).toString()}
          icon={<ExclamationTriangleIcon className="w-4 h-4" />}
          color={adminStats && adminStats.lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}
        />
      </div>

      {/* Pipeline details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
          <h3 className="text-[10px] font-mono text-brand-blue uppercase tracking-[0.2em] mb-4">Fulfillment Pipeline</h3>
          <div className="space-y-4">
            {[
              { label: 'Paid — Awaiting Processing', count: statusCounts.paid || 0, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
              { label: 'Processing / Preparing', count: (statusCounts.processing || 0) + (statusCounts.preparing || 0), color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
              { label: 'Prepared — Ready to Ship', count: statusCounts.prepared || 0, color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Shipped — In Transit', count: statusCounts.shipped || 0, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
              { label: 'Delivered', count: statusCounts.delivered || 0, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Cancelled', count: statusCounts.cancelled || 0, color: 'bg-gray-400', textColor: 'text-gray-500' },
              { label: 'Refunded', count: statusCounts.refunded || 0, color: 'bg-red-500', textColor: 'text-red-500' },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full shrink-0', stage.color)} />
                <span className="text-sm text-brand-muted flex-1">{stage.label}</span>
                <span className={cn('text-sm font-bold', stage.textColor)}>{stage.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        {adminStats && <LowStockTable data={adminStats.lowStockProducts} />}
      </div>

      {/* Admin quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickLink href="/admin/orders" label="All Orders" icon={<BackpackIcon className="w-4 h-4" />} description="View and manage orders" />
        <QuickLink href="/admin/inventory" label="Inventory" icon={<ArchiveIcon className="w-4 h-4" />} description="Batches, scanning, labels" />
        <QuickLink href="/admin/costs" label="Costs" icon={<BarChartIcon className="w-4 h-4" />} description="Track costs and margins" />
        <QuickLink href="/admin/audit" label="Audit Log" icon={<ClockIcon className="w-4 h-4" />} description="Track admin activity" />
      </div>
    </div>
  )
}

// ─── Shared Components ───

function KPICard({ label, value, icon, color, pulse, sub }: {
  label: string; value: string; icon: React.ReactNode; color: string; pulse?: boolean; sub?: React.ReactNode
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-sm p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-brand-muted">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={cn('text-xl font-bold font-display', color, pulse && 'animate-pulse')}>{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

function HealthCard({ label, value, change, changeSuffix, sub, subColor }: {
  label: string; value: string; change?: number; changeSuffix?: string; sub?: string; subColor?: string
}) {
  return (
    <div className="bg-brand-surface border border-brand-border rounded-sm p-4 shadow-card">
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-brand-muted mb-1">{label}</p>
      <p className="text-lg font-bold font-display text-brand-text">{value}</p>
      {change !== undefined && change !== 0 && (
        <span className={cn('text-[10px] flex items-center gap-0.5 mt-0.5', change > 0 ? 'text-green-500' : 'text-red-500')}>
          {change > 0 ? <ArrowUpIcon className="w-2.5 h-2.5" /> : <ArrowDownIcon className="w-2.5 h-2.5" />}
          {Math.abs(change)}% {changeSuffix}
        </span>
      )}
      {sub && <p className={cn('text-[10px] mt-0.5', subColor || 'text-brand-muted')}>{sub}</p>}
    </div>
  )
}

function AlertCard({ label, value, icon, type, sub, href }: {
  label: string; value: number; icon: React.ReactNode; type: 'warning' | 'success' | 'info'; sub: string; href: string
}) {
  const styles = {
    warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  }

  return (
    <Link href={href} className={cn('flex items-center gap-3 p-4 rounded-sm border transition-opacity hover:opacity-80', styles[type])}>
      <span>{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[10px] opacity-70">{sub}</p>
      </div>
      <span className="text-2xl font-display font-bold">{value}</span>
    </Link>
  )
}

function QuickAction({ href, label, count, color }: {
  href: string; label: string; count: number; color: string
}) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50',
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/50',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
  }
  return (
    <Link href={href} className={cn('flex items-center justify-between px-3 py-2.5 rounded-sm border text-xs font-medium transition-colors', colorMap[color] || colorMap.blue)}>
      <span>{label}</span>
      <span className="font-bold">{count}</span>
    </Link>
  )
}

function QuickLink({ href, label, icon, description }: {
  href: string; label: string; icon: React.ReactNode; description: string
}) {
  return (
    <Link href={href} className="flex items-start gap-3 p-4 bg-brand-surface border border-brand-border rounded-sm shadow-card hover:border-brand-blue/40 transition-colors group">
      <div className="w-8 h-8 rounded-sm bg-brand-arctic dark:bg-brand-border flex items-center justify-center text-brand-muted group-hover:text-brand-blue transition-colors shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-brand-text group-hover:text-brand-blue transition-colors">{label}</p>
        <p className="text-[10px] text-brand-muted mt-0.5">{description}</p>
      </div>
    </Link>
  )
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-brand-muted">{label}</span>
      <span className={cn('text-sm font-bold font-mono', color || 'text-brand-text')}>{value}</span>
    </div>
  )
}

function StatusDonut({ statusCounts, dark }: { statusCounts: Record<string, number>; dark: boolean }) {
  const tickColor = dark ? '#9ca3af' : '#6b7280'
  const data = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    fill: STATUS_COLORS[status] || '#94a3b8',
  }))

  if (data.length === 0) {
    return <div className="text-center py-8 text-brand-muted text-xs">No active orders</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip contentStyle={{
          background: dark ? '#1f2937' : '#fff',
          border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          borderRadius: '2px',
          color: dark ? '#e5e7eb' : '#1a1a2e',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }} />
        <Legend formatter={(value) => <span style={{ fontSize: 11, color: tickColor }}>{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
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
