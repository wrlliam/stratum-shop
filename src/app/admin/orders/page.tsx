import { db, orders } from '@/lib/db'
import { desc, count } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/Badge'
import { BulkOrdersTable } from '@/components/admin/BulkOrderStatusSelect'
import { Pagination } from '@/components/ui/Pagination'

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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface border border-brand-border rounded-full shadow-card"
          >
            <StatusBadge status={status} />
            <span className="text-xs font-semibold text-brand-text">{cnt}</span>
          </div>
        ))}
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-card">
        <BulkOrdersTable orders={allOrders} />
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/orders" />
    </div>
  )
}
