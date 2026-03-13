import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db, products, productImages, productOptionGroups, productOptionChoices } from '@/lib/db'
import { eq, asc, ne, and, isNull } from 'drizzle-orm'
import { ProductCarousel } from '@/components/shop/ProductCarousel'
import { ProductCard } from '@/components/shop/ProductCard'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { formatPrice, isSaleActive } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { CubeIcon, LightningBoltIcon, LockClosedIcon, StackIcon } from '@radix-ui/react-icons'
import { ProductViewTracker } from '@/components/shop/ProductViewTracker'
import { RecentlyViewed } from '@/components/shop/RecentlyViewed'
import type { ProductWithImagesAndOptions } from '@/types'
import { ModelViewerClient } from '@/components/shop/ModelViewerClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { images: { orderBy: asc(productImages.order), limit: 1 } },
  })

  if (!product) return {}

  const description = product.shortDescription || product.description || undefined
  const priceStr = formatPrice(product.price)
  const descWithPrice = description ? `${description} — ${priceStr}` : `${product.name} — ${priceStr}`
  const imageUrl = product.images?.[0]?.url

  return {
    title: product.name,
    description: descWithPrice,
    keywords: product.tags,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: product.name,
      description: descWithPrice,
      type: 'website',
      ...(imageUrl && { images: [{ url: imageUrl, alt: product.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: descWithPrice,
      ...(imageUrl && { images: [imageUrl] }),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.active, true), isNull(products.deletedAt)),
    with: {
      images: { orderBy: asc(productImages.order) },
      optionGroups: {
        orderBy: asc(productOptionGroups.order),
        with: { choices: { orderBy: asc(productOptionChoices.order) } },
      },
    },
  })

  if (!product) notFound()

  // Related products
  const related = await db.query.products.findMany({
    where: and(eq(products.active, true), ne(products.id, product.id), isNull(products.deletedAt)),
    with: { images: { orderBy: asc(productImages.order) } },
    limit: 4,
  })

  const isOnSale = isSaleActive(product)
  const discountPercent = isOnSale && product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null
  const hasOptionModifiers = product.optionGroups?.some((g) =>
    g.choices.some((c) => c.priceModifier > 0)
  )

  const allImageUrls = product.images.map((img) => img.url)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description || product.name,
    image: allImageUrls,
    ...(product.sku && { sku: product.sku }),
    brand: { '@type': 'Brand', name: 'Stratum' },
    ...(product.material && { material: product.material }),
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: 'GBP',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${slug}`,
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/` },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products` },
      { '@type': 'ListItem', position: 3, name: product.name },
    ],
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductViewTracker slug={slug} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-brand-muted mb-8">
          <a href="/" className="hover:text-brand-blue transition-colors">Home</a>
          <span>/</span>
          <a href="/products" className="hover:text-brand-blue transition-colors">Products</a>
          <span>/</span>
          <span className="text-brand-text">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
          {/* Images / 3D viewer */}
          <div className="space-y-4">
            <ProductCarousel images={product.images} productName={product.name} />
            {(product as { modelUrl?: string | null }).modelUrl && (
              <ModelViewerClient url={(product as { modelUrl: string }).modelUrl} />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-3xl sm:text-4xl font-bold text-brand-text leading-tight mb-3">
              {product.name}
            </h1>

            {product.shortDescription && (
              <p className="text-brand-muted mb-6 leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Price */}
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold text-brand-blue">
                {hasOptionModifiers && <span className="text-lg font-medium text-brand-muted mr-1">From</span>}
                {formatPrice(product.price)}
              </span>
              {isOnSale && (
                <>
                  <span className="text-xl text-brand-muted line-through mb-1">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                  <Badge variant="red" size="sm">
                    -{discountPercent}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Sale urgency */}
            {isOnSale && product.saleEndsAt && (
              <p className="text-xs text-amber-600 font-medium mb-2">
                Sale ends {new Date(product.saleEndsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}

            {/* Stock */}
            <div className="mb-6">
              {product.stock === 0 ? (
                <span className="text-sm text-red-500 font-medium">Out of stock</span>
              ) : product.stock <= 5 ? (
                <span className="text-sm text-amber-600 font-medium">
                  Only {product.stock} left in stock
                </span>
              ) : (
                <span className="text-sm text-green-600 font-medium">In stock</span>
              )}
            </div>

            {/* Add to cart */}
            <AddToCartButton product={product as ProductWithImagesAndOptions} />

            {/* Custom order notice */}
            {(product as { productType?: string }).productType === 'custom_order' && (
              <div className="mt-3 flex items-start gap-2.5 p-3.5 bg-brand-arctic border border-brand-border rounded-xl">
                <CubeIcon className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <p className="text-xs text-brand-muted leading-relaxed">
                  This is a <span className="font-semibold text-brand-text">custom order</span>. After purchasing, visit{' '}
                  <a href="/orders" className="text-brand-blue hover:underline font-medium">My Orders</a>{' '}
                  to submit your customisation details.
                </p>
              </div>
            )}

            {/* Specs */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {product.material && (
                <div className="flex items-center gap-2.5 p-3 bg-brand-surface border border-brand-border rounded-xl">
                  <StackIcon className="w-4 h-4 text-brand-blue shrink-0" />
                  <div>
                    <p className="text-[10px] text-brand-muted uppercase tracking-wider">Material</p>
                    <p className="text-sm font-medium text-brand-text">{product.material}</p>
                  </div>
                </div>
              )}
              {product.color && (
                <div className="flex items-center gap-2.5 p-3 bg-brand-surface border border-brand-border rounded-xl">
                  <div
                    className="w-4 h-4 rounded-full border border-brand-border shrink-0"
                    style={{ backgroundColor: product.color }}
                  />
                  <div>
                    <p className="text-[10px] text-brand-muted uppercase tracking-wider">Color</p>
                    <p className="text-sm font-medium text-brand-text">{product.color}</p>
                  </div>
                </div>
              )}
              {product.printTime && (
                <div className="flex items-center gap-2.5 p-3 bg-brand-surface border border-brand-border rounded-xl">
                  <LightningBoltIcon className="w-4 h-4 text-brand-blue shrink-0" />
                  <div>
                    <p className="text-[10px] text-brand-muted uppercase tracking-wider">Print Time</p>
                    <p className="text-sm font-medium text-brand-text">
                      {product.printTime < 60
                        ? `${product.printTime}m`
                        : `${Math.floor(product.printTime / 60)}h ${product.printTime % 60}m`}
                    </p>
                  </div>
                </div>
              )}
              {product.weight && (
                <div className="flex items-center gap-2.5 p-3 bg-brand-surface border border-brand-border rounded-xl">
                  <CubeIcon className="w-4 h-4 text-brand-blue shrink-0" />
                  <div>
                    <p className="text-[10px] text-brand-muted uppercase tracking-wider">Weight</p>
                    <p className="text-sm font-medium text-brand-text">{product.weight}g</p>
                  </div>
                </div>
              )}
            </div>

            {/* Guarantees */}
            <div className="mt-6 flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-xl">
              <LockClosedIcon className="w-4 h-4 text-brand-blue shrink-0" />
              <p className="text-xs text-brand-muted leading-relaxed">
                Printed to order with quality filament. If you&apos;re not happy,{' '}
                <span className="text-brand-text">contact us for a resolution.</span>
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8 border-t border-brand-border pt-8">
                <h2 className="text-lg font-bold text-brand-text mb-4">About this print</h2>
                <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24">
            <h2 className="text-2xl font-bold text-brand-text mb-8">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        <RecentlyViewed excludeSlug={slug} />
      </div>
    </div>
  )
}
