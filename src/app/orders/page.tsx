import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, orderItems, orderMessages } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { formatPrice } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { CancelOrderButton } from '@/components/orders/CancelOrderButton'
import { CustomOrderSubmitForm } from '@/components/orders/CustomOrderSubmitForm'
import { customOrderSubmissions } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import type { Metadata } from 'next'

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000

export const metadata: Metadata = {
  title: 'My Orders',
}

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/login?callbackUrl=/orders')
  }

  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, session.user.id),
    with: {
      items: {
        with: {
          product: {
            columns: { id: true, productType: true, digitalFilePath: true, digitalFileUrl: true, customOrderFields: true },
          },
        },
      },
      messages: true,
    },
    orderBy: desc(orders.createdAt),
  })

  const DOWNLOADABLE_STATUSES = ['paid', 'processing', 'prepared', 'shipped', 'delivered']

  // Fetch existing custom order submissions for all items
  const allItemIds = userOrders.flatMap((o) => o.items.map((i) => i.id))
  const submissions = allItemIds.length
    ? await db.select().from(customOrderSubmissions).where(inArray(customOrderSubmissions.orderItemId, allItemIds))
    : []
  const submissionsByItemId = Object.fromEntries(submissions.map((s) => [s.orderItemId, s.fields as Record<string, string>]))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-brand-muted hover:text-brand-blue transition-colors mb-4 inline-block">
          ← Back to shop
        </Link>
        <h1 className="text-2xl font-display text-brand-text">My Orders</h1>
        <p className="text-brand-muted text-sm mt-1">
          {userOrders.length === 0
            ? 'You haven\'t placed any orders yet.'
            : `${userOrders.length} order${userOrders.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {userOrders.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface rounded-sm border border-brand-border">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="font-semibold text-brand-text mb-2">No orders yet</h3>
          <p className="text-brand-muted text-sm mb-6">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-semibold rounded-sm hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
          >
            Shop Now →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {userOrders.map((order) => (
            <div
              key={order.id}
              className="bg-brand-surface border border-brand-border rounded-sm p-6 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs text-brand-muted uppercase tracking-wider font-medium mb-1">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-sm text-brand-muted">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  {order.messages.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-2xs font-semibold text-brand-blue bg-brand-blue-light px-2 py-0.5 rounded-full">
                      {order.messages.length} message{order.messages.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="font-bold text-brand-text">{formatPrice(order.total)}</span>
                  {['paid', 'processing'].includes(order.status) &&
                    Date.now() - new Date(order.createdAt).getTime() < CANCEL_WINDOW_MS && (
                      <CancelOrderButton orderId={order.id} orderNumber={order.orderNumber} />
                    )}
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-brand-border pt-4">
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const isDownloadable =
                      DOWNLOADABLE_STATUSES.includes(order.status) &&
                      item.productId &&
                      (item.product?.productType === 'digital' ||
                        item.product?.productType === '3d_model') &&
                      (item.product?.digitalFilePath || item.product?.digitalFileUrl)
                    const isCustomOrder =
                      DOWNLOADABLE_STATUSES.includes(order.status) &&
                      item.productId &&
                      item.product?.productType === 'custom_order' &&
                      Array.isArray(item.product?.customOrderFields) &&
                      (item.product?.customOrderFields as unknown[]).length > 0

                    return (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-brand-text flex-1">
                            {item.name}
                            {item.quantity > 1 && (
                              <span className="text-brand-muted ml-1">× {item.quantity}</span>
                            )}
                            {item.isBundle && (
                              <span className="ml-2 text-[10px] bg-brand-blue-light text-brand-blue px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                Bundle
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isDownloadable && (
                              <a
                                href={`/api/download/${item.productId}`}
                                className="text-[11px] font-semibold text-brand-blue hover:underline"
                              >
                                ↓ Download
                              </a>
                            )}
                            <span className="text-brand-muted">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        </div>
                        {isCustomOrder && (
                          <CustomOrderSubmitForm
                            orderId={order.id}
                            itemId={item.id}
                            itemName={item.name}
                            fields={item.product!.customOrderFields as { type: 'text' | 'image' | 'number' | 'select'; label: string; required?: boolean; placeholder?: string; options?: string[] }[]}
                            existingSubmission={submissionsByItemId[item.id] ?? null}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Order summary */}
                <div className="mt-4 pt-3 border-t border-brand-border space-y-1 text-xs text-brand-muted">
                  <div className="flex justify-between">
                    <span>Delivery ({order.deliveryMethod})</span>
                    <span>{formatPrice(order.deliveryPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (20%)</span>
                    <span>{formatPrice(order.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-sm text-brand-text pt-1 border-t border-brand-border">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Tracking */}
                {order.trackingNumber && (
                  <div className="mt-3 p-3 bg-brand-blue-light rounded-sm">
                    <p className="text-xs font-semibold text-brand-blue">
                      Tracking: <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                  </div>
                )}

                {/* Messages */}
                {order.messages.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-text hover:text-brand-blue transition-colors list-none">
                      Messages
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-blue text-white text-2xs font-bold">
                        {order.messages.length}
                      </span>
                      <span className="ml-auto text-brand-muted group-open:rotate-45 transition-transform duration-200 text-lg leading-none">
                        +
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      {order.messages.map((msg) => (
                        <div key={msg.id} className="border-l-2 border-brand-blue/30 pl-3">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-brand-text">{msg.subject}</p>
                            <span className="text-2xs text-brand-muted">
                              {new Date(msg.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-brand-muted whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
