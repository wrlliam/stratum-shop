'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PlusIcon } from '@radix-ui/react-icons'
import type { BundleWithProducts } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/providers/CartProvider'
import { Badge } from '@/components/ui/Badge'

interface BundleCardProps {
  bundle: BundleWithProducts
}

export function BundleCard({ bundle }: BundleCardProps) {
  const { addItem } = useCart()

  const originalTotal = bundle.bundleProducts.reduce(
    (sum, bp) => sum + bp.product.price * bp.quantity,
    0
  )
  const discountedTotal = Math.round(originalTotal * (1 - bundle.discountPercent / 100))
  const savings = originalTotal - discountedTotal

  const coverImage = bundle.imageUrl || bundle.bundleProducts[0]?.product.images[0]?.url

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      bundleId: bundle.id,
      name: bundle.name,
      price: discountedTotal,
      quantity: 1,
      imageUrl: coverImage,
      isBundle: true,
    })
  }

  return (
    <Link href={`/bundles/${bundle.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl bg-brand-surface border border-brand-border transition-all duration-300 hover:shadow-card-hover hover:border-brand-blue/30">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-arctic">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={bundle.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">📦</div>
          )}

          {/* Product thumbnails */}
          <div className="absolute bottom-3 right-3 flex gap-1">
            {bundle.bundleProducts.slice(0, 3).map((bp, i) => (
              <div
                key={bp.id}
                className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-brand-arctic shadow-card"
                style={{ zIndex: 3 - i }}
              >
                {bp.product.images[0] ? (
                  <Image
                    src={bp.product.images[0].url}
                    alt={bp.product.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs">🖨️</div>
                )}
              </div>
            ))}
            {bundle.bundleProducts.length > 3 && (
              <div className="w-10 h-10 rounded-lg bg-brand-surface border-2 border-white shadow-card flex items-center justify-center text-xs font-bold text-brand-text">
                +{bundle.bundleProducts.length - 3}
              </div>
            )}
          </div>

          {/* Discount badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="blue">{bundle.discountPercent}% OFF</Badge>
          </div>

          {/* Add to cart overlay */}
          <div className="absolute inset-x-3 bottom-14 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Bundle to Cart
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-brand-text text-base mb-1 group-hover:text-brand-blue transition-colors">
            {bundle.name}
          </h3>

          {bundle.description && (
            <p className="text-xs text-brand-muted mb-3 line-clamp-2">{bundle.description}</p>
          )}

          <p className="text-xs text-brand-muted mb-3">
            {bundle.bundleProducts.length} items included
          </p>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-black text-brand-blue">
                {formatPrice(discountedTotal)}
              </div>
              <div className="text-xs text-brand-muted line-through">
                {formatPrice(originalTotal)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-green-600 font-semibold">
                Save {formatPrice(savings)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
