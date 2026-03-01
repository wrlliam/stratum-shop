'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BackpackIcon, PlusIcon, MinusIcon, TrashIcon, ArrowRightIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export default function CartPage() {
  const { cart, removeItem, updateQuantity, clearCart } = useCart()

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 rounded-3xl bg-brand-arctic flex items-center justify-center mx-auto mb-6 border border-brand-border">
            <BackpackIcon className="w-10 h-10 text-brand-slate" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text mb-3">Your cart is empty</h1>
          <p className="text-brand-muted mb-8">
            Looks like you haven&apos;t added anything yet. Browse our collection to get started.
          </p>
          <Link href="/products">
            <Button variant="primary" size="lg">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Your Cart</h1>
            <p className="text-brand-muted mt-1">
              {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-brand-muted hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white border border-brand-border rounded-2xl shadow-card"
              >
                <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-brand-arctic border border-brand-border">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-3xl">🖨️</div>
                  )}
                  {item.isBundle && (
                    <div className="absolute bottom-0 inset-x-0 bg-brand-blue text-white text-[8px] font-bold text-center py-0.5">
                      BUNDLE
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item.slug ? (
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-semibold text-brand-text hover:text-brand-blue transition-colors"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="font-semibold text-brand-text">{item.name}</p>
                      )}
                      <p className="text-brand-blue font-bold text-sm mt-0.5">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="p-1.5 text-brand-muted hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-brand-border rounded-lg overflow-hidden bg-brand-arctic">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="p-2 text-brand-muted hover:text-brand-blue hover:bg-white transition-colors"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold text-brand-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="p-2 text-brand-muted hover:text-brand-blue hover:bg-white transition-colors"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-brand-text">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-brand-border rounded-2xl p-6 shadow-card">
              <h2 className="text-lg font-bold text-brand-text mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">
                    Subtotal ({cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''})
                  </span>
                  <span className="font-semibold text-brand-text">
                    {formatPrice(cart.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">Delivery</span>
                  <span className="text-brand-muted">Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-muted">VAT (20%)</span>
                  <span className="text-brand-muted">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-brand-border pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-text">Estimated subtotal</span>
                  <span className="text-xl font-bold text-brand-blue">
                    {formatPrice(cart.subtotal)}+
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <Button variant="primary" size="lg" fullWidth className="mb-3">
                  Proceed to Checkout
                  <ArrowRightIcon className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/products" className="block">
                <Button variant="ghost" size="md" fullWidth>
                  <ArrowLeftIcon className="w-4 h-4" />
                  Continue Shopping
                </Button>
              </Link>

              <div className="mt-4 pt-4 border-t border-brand-border">
                <p className="text-xs text-brand-muted text-center">
                  🔒 Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
