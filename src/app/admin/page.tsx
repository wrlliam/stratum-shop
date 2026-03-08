'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'
import {
  BarChartIcon,
  BackpackIcon,
  BoxIcon,
  PersonIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@radix-ui/react-icons'
import {
  RevenueChart,
  OrdersChart,
  DailyOrdersChart,
  OrderStatusChart,
  TopProductsChart,
  LowStockTable,
} from '@/components/admin/SalesChart'
import { StatusBadge } from '@/components/ui/Badge'
import { RealtimeAdmin } from '@/components/admin/RealtimeAdmin'
import type { AdminStats } from '@/types'
import { useEffect } from 'react'

async function fetchStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [userName, setUserName] = useState<string>('')

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchStats()
      setStats(data)
    } catch {}
  }, [])

  useEffect(() => {
    loadStats()
    // Get user name from session
    fetch('/api/auth/get-session')
      .then((r) => r.json())
      .then((d) => {
        const name: string = d?.user?.name ?? ''
        setUserName(name.split(' ')[0] ?? '')
      })
      .catch(() => {})
  }, [loadStats])

  const handleStatsInvalidated = useCallback(() => {
    // Slight delay so the DB write has committed before we re-fetch
    setTimeout(loadStats, 800)
  }, [loadStats])

  const todayChange =
    stats && stats.yesterdayRevenue > 0
      ? Math.round(((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue) * 100)
      : stats?.todayRevenue
        ? 100
        : 0

  const statCards = stats
    ? [
        {
          label: 'Total Revenue',
          value: formatPrice(stats.totalRevenue),
          icon: <BarChartIcon className="w-4 h-4 text-brand-blue" />,
          bg: 'bg-brand-blue-light',
          color: 'text-brand-blue',
          sub:
            stats.revenueChangePercent !== 0 ? (
              <span
                className={`text-xs flex items-center gap-0.5 ${stats.revenueChangePercent > 0 ? 'text-green-600' : 'text-red-500'}`}
              >
                {stats.revenueChangePercent > 0 ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                )}
                {Math.abs(stats.revenueChangePercent)}% vs last month
              </span>
            ) : null,
        },
        {
          label: 'Total Orders',
          value: stats.totalOrders.toString(),
          icon: <BackpackIcon className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50',
          color: 'text-blue-600',
          sub: stats.pendingOrders > 0 ? (
            <span className="text-xs text-amber-600">{stats.pendingOrders} need attention</span>
          ) : null,
        },
        {
          label: 'Avg Order Value',
          value: formatPrice(stats.avgOrderValue),
          icon: <BoxIcon className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50',
          color: 'text-purple-600',
          sub: null,
        },
        {
          label: 'Customers',
          value: stats.totalCustomers.toString(),
          icon: <PersonIcon className="w-4 h-4 text-green-600" />,
          bg: 'bg-green-50',
          color: 'text-green-600',
          sub:
            stats.repeatCustomerRate > 0 ? (
              <span className="text-xs text-brand-muted">{stats.repeatCustomerRate}% repeat</span>
            ) : null,
        },
      ]
    : []

  return (
    <div className="p-8">
      {/* Realtime SSE connector */}
      <RealtimeAdmin onStatsInvalidated={handleStatsInvalidated} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>
        {userName && (
          <p className="text-brand-muted text-sm mt-1">Welcome back, {userName}</p>
        )}
      </div>

      {/* Today at a glance strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Today's revenue */}
          <div className="bg-gradient-to-br from-brand-blue/10 to-brand-blue/5 border border-brand-blue/20 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-wider mb-1">Today</p>
            <p className="text-xl font-bold text-brand-blue">{formatPrice(stats.todayRevenue)}</p>
            {todayChange !== 0 && (
              <span className={`text-xs flex items-center gap-0.5 mt-0.5 ${todayChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {todayChange > 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                {Math.abs(todayChange)}% vs yesterday
              </span>
            )}
            <p className="text-xs text-brand-muted mt-1">{stats.todayOrders} orders</p>
          </div>

          {/* Pending orders */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-700">{stats.pendingOrders}</p>
            <p className="text-xs text-amber-600/70 mt-1">orders to process</p>
          </div>

          {/* Open tickets */}
          <div className={`${stats.openTickets > 0 ? 'bg-red-50 border-red-200/60' : 'bg-green-50 border-green-200/60'} border rounded-xl p-4`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${stats.openTickets > 0 ? 'text-red-500/70' : 'text-green-600/70'}`}>
              Support
            </p>
            <p className={`text-xl font-bold ${stats.openTickets > 0 ? 'text-red-600' : 'text-green-700'}`}>
              {stats.openTickets}
            </p>
            <p className={`text-xs mt-1 ${stats.openTickets > 0 ? 'text-red-500/70' : 'text-green-600/70'}`}>
              open tickets
            </p>
          </div>

          {/* Low stock */}
          <div className={`${stats.lowStockCount > 0 ? 'bg-orange-50 border-orange-200/60' : 'bg-brand-arctic border-brand-border'} border rounded-xl p-4`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${stats.lowStockCount > 0 ? 'text-orange-500/70' : 'text-brand-muted'}`}>
              Low Stock
            </p>
            <p className={`text-xl font-bold ${stats.lowStockCount > 0 ? 'text-orange-600' : 'text-brand-muted'}`}>
              {stats.lowStockCount}
            </p>
            <p className={`text-xs mt-1 ${stats.lowStockCount > 0 ? 'text-orange-500/70' : 'text-brand-muted'}`}>
              products
            </p>
          </div>
        </div>
      )}

      {/* Main stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub && <div className="mt-1">{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts */}
      {stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <RevenueChart data={stats.revenueByMonth} />
            </div>
            <OrderStatusChart data={stats.ordersByStatus} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <DailyOrdersChart data={stats.dailyOrders} />
            </div>
            <TopProductsChart data={stats.topProducts} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <OrdersChart data={stats.revenueByMonth} />
            </div>
            <LowStockTable data={stats.lowStockProducts} />
          </div>

          {/* Recent Orders */}
          <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-card">
            <h3 className="text-sm font-semibold text-brand-text mb-4">Recent Orders</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date'].map((col) => (
                      <th
                        key={col}
                        className="pb-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-brand-arctic transition-colors">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs text-brand-blue">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-brand-text truncate max-w-[120px] block">
                          {order.email}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-brand-muted">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-brand-text">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-3 text-brand-muted text-xs">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {stats.recentOrders.length === 0 && (
                <p className="text-sm text-brand-muted text-center py-8">No orders yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {!stats && (
        <div className="text-center py-16 text-brand-muted">
          <p>Loading statistics…</p>
        </div>
      )}
    </div>
  )
}
