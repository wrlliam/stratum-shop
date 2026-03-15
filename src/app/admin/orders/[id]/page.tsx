import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { db, orders, customOrderSubmissions } from '@/lib/db'
import { eq, inArray } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'
import { PrintLabelButton } from '@/components/admin/PrintLabelButton'
import { NextStepBar } from '@/components/admin/NextStepBar'
import { TrackingForm } from '@/components/admin/TrackingForm'
import { MessageForm } from '@/components/admin/MessageForm'
import { RefundButton } from '@/components/admin/RefundButton'
import { ResendConfirmationButton } from '@/components/admin/ResendConfirmationButton'
import { PrintOrderBarcodeButton } from '@/components/admin/PrintOrderBarcodeButton'
import { SubmissionFields } from '@/components/admin/SubmissionFields'
import { getDeliveryOption } from '@/lib/stripe'
import type { DeliveryAddress } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: {
      items: {
        with: {
          product: { columns: { productType: true, customOrderFields: true } },
        },
      },
      messages: true,
    },
  })

  if (!order) notFound()

  const itemIds = order.items.map((i) => i.id)
  const submissions = itemIds.length
    ? await db.select().from(customOrderSubmissions).where(inArray(customOrderSubmissions.orderItemId, itemIds))
    : []
  const submissionsByItemId = Object.fromEntries(submissions.map((s) => [s.orderItemId, s.fields as Record<string, string>]))

  const deliveryOption = getDeliveryOption(order.deliveryMethod)
  const address = order.deliveryAddress as DeliveryAddress | null

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/orders"
          className="p-2 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display text-brand-text">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-brand-muted text-sm mt-0.5">{order.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <PrintOrderBarcodeButton orderId={order.id} orderNumber={order.orderNumber} />
          <ResendConfirmationButton orderId={order.id} />
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
          <RefundButton orderId={order.id} orderStatus={order.status} />
        </div>
      </div>

      <NextStepBar
        orderId={order.id}
        currentStatus={order.status}
        hasTrackingNumber={!!order.trackingNumber}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Order Items</h2>

            <div className="space-y-4">
              {order.items.map((item) => {
                const sub = submissionsByItemId[item.id]
                const fields = (item.product?.customOrderFields ?? []) as { type: string; label: string }[]
                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-sm overflow-hidden bg-brand-arctic shrink-0 border border-brand-border">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-xl">🖨️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-text">{item.name}</p>
                        {item.isBundle && (
                          <span className="text-[10px] text-brand-blue uppercase tracking-wider font-semibold">Bundle</span>
                        )}
                        {(() => {
                          const opts = item.selectedOptions as { groupName: string; choiceLabel: string }[] | null
                          return opts && Array.isArray(opts) && opts.length > 0 ? (
                            <p className="text-xs text-brand-muted mt-0.5">
                              {opts.map((o) => `${o.groupName}: ${o.choiceLabel}`).join(' · ')}
                            </p>
                          ) : null
                        })()}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand-text">{formatPrice(item.price * item.quantity)}</p>
                        <p className="text-xs text-brand-muted">
                          {formatPrice(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    {sub && <SubmissionFields fields={fields} submission={sub} />}
                  </div>
                )
              })}
            </div>
          </div>

          {address && (
            <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-brand-text">Delivery Address</h2>
                <PrintLabelButton
                  orderNumber={order.orderNumber}
                  deliveryMethod={order.deliveryMethod}
                  address={address}
                  meta={{
                    orderDate: new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                    itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
                    total: formatPrice(order.total),
                  }}
                />
              </div>
              <div className="text-sm text-brand-text space-y-0.5">
                <p className="font-semibold">{address.name}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>{address.city}</p>
                {address.county && <p>{address.county}</p>}
                <p className="font-mono">{address.postcode}</p>
              </div>
            </div>
          )}

          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Tracking</h2>
            <TrackingForm orderId={order.id} initialTrackingNumber={order.trackingNumber} />
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">
              Messages
              {order.messages.length > 0 && (
                <span className="ml-2 text-xs font-medium text-brand-muted">
                  ({order.messages.length})
                </span>
              )}
            </h2>
            <MessageForm orderId={order.id} messages={order.messages} />
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-muted">Subtotal</span>
                <span className="text-brand-text">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-600">
                    Discount {order.couponCode && `(${order.couponCode})`}
                  </span>
                  <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-muted">
                  Delivery ({deliveryOption?.name || order.deliveryMethod})
                </span>
                <span className="text-brand-text">{formatPrice(order.deliveryPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">VAT (20%)</span>
                <span className="text-brand-text">{formatPrice(order.taxAmount)}</span>
              </div>
              <div className="border-t border-brand-border pt-2 flex justify-between font-bold">
                <span className="text-brand-text">Total</span>
                <span className="text-brand-blue text-lg">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-sm p-6 shadow-card">
            <h2 className="text-sm font-bold text-brand-text mb-3">Details</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-brand-muted">Order date</span>
                <span className="text-brand-text">
                  {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {order.stripePaymentIntentId && (
                <div>
                  <span className="text-brand-muted block mb-0.5">Stripe PI</span>
                  <span className="text-brand-text font-mono text-[10px] break-all">
                    {order.stripePaymentIntentId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
