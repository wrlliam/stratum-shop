import Link from 'next/link'
import Image from 'next/image'
import { PlusIcon, Pencil1Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { db, products, productImages } from '@/lib/db'
import { desc, asc, count, ilike, or, and, eq, lte, type SQL } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { ToggleProductButton } from '@/components/admin/ToggleProductButton'
import { DuplicateProductButton } from '@/components/admin/DuplicateProductButton'
import { InlineStockEdit } from '@/components/admin/InlineStockEdit'
import { Pagination } from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

const PER_PAGE = 25

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'featured', label: 'Featured' },
  { value: 'low_stock', label: 'Low Stock' },
] as const

interface Props {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const { page: pageStr, q = '', status = '' } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10))

  const conditions: (SQL | undefined)[] = []
  if (q) {
    conditions.push(
      or(
        ilike(products.name, `%${q}%`),
        ilike(products.sku, `%${q}%`),
        ilike(products.slug, `%${q}%`)
      )
    )
  }
  if (status === 'active') conditions.push(eq(products.active, true))
  else if (status === 'draft') conditions.push(eq(products.active, false))
  else if (status === 'featured') conditions.push(eq(products.featured, true))
  else if (status === 'low_stock') conditions.push(lte(products.stock, 5))

  const whereClause = conditions.length > 0 ? and(...(conditions as [SQL, ...SQL[]])) : undefined

  const [totalResult] = await db
    .select({ count: count() })
    .from(products)
    .where(whereClause)
  const total = totalResult.count
  const totalPages = Math.ceil(total / PER_PAGE)

  const allProducts = await db.query.products.findMany({
    with: { images: { orderBy: asc(productImages.order) } },
    where: whereClause,
    orderBy: desc(products.createdAt),
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display text-brand-text">Products</h1>
          <p className="text-brand-muted text-sm mt-1">{total} {q || status ? 'matching' : 'total'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/labels"
            className="flex items-center gap-2 px-4 py-2.5 border border-brand-border text-brand-text font-semibold rounded-sm text-sm hover:bg-brand-arctic transition-colors"
          >
            Print QR Labels
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-sm text-sm hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
          >
            <PlusIcon className="w-4 h-4" />
            New Product
          </Link>
        </div>
      </div>

      {/* Search + filter bar */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, SKU, slug…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-brand-border rounded-sm bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(f.value ? { status: f.value } : {}) }).toString()}`}
              className={`px-3 py-2 text-xs font-semibold rounded-sm transition-colors ${
                status === f.value
                  ? 'bg-brand-blue text-white'
                  : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-semibold bg-brand-arctic border border-brand-border text-brand-text rounded-sm hover:bg-brand-border transition-colors"
        >
          Search
        </button>
        {(q || status) && (
          <Link
            href="/admin/products"
            className="text-sm text-brand-muted hover:text-brand-text transition-colors"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="bg-brand-surface border border-brand-border rounded-sm overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-arctic">
                {['Product', 'SKU', 'Price', 'Stock', 'Status', 'Tags', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {allProducts.map((product) => (
                <tr key={product.id} className="hover:bg-brand-arctic transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-sm overflow-hidden bg-brand-arctic shrink-0 border border-brand-border">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-lg">🖨️</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-brand-text">{product.name}</p>
                        <p className="text-xs text-brand-muted font-mono">{product.slug}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="text-xs font-mono text-brand-muted">{product.sku || '—'}</span>
                  </td>

                  <td className="px-4 py-4">
                    <div>
                      <span className="font-bold text-brand-blue">{formatPrice(product.price)}</span>
                      {product.compareAtPrice && (
                        <span className="text-xs text-brand-muted line-through ml-2">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <InlineStockEdit productId={product.id} stock={product.stock} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={product.active ? 'green' : 'default'} size="sm">
                        {product.active ? 'Active' : 'Draft'}
                      </Badge>
                      {product.featured && <Badge variant="blue" size="sm">Featured</Badge>}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {(product.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-brand-muted bg-brand-arctic px-1.5 py-0.5 rounded border border-brand-border"
                        >
                          {tag}
                        </span>
                      ))}
                      {(product.tags || []).length > 3 && (
                        <span className="text-[10px] text-brand-muted">
                          +{product.tags!.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-1.5 text-brand-muted hover:text-brand-blue hover:bg-brand-arctic rounded-sm transition-colors"
                        title="Edit"
                      >
                        <Pencil1Icon className="w-3.5 h-3.5" />
                      </Link>
                      <DuplicateProductButton productId={product.id} />
                      <ToggleProductButton productId={product.id} active={product.active} />
                      <DeleteProductButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}

              {allProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-brand-muted">
                    {q || status ? (
                      <>No products match your search. <Link href="/admin/products" className="text-brand-blue hover:underline">Clear filters</Link></>
                    ) : (
                      <>No products yet. <Link href="/admin/products/new" className="text-brand-blue hover:underline">Create your first product</Link></>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/admin/products"
        searchParams={{ ...(q ? { q } : {}), ...(status ? { status } : {}) }}
      />
    </div>
  )
}
