'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BackpackIcon,
  Cross1Icon,
  PlusIcon,
  MinusIcon,
  ArrowRightIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function CartDrawer() {
  const { cart, isOpen, closeCart, removeItem, updateQuantity } = useCart()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-text/20 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md z-50 bg-brand-surface border-l border-brand-border flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <div className="flex items-center gap-3">
            <BackpackIcon className="w-5 h-5 text-brand-blue" />
            <h2 className="font-bold text-brand-text text-lg">Your Cart</h2>
            {cart.itemCount > 0 && (
              <span className="bg-brand-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cart.itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
          >
            <Cross1Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-brand-arctic flex items-center justify-center mb-4">
                <BackpackIcon className="w-8 h-8 text-brand-slate" />
              </div>
              <h3 className="font-semibold text-brand-text mb-2">Your cart is empty</h3>
              <p className="text-sm text-brand-muted mb-6">
                Add some prints to get started
              </p>
              <Button variant="outline" size="sm" onClick={closeCart}>
                <ArrowRightIcon className="w-3.5 h-3.5" />
                Browse Products
              </Button>
            </div>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-lg bg-brand-arctic border border-brand-border"
              >
                {/* Image */}
                <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-brand-arctic border border-brand-border">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-2xl">🖨️</div>
                  )}
                  {item.isBundle && (
                    <div className="absolute top-0 left-0 right-0 bg-brand-blue text-white text-[8px] font-bold text-center py-0.5">
                      BUNDLE
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">{item.name}</p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[11px] text-brand-muted mt-0.5 truncate">
                      {item.selectedOptions.map((o) => `${o.groupName}: ${o.choiceLabel}`).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-brand-blue font-bold mt-0.5">
                    {formatPrice(item.price)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-6 h-6 rounded-md bg-brand-arctic border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-blue hover:border-brand-blue transition-colors"
                    >
                      <MinusIcon className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-sm font-semibold text-brand-text w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-6 h-6 rounded-md bg-brand-arctic border border-brand-border flex items-center justify-center text-brand-muted hover:text-brand-blue hover:border-brand-blue transition-colors"
                    >
                      <PlusIcon className="w-2.5 h-2.5" />
                    </button>

                    <span className="ml-auto text-sm font-bold text-brand-text">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="p-1 text-brand-muted hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="p-5 border-t border-brand-border space-y-3 bg-brand-arctic">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-muted">Subtotal</span>
              <span className="font-bold text-brand-text">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="text-xs text-brand-muted">
              Delivery and VAT calculated at checkout
            </p>

            <Link href="/checkout" onClick={closeCart} className="block">
              <Button variant="primary" fullWidth size="lg">
                Checkout
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/cart" onClick={closeCart} className="block">
              <Button variant="ghost" fullWidth size="sm">
                View full cart
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
