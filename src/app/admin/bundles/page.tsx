import Link from 'next/link'
import { PlusIcon, Pencil1Icon } from '@radix-ui/react-icons'
import { db, bundles, productImages } from '@/lib/db'
import { desc, asc } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { DeleteBundleButton } from '@/components/admin/DeleteBundleButton'

export const dynamic = 'force-dynamic'

export default async function AdminBundlesPage() {
  const allBundles = await db.query.bundles.findMany({
    with: {
      bundleProducts: {
        with: { product: { with: { images: { orderBy: asc(productImages.order) } } } },
      },
    },
    orderBy: desc(bundles.createdAt),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Bundles</h1>
          <p className="text-brand-muted text-sm mt-1">{allBundles.length} total</p>
        </div>
        <Link
          href="/admin/bundles/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl text-sm hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New Bundle
        </Link>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-arctic">
                {['Bundle', 'Products', 'Discount', 'Bundle Price', 'Status', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-brand-muted uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {allBundles.map((bundle) => {
                const originalTotal = bundle.bundleProducts.reduce(
                  (sum, bp) => sum + bp.product.price * bp.quantity,
                  0
                )
                const discountedTotal = Math.round(
                  originalTotal * (1 - bundle.discountPercent / 100)
                )

                return (
                  <tr key={bundle.id} className="hover:bg-brand-arctic transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-brand-text">{bundle.name}</p>
                        <p className="text-xs text-brand-muted font-mono">{bundle.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-brand-muted">
                      {bundle.bundleProducts.length} items
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="blue" size="sm">
                        {bundle.discountPercent}% off
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-bold text-brand-blue">
                          {formatPrice(discountedTotal)}
                        </span>
                        <span className="text-xs text-brand-muted line-through ml-2">
                          {formatPrice(originalTotal)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={bundle.active ? 'green' : 'default'} size="sm">
                        {bundle.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/bundles/${bundle.id}`}
                          className="p-1.5 text-brand-muted hover:text-brand-blue hover:bg-brand-arctic rounded-lg transition-colors"
                        >
                          <Pencil1Icon className="w-3.5 h-3.5" />
                        </Link>
                        <DeleteBundleButton bundleId={bundle.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}

              {allBundles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-brand-muted">
                    No bundles yet.{' '}
                    <Link href="/admin/bundles/new" className="text-brand-blue hover:underline">
                      Create your first bundle
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
