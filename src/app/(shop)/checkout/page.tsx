'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowRightIcon, CheckIcon, LockClosedIcon } from '@radix-ui/react-icons'
import { useCart } from '@/components/providers/CartProvider'
import { formatPrice } from '@/lib/utils'
import { DELIVERY_OPTIONS, VAT_RATE } from '@/lib/delivery'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { AddressForm, validateAddress } from '@/components/checkout/AddressForm'
import { CouponInput } from '@/components/checkout/CouponInput'
import toast from 'react-hot-toast'
import type { DeliveryAddress } from '@/types'

const emptyAddress: DeliveryAddress = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'GB',
}

export default function CheckoutPage() {
  const { cart, clearCart, hydrated } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<string>(DELIVERY_OPTIONS[0].id)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress)
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof DeliveryAddress, string>> | null>(null)
  const [coupon, setCoupon] = useState<{ couponId: string; code: string; discountAmount: number } | null>(null)

  const deliveryOption = DELIVERY_OPTIONS.find((o) => o.id === selectedDelivery)!
  const deliveryPrice = deliveryOption.price
  const discountAmount = coupon?.discountAmount || 0
  const preTaxTotal = cart.subtotal + deliveryPrice - discountAmount
  const tax = Math.round(preTaxTotal * VAT_RATE)
  const total = preTaxTotal + tax

  const handleCheckout = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')

    const addrErrors = validateAddress(address)
    if (addrErrors) {
      setAddressErrors(addrErrors)
      return
    }
    setAddressErrors(null)

    if (cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            productId: item.productId,
            bundleId: item.bundleId,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
          })),
          deliveryMethodId: selectedDelivery,
          email,
          address,
          couponCode: coupon?.code || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(String(data.error || 'Checkout failed'))
      }

      if (data.url) {
        clearCart()
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned. Please try again.')
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err)
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hydrated && cart.items.length === 0) {
      router.replace('/cart')
    }
  }, [hydrated, cart.items.length, router])

  if (!hydrated || cart.items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-brand-bg flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-brand-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-brand-text mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left */}
          <div className="lg:col-span-3 space-y-5">
            {/* Email */}
            <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
              <h2 className="text-base font-bold text-brand-text mb-4">Contact</h2>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                hint="Order confirmation will be sent to this email"
              />
            </div>

            {/* Delivery Address */}
            <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
              <h2 className="text-base font-bold text-brand-text mb-4">Delivery Address</h2>
              <AddressForm
                address={address}
                onChange={setAddress}
                errors={addressErrors || undefined}
              />
            </div>

            {/* Delivery options */}
            <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
              <h2 className="text-base font-bold text-brand-text mb-2">Delivery</h2>
              <p className="text-xs text-brand-muted mb-5">
                All deliveries via Royal Mail.
              </p>

              <div className="space-y-3">
                {DELIVERY_OPTIONS.map((option) => {
                  const isSelected = selectedDelivery === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedDelivery(option.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200',
                        isSelected
                          ? 'border-brand-blue bg-brand-blue-light'
                          : 'border-brand-border hover:border-brand-slate bg-white'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                          isSelected
                            ? 'border-brand-blue bg-brand-blue'
                            : 'border-brand-border'
                        )}
                      >
                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>

                      <div className="text-xl">{option.icon}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-brand-text">
                            {option.name}
                          </span>
                          <span
                            className={cn(
                              'text-sm font-bold shrink-0',
                              isSelected ? 'text-brand-blue' : 'text-brand-text'
                            )}
                          >
                            {formatPrice(option.price)}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted mt-0.5">{option.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-start gap-3 p-4 bg-white border border-brand-border rounded-xl shadow-card">
              <LockClosedIcon className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-brand-text">Secure payment via Stripe</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  Your card details are collected securely by Stripe.
                  We never see your card number.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 bg-white border border-brand-border rounded-2xl p-6 shadow-card">
              <h2 className="text-base font-bold text-brand-text mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-brand-arctic shrink-0 border border-brand-border">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xl">🖨️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-text truncate">{item.name}</p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-[10px] text-brand-muted truncate">
                          {item.selectedOptions.map((o) => `${o.groupName}: ${o.choiceLabel}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-xs text-brand-muted">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-text shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-4">
                <CouponInput
                  subtotal={cart.subtotal}
                  onApply={(c) => setCoupon(c)}
                  onRemove={() => setCoupon(null)}
                  applied={coupon}
                />
              </div>

              <div className="border-t border-brand-border pt-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Subtotal</span>
                  <span className="text-brand-text">{formatPrice(cart.subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount ({coupon?.code})</span>
                    <span className="text-green-600">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">Delivery ({deliveryOption.name})</span>
                  <span className="text-brand-text">{formatPrice(deliveryPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-muted">VAT (20%)</span>
                  <span className="text-brand-text">{formatPrice(tax)}</span>
                </div>
              </div>

              <div className="border-t border-brand-border pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-bold text-brand-text">Total</span>
                  <span className="text-xl font-bold text-brand-blue">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onClick={handleCheckout}
              >
                Pay {formatPrice(total)}
                <ArrowRightIcon className="w-4 h-4" />
              </Button>

              <p className="text-xs text-brand-muted text-center mt-3">
                Prices include 20% UK VAT
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
