'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/providers/CartProvider'
import { Button } from '@/components/ui/Button'
import type { BundleWithProducts } from '@/types'

interface Props {
  bundle: BundleWithProducts
}

export function AddBundleToCartButton({ bundle }: Props) {
  const { addItem } = useCart()

  const originalTotal = bundle.bundleProducts.reduce(
    (sum, bp) => sum + bp.product.price * bp.quantity,
    0
  )
  const discountedTotal = Math.round(originalTotal * (1 - bundle.discountPercent / 100))

  const handleAdd = () => {
    addItem({
      bundleId: bundle.id,
      name: bundle.name,
      price: discountedTotal,
      quantity: 1,
      imageUrl:
        bundle.imageUrl || bundle.bundleProducts[0]?.product.images[0]?.url,
      isBundle: true,
    })
  }

  return (
    <Button variant="primary" size="lg" fullWidth onClick={handleAdd} className="group">
      <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
      Add Bundle to Cart
    </Button>
  )
}
