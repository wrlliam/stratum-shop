import { notFound } from 'next/navigation'
import Image from 'next/image'
import { db, bundles, productImages } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { AddBundleToCartButton } from '@/components/shop/AddBundleToCartButton'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/shop/ProductCard'
import type { BundleWithProducts } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BundlePage({ params }: Props) {
  const { id } = await params

  const bundle = await db.query.bundles.findFirst({
    where: eq(bundles.slug, id),
    with: {
      bundleProducts: {
        with: {
          product: { with: { images: { orderBy: asc(productImages.order) } } },
        },
      },
    },
  }) as BundleWithProducts | undefined

  if (!bundle) notFound()

  const originalTotal = bundle.bundleProducts.reduce(
    (sum, bp) => sum + bp.product.price * bp.quantity,
    0
  )
  const discountedTotal = Math.round(originalTotal * (1 - bundle.discountPercent / 100))
  const savings = originalTotal - discountedTotal

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Cover image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-brand-arctic border border-brand-border">
            {bundle.imageUrl ? (
              <Image
                src={bundle.imageUrl}
                alt={bundle.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
                {bundle.bundleProducts.slice(0, 4).map((bp) => (
                  <div key={bp.id} className="relative rounded-xl overflow-hidden bg-brand-arctic">
                    {bp.product.images[0] ? (
                      <Image
                        src={bp.product.images[0].url}
                        alt={bp.product.name}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-3xl">🖨️</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="blue">{bundle.discountPercent}% OFF</Badge>
              <Badge variant="default">{bundle.bundleProducts.length} items</Badge>
            </div>

            <h1 className="text-4xl font-bold text-brand-text mb-4">{bundle.name}</h1>

            {bundle.description && (
              <p className="text-brand-muted leading-relaxed mb-6">{bundle.description}</p>
            )}

            {/* Pricing */}
            <div className="p-6 bg-white border border-brand-border rounded-2xl mb-6 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-muted">Original price</span>
                <span className="text-brand-muted line-through">{formatPrice(originalTotal)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-blue">Bundle discount ({bundle.discountPercent}%)</span>
                <span className="text-green-600 font-semibold">-{formatPrice(savings)}</span>
              </div>
              <div className="border-t border-brand-border my-3" />
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-brand-text">Bundle price</span>
                <span className="text-2xl font-bold text-brand-blue">{formatPrice(discountedTotal)}</span>
              </div>
            </div>

            <AddBundleToCartButton bundle={bundle as BundleWithProducts} />
          </div>
        </div>

        {/* Products in bundle */}
        <div>
          <h2 className="text-2xl font-bold text-brand-text mb-6">
            What&apos;s in this bundle
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {bundle.bundleProducts.map((bp) => (
              <ProductCard key={bp.id} product={bp.product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
