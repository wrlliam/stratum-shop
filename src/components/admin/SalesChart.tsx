'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import type { AdminStats } from '@/types'

const COLORS = ['#6CBCE3', '#3A9FD4', '#AEB4BB', '#5b8dd9', '#22c55e', '#f59e0b']

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-brand-border rounded-xl px-4 py-3 shadow-card-lg">
        <p className="text-xs text-brand-muted mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name === 'revenue' ? formatPrice(entry.value) : entry.value}
            {entry.name === 'orders' && ' orders'}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: { data: AdminStats['revenueByMonth'] }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <h3 className="text-sm font-semibold text-brand-text mb-1">Revenue Overview</h3>
      <p className="text-xs text-brand-muted mb-6">Last 12 months</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6CBCE3" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6CBCE3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `£${(v / 100).toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6CBCE3"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OrdersChart({ data }: { data: AdminStats['revenueByMonth'] }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <h3 className="text-sm font-semibold text-brand-text mb-1">Orders</h3>
      <p className="text-xs text-brand-muted mb-6">Last 12 months</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="orders" fill="#6CBCE3" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DailyOrdersChart({ data }: { data: AdminStats['dailyOrders'] }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <h3 className="text-sm font-semibold text-brand-text mb-1">Daily Orders</h3>
      <p className="text-xs text-brand-muted mb-6">Last 30 days</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#3A9FD4"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3A9FD4' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function OrderStatusChart({ data }: { data: AdminStats['ordersByStatus'] }) {
  const chartData = data.map((d) => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: d.count,
  }))

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <h3 className="text-sm font-semibold text-brand-text mb-1">Orders by Status</h3>
      <p className="text-xs text-brand-muted mb-6">All time</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              borderRadius: '12px',
              color: '#1a1a2e',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopProductsChart({ data }: { data: AdminStats['topProducts'] }) {
  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <h3 className="text-sm font-semibold text-brand-text mb-1">Top Products</h3>
      <p className="text-xs text-brand-muted mb-6">By units sold</p>
      <div className="space-y-3">
        {data.map((product, i) => (
          <div key={product.name} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-blue-light flex items-center justify-center text-xs font-bold text-brand-blue shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-brand-text truncate pr-2">
                  {product.name}
                </span>
                <span className="text-sm font-bold text-brand-blue shrink-0">
                  {product.sales} sold
                </span>
              </div>
              <div className="h-1.5 bg-brand-arctic rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-blue rounded-full transition-all duration-500"
                  style={{
                    width: `${data[0] ? (product.sales / data[0].sales) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-brand-muted shrink-0 w-16 text-right">
              {formatPrice(product.revenue)}
            </span>
          </div>
        ))}

        {data.length === 0 && (
          <p className="text-sm text-brand-muted text-center py-4">No sales data yet</p>
        )}
      </div>
    </div>
  )
}

export function LowStockTable({ data }: { data: AdminStats['lowStockProducts'] }) {
  if (data.length === 0) return null

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <h3 className="text-sm font-semibold text-brand-text mb-1">Low Stock Alerts</h3>
      <p className="text-xs text-brand-muted mb-4">Products with 5 or fewer in stock</p>
      <div className="space-y-2">
        {data.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-50 border border-red-100"
          >
            <span className="text-sm font-medium text-brand-text truncate pr-2">
              {product.name}
            </span>
            <span
              className={`text-sm font-bold shrink-0 ${
                product.stock === 0 ? 'text-red-600' : 'text-orange-600'
              }`}
            >
              {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
