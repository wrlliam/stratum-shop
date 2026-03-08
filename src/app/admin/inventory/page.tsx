import Link from 'next/link'
import { db, products, inventoryLog, productImages } from '@/lib/db'
import { desc, asc } from 'drizzle-orm'
import { QRCodeDisplay } from '@/components/admin/QRCodeDisplay'
import { InventoryStatsCards } from '@/components/admin/InventoryStatsCards'
import { formatPrice } from '@/lib/utils'

export default async function InventoryDashboardPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const allProducts = await db.query.products.findMany({
    with: { images: { orderBy: asc(productImages.order) } },
    orderBy: asc(products.name),
  })

  const recentLogs = await db.query.inventoryLog.findMany({
    with: { product: true },
    orderBy: desc(inventoryLog.createdAt),
    limit: 20,
  })

  const totalSKUs = allProducts.length
  const totalUnits = allProducts.reduce((s, p) => s + p.stock, 0)
  const estimatedValue = allProducts.reduce((s, p) => s + p.stock * p.price, 0)
  const topByStock = [...allProducts].sort((a, b) => b.stock - a.stock).slice(0, 10)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-brand-text">Inventory</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/inventory/scan"
            className="px-4 py-2 text-sm font-medium bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors"
          >
            Scan QR
          </Link>
          <Link
            href="/admin/inventory/batches"
            className="px-4 py-2 text-sm font-medium border border-brand-border text-brand-text rounded-lg hover:bg-brand-arctic transition-colors"
          >
            Batches
          </Link>
          <Link
            href="/admin/inventory/labels"
            className="px-4 py-2 text-sm font-medium border border-brand-border text-brand-text rounded-lg hover:bg-brand-arctic transition-colors"
          >
            Print Labels
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-1">Total SKUs</p>
          <p className="text-3xl font-bold text-brand-text">{totalSKUs}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-1">Units in Stock</p>
          <p className="text-3xl font-bold text-brand-text">{totalUnits}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-card">
          <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest mb-1">Inventory Value</p>
          <p className="text-3xl font-bold text-brand-text">{formatPrice(estimatedValue)}</p>
        </div>
      </div>

      {/* Top products bar chart */}
      <InventoryStatsCards topByStock={topByStock} />

      {/* Product Stock Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card mb-8">
        <div className="p-4 border-b border-brand-border">
          <h2 className="text-sm font-bold text-brand-text">Product Stock</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Product</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Stock</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">QR</th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((product) => (
                <tr key={product.id} className="border-b border-brand-border last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-text">{product.name}</td>
                  <td className="px-4 py-3 font-bold text-brand-text">{product.stock}</td>
                  <td className="px-4 py-3">
                    {product.stock === 0 ? (
                      <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Out of stock</span>
                    ) : product.stock <= 5 ? (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Low</span>
                    ) : (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">In stock</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <QRCodeDisplay
                      value={`${appUrl}/admin/inventory/scan?product=${product.id}`}
                      size={48}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inventory Log */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card">
        <div className="p-4 border-b border-brand-border">
          <h2 className="text-sm font-bold text-brand-text">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Time</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Product</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Change</th>
                <th className="px-4 py-3 text-xs font-semibold text-brand-muted uppercase">Reason</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-brand-muted">
                    No inventory activity yet
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-brand-border last:border-0">
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {new Date(log.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-brand-text">{log.product.name}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${log.quantityChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-brand-muted bg-brand-arctic px-2 py-0.5 rounded-full">
                        {log.reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
