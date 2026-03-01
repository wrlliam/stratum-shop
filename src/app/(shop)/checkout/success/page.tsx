import Link from 'next/link'
import { CheckCircledIcon, CubeIcon } from '@radix-ui/react-icons'
import { stripe } from '@/lib/stripe'
import { db, orders } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams

  let orderNumber: string | null = null
  let total: number | null = null

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)
      const orderId = session.metadata?.orderId

      if (orderId) {
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        })
        if (order) {
          orderNumber = order.orderNumber
          total = order.total
        }
      }
    } catch {}
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-brand-bg">
      <div className="max-w-md mx-auto px-4 text-center">
        {/* Success icon */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
            <CheckCircledIcon className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-brand-text mb-3">Order Confirmed!</h1>

        {orderNumber && (
          <p className="text-brand-blue font-mono text-sm mb-2">#{orderNumber}</p>
        )}

        <p className="text-brand-muted mb-4 leading-relaxed">
          Thank you for your order! We&apos;re already preparing your prints.
          A confirmation email is on its way to you.
        </p>

        {total && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-border mb-8">
            <span className="text-sm text-brand-muted">Total charged:</span>
            <span className="text-sm font-bold text-brand-blue">{formatPrice(total)}</span>
          </div>
        )}

        {/* What happens next */}
        <div className="text-left bg-white border border-brand-border rounded-2xl p-6 mb-8 shadow-card">
          <h2 className="text-sm font-bold text-brand-text mb-4 flex items-center gap-2">
            <CubeIcon className="w-4 h-4 text-brand-blue" />
            What happens next?
          </h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'We receive your order and begin printing' },
              { step: '2', text: 'Quality check before packing' },
              { step: '3', text: 'Dispatched via your chosen Royal Mail service' },
              { step: '4', text: 'Tracking info sent when available' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-blue-light border border-brand-blue/30 flex items-center justify-center text-[10px] font-bold text-brand-blue shrink-0 mt-0.5">
                  {item.step}
                </div>
                <p className="text-sm text-brand-muted">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white font-semibold rounded-xl hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
          >
            Continue Shopping →
          </Link>
          <Link
            href="/orders"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-brand-border text-brand-text font-medium rounded-xl hover:border-brand-blue hover:text-brand-blue transition-colors"
          >
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
