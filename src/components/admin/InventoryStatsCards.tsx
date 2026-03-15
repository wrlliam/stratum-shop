'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ProductStockItem {
  id: string
  name: string
  stock: number
}

interface Props {
  topByStock: ProductStockItem[]
}

export function InventoryStatsCards({ topByStock }: Props) {
  if (topByStock.length === 0) return null

  const data = topByStock.map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    stock: p.stock,
  }))

  return (
    <div className="bg-brand-surface border border-brand-border rounded-sm p-5 shadow-card mb-8">
      <h2 className="text-sm font-bold text-brand-text mb-4">Top Products by Stock</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(v: number) => [v, 'Stock']}
          />
          <Bar dataKey="stock" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
