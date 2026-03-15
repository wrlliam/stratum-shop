import { db, orders } from '@/lib/db'
import { desc, count, eq } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/Badge'
import { BulkOrdersTable } from '@/components/admin/BulkOrderStatusSelect'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const PER_PAGE = 25

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { page: pageStr, status: statusFilter } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10))

  const whereClause = statusFilter ? eq(orders.status, statusFilter) : undefined

  const [totalResult] = await db.select({ count: count() }).from(orders).where(whereClause)
  const total = totalResult.count
  const totalPages = Math.ceil(total / PER_PAGE)

  const allOrders = await db.query.orders.findMany({
    where: whereClause,
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

  const paidCount = statusCounts['paid'] || 0
  const preparedCount = statusCounts['prepared'] || 0

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display text-brand-text">Orders</h1>
          <p className="text-brand-muted text-sm mt-1">{total} {statusFilter ? `${statusFilter} orders` : 'total'}</p>
        </div>
      </div>

      {/* Attention cards (only when no filter) */}
      {!statusFilter && (paidCount > 0 || preparedCount > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {paidCount > 0 && (
            <Link
              href="/admin/orders?status=paid"
              className="flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 rounded-r-sm hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
            >
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{paidCount} paid</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">— ready to process</span>
            </Link>
          )}
          {preparedCount > 0 && (
            <Link
              href="/admin/orders?status=prepared"
              className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 rounded-r-sm hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
            >
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{preparedCount} prepared</span>
              <span className="text-xs text-blue-600 dark:text-blue-400">— ready to ship</span>
            </Link>
          )}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/admin/orders"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-card transition-colors ${
            !statusFilter
              ? 'bg-brand-blue text-white'
              : 'bg-brand-surface border border-brand-border hover:bg-brand-arctic'
          }`}
        >
          <span className="text-xs font-semibold">All</span>
        </Link>
        {Object.entries(statusCounts).map(([status, cnt]) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-card transition-colors ${
              statusFilter === status
                ? 'bg-brand-blue text-white'
                : 'bg-brand-surface border border-brand-border hover:bg-brand-arctic'
            }`}
          >
            {statusFilter !== status && <StatusBadge status={status} />}
            <span className={`text-xs font-semibold ${statusFilter === status ? 'text-white' : 'text-brand-text'}`}>{cnt}</span>
            {statusFilter === status && <span className="text-xs text-white/80">{status}</span>}
          </Link>
        ))}
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-sm overflow-hidden shadow-card">
        <BulkOrdersTable orders={allOrders} />
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/orders"
        searchParams={statusFilter ? { status: statusFilter } : {}}
      />
    </div>
  )
}
