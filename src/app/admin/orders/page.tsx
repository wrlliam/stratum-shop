import { db, orders } from '@/lib/db'
import { desc, count } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PER_PAGE = 25

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10))

  const [totalResult] = await db.select({ count: count() }).from(orders)
  const total = totalResult.count
  const totalPages = Math.ceil(total / PER_PAGE)

  const allOrders = await db.query.orders.findMany({
    with: { items: true },
    orderBy: desc(orders.createdAt),
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  })

  // Status counts from all orders (separate query for accurate counts)
  const allStatuses = await db
    .select({ status: orders.status, count: count() })
    .from(orders)
    .groupBy(orders.status)
  const statusCounts = Object.fromEntries(allStatuses.map((s) => [s.status, s.count]))

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Orders</h1>
          <p className="text-brand-muted text-sm mt-1">{total} total</p>
        </div>
      </div>

      {/* Status counts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(statusCounts).map(([status, cnt]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-border rounded-full shadow-card"
          >
            <StatusBadge status={status} />
            <span className="text-xs font-semibold text-brand-text">{cnt}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-arctic">
                {['Order #', 'Customer', 'Items', 'Delivery', 'Total', 'Status', 'Date', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {allOrders.map((order) => (
                <tr key={order.id} className="hover:bg-brand-arctic transition-colors">
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs text-brand-blue font-bold">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-[160px]">
                      <p className="text-brand-text truncate text-xs">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-brand-muted">{order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-brand-muted">
                      {order.deliveryMethod.replace('royal_mail_', '').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-bold text-brand-text">
                    {formatPrice(order.total)}
                  </td>
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

              {allOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-brand-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/orders" />
    </div>
  )
}
