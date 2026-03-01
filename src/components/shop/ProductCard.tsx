'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PlusIcon } from '@radix-ui/react-icons'
import type { ProductWithImages } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/providers/CartProvider'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: ProductWithImages
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart()
  const primaryImage = product.images[0]
  const hoverImage = product.images[1]

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: primaryImage?.url,
      isBundle: false,
      slug: product.slug,
    })
  }

  return (
    <Link href={`/products/${product.slug}`} className={cn('group block', className)}>
      <div className="overflow-hidden rounded-2xl bg-white border border-brand-border transition-all duration-300 hover:shadow-card-hover hover:border-brand-blue/30">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-brand-arctic">
          {primaryImage ? (
            <>
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                fill
                className={cn(
                  'object-cover transition-all duration-500 group-hover:scale-105',
                  hoverImage && 'group-hover:opacity-0'
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {hoverImage && (
                <Image
                  src={hoverImage.url}
                  alt={hoverImage.alt || product.name}
                  fill
                  className="object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-brand-slate">
              <span className="text-5xl">🖨️</span>
            </div>
          )}

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && <Badge variant="blue" size="sm">Featured</Badge>}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Badge variant="red" size="sm">
                -{Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
              </Badge>
            )}
          </div>

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-bold text-red-500 uppercase tracking-wider bg-white/90 px-4 py-2 rounded-xl">
                Out of Stock
              </span>
            </div>
          )}

          {/* Quick add */}
          {product.stock > 0 && (
            <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-blue text-white text-xs font-bold rounded-xl hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-brand-muted uppercase tracking-wider">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-semibold text-brand-text text-sm leading-tight mb-1 group-hover:text-brand-blue transition-colors">
            {product.name}
          </h3>

          {product.shortDescription && (
            <p className="text-xs text-brand-muted mb-3 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {product.material && (
            <p className="text-[10px] text-brand-slate uppercase tracking-wider mb-2">
              {product.material}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-brand-blue">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-brand-muted line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            {product.stock === 0 ? (
              <span className="text-[10px] text-red-500 uppercase tracking-wider font-semibold">Sold out</span>
            ) : product.stock <= 5 ? (
              <span className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">
                {product.stock} left
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
