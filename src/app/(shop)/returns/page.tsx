import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Returns & Refunds',
  description: 'Stratum returns and refunds policy for 3D printed products.',
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-2">
          Info
        </p>
        <h1 className="text-3xl font-bold text-brand-text mb-8">Returns & Refunds</h1>

        <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed space-y-6">
          <p>
            We want you to be happy with your purchase. If something isn&apos;t right,
            we&apos;re here to help.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Defective or Damaged Items</h2>
          <p>
            If your item arrives damaged or has a print defect, please contact us within 14 days
            of receiving your order. We&apos;ll arrange a replacement or full refund — no need to
            return the item.
          </p>
          <p>
            Please include your order number and a photo of the issue when contacting us.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Change of Mind</h2>
          <p>
            Since most items are printed to order, we generally cannot accept returns for change of mind.
            However, if you contact us before your order has been printed, we can cancel it for a full refund.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Custom / Personalised Orders</h2>
          <p>
            Items with custom text, engravings, or other personalisation cannot be returned unless
            they arrive defective or different from what was ordered.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Refund Process</h2>
          <p>
            Refunds are processed to the original payment method within 5-10 business days.
            You&apos;ll receive an email confirmation once your refund has been issued.
          </p>

          <h2 className="text-lg font-bold text-brand-text mt-10 mb-4">Contact Us</h2>
          <p>
            For any returns or refund queries, please visit our{' '}
            <a href="/contact" className="text-brand-blue hover:underline">contact page</a>{' '}
            or email us with your order number and details.
          </p>
        </div>
      </div>
    </div>
  )
}
