import { db, products, productImages } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { BundleForm } from '@/components/admin/BundleForm'

export const metadata = { title: 'New Bundle — Admin' }

export default async function NewBundlePage() {
  const availableProducts = await db.query.products.findMany({
    where: eq(products.active, true),
    with: { images: { orderBy: asc(productImages.order) } },
    orderBy: asc(products.name),
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stratum-light">New Bundle</h1>
        <p className="text-stratum-muted text-sm mt-1">
          Group products together and offer a discount.
        </p>
      </div>
      <BundleForm availableProducts={availableProducts} />
    </div>
  )
}
