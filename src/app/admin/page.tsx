import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
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
import type { AdminStats } from '@/types'

async function getStats(): Promise<AdminStats> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/stats`,
    {
      cache: 'no-store',
      headers: await headers(),
    }
  )
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}

export default async function AdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() })
  let stats: AdminStats | null = null

  try {
    stats = await getStats()
  } catch {}

  const statCards = stats
    ? [
        {
          label: 'Total Revenue',
          value: formatPrice(stats.totalRevenue),
          icon: <BarChartIcon className="w-4 h-4 text-brand-blue" />,
          bg: 'bg-brand-blue-light',
          color: 'text-brand-blue',
          sub: stats.revenueChangePercent !== 0 ? (
            <span className={`text-xs flex items-center gap-0.5 ${stats.revenueChangePercent > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {stats.revenueChangePercent > 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
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
          sub: null,
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
          sub: stats.repeatCustomerRate > 0 ? (
            <span className="text-xs text-brand-muted">{stats.repeatCustomerRate}% repeat</span>
          ) : null,
        },
      ]
    : []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">Dashboard</h1>
        <p className="text-brand-muted text-sm mt-1">
          Welcome back, {session?.user?.name?.split(' ')[0]}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-brand-border rounded-2xl p-5 shadow-card"
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
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
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
                        {order.items.length}
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
          <p>Failed to load statistics. Check your database connection.</p>
        </div>
      )}
    </div>
  )
}
