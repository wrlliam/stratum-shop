import Link from 'next/link'
import Image from 'next/image'
import { PlusIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { db, products, productImages } from '@/lib/db'
import { desc, asc, count } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { ToggleProductButton } from '@/components/admin/ToggleProductButton'
import { Pagination } from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

const PER_PAGE = 25

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, parseInt(pageStr || '1', 10))

  const [totalResult] = await db.select({ count: count() }).from(products)
  const total = totalResult.count
  const totalPages = Math.ceil(total / PER_PAGE)

  const allProducts = await db.query.products.findMany({
    with: { images: { orderBy: asc(productImages.order) } },
    orderBy: desc(products.createdAt),
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Products</h1>
          <p className="text-brand-muted text-sm mt-1">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/labels"
            className="flex items-center gap-2 px-4 py-2.5 border border-brand-border text-brand-text font-semibold rounded-xl text-sm hover:bg-brand-arctic transition-colors"
          >
            Print QR Labels
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl text-sm hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
          >
            <PlusIcon className="w-4 h-4" />
            New Product
          </Link>
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-arctic">
                {['Product', 'Price', 'Stock', 'Status', 'Tags', 'Actions'].map((col) => (
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
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-brand-arctic shrink-0 border border-brand-border">
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
                    <span
                      className={`text-sm font-semibold ${
                        product.stock === 0
                          ? 'text-red-500'
                          : product.stock <= 5
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}
                    >
                      {product.stock}
                    </span>
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
                        className="p-1.5 text-brand-muted hover:text-brand-blue hover:bg-brand-arctic rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil1Icon className="w-3.5 h-3.5" />
                      </Link>
                      <ToggleProductButton productId={product.id} active={product.active} />
                      <DeleteProductButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}

              {allProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-muted">
                    No products yet.{' '}
                    <Link href="/admin/products/new" className="text-brand-blue hover:underline">
                      Create your first product
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/products" />
    </div>
  )
}
