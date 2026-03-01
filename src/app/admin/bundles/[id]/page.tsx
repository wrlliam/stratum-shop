import { notFound } from 'next/navigation'
import { db, bundles, products, productImages } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { BundleForm } from '@/components/admin/BundleForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBundlePage({ params }: Props) {
  const { id } = await params

  const [bundle, availableProducts] = await Promise.all([
    db.query.bundles.findFirst({
      where: eq(bundles.id, id),
      with: { bundleProducts: true },
    }),
    db.query.products.findMany({
      where: eq(products.active, true),
      with: { images: { orderBy: asc(productImages.order) } },
      orderBy: asc(products.name),
    }),
  ])

  if (!bundle) notFound()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stratum-light">Edit Bundle</h1>
        <p className="text-stratum-muted text-sm mt-1 font-mono">{bundle.slug}</p>
      </div>
      <BundleForm
        availableProducts={availableProducts}
        bundle={{
          id: bundle.id,
          name: bundle.name,
          description: bundle.description,
          discountPercent: bundle.discountPercent,
          active: bundle.active,
          productIds: bundle.bundleProducts.map((bp) => bp.productId),
        }}
      />
    </div>
  )
}
