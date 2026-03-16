import type { Metadata } from 'next'
import { DELIVERY_OPTIONS, DELIVERY_DISCLAIMER } from '@/lib/delivery'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Stratum shipping options, delivery times, and pricing.',
}

function formatPence(pence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">
          Info
        </p>
        <h1 className="text-3xl font-bold text-brand-text mb-8">Shipping Policy</h1>

        <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed space-y-6">
          <p>
            We ship all orders via Royal Mail from the United Kingdom. Most items are printed to order,
            so please allow 1-3 business days for production before dispatch.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Delivery Options</h2>

          <div className="not-prose space-y-3">
            {DELIVERY_OPTIONS.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between p-4 bg-brand-surface border border-brand-border rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{option.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-brand-text">{option.name}</p>
                    <p className="text-xs text-brand-muted">{option.description}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-blue">from {formatPence(option.price)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-muted mt-3">
            * {DELIVERY_DISCLAIMER} Prices shown are for small parcels up to 2 kg.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Processing Time</h2>
          <p>
            Since most items are 3D printed to order, please allow 1-3 business days for production.
            Delivery times shown above begin from the date of dispatch, not the date of order.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">UK Shipping Only</h2>
          <p>
            We currently ship within the United Kingdom only. If you&apos;re outside the UK and
            interested in ordering, please contact us and we&apos;ll do our best to help.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Tracking</h2>
          <p>
            Tracked delivery options include a tracking number which will be emailed to you once
            your order has been dispatched. Standard (untracked) deliveries do not include tracking.
          </p>
        </div>
      </div>
    </div>
  )
}
