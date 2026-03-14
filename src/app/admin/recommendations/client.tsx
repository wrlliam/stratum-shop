'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { StatusBadge } from '@/components/ui/Badge'
import { RecommendationStatusSelect } from '@/components/admin/RecommendationStatusSelect'
import { ExternalLinkIcon, LinkBreak2Icon } from '@radix-ui/react-icons'
import { formatPrice, cn } from '@/lib/utils'
import type { Recommendation } from '@/lib/db/schema'

const DELIVERY_OPTIONS = [
  { id: 'royal_mail_2nd', name: 'Royal Mail 2nd Class', price: 285 },
  { id: 'royal_mail_1st', name: 'Royal Mail 1st Class', price: 385 },
  { id: 'royal_mail_tracked_48', name: 'Royal Mail Tracked 48', price: 350 },
  { id: 'royal_mail_tracked_24', name: 'Royal Mail Tracked 24', price: 450 },
]

const FILTER_TABS = [
  { key: null, label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'awaiting_payment', label: 'Awaiting Payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'printing', label: 'Printing' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
] as const

interface Props {
  recommendations: Recommendation[]
}

export function RecommendationsClient({ recommendations: initialRecs }: Props) {
  const [filter, setFilter] = useState<string | null>(null)
  const [quoteOpenFor, setQuoteOpenFor] = useState<string | null>(null)

  const filtered = filter ? initialRecs.filter((r) => r.status === filter) : initialRecs

  const counts = initialRecs.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-text">Print Requests</h1>
        <p className="text-brand-muted text-sm mt-1">
          {initialRecs.length} total • {counts.pending || 0} pending • {counts.paid || 0} ready to print
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const count = tab.key ? counts[tab.key] || 0 : initialRecs.length
          return (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                filter === tab.key
                  ? 'bg-brand-blue text-white'
                  : 'bg-brand-arctic dark:bg-brand-surface text-brand-muted hover:text-brand-text'
              )}
            >
              {tab.label} ({count})
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        {filtered.map((rec) => (
          <RecCard
            key={rec.id}
            rec={rec}
            isQuoteOpen={quoteOpenFor === rec.id}
            onToggleQuote={() => setQuoteOpenFor(quoteOpenFor === rec.id ? null : rec.id)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-brand-surface border border-brand-border rounded-2xl">
            <p className="text-brand-muted">
              {filter ? `No ${filter.replace('_', ' ')} requests.` : 'No print requests yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function RecCard({
  rec,
  isQuoteOpen,
  onToggleQuote,
}: {
  rec: Recommendation
  isQuoteOpen: boolean
  onToggleQuote: () => void
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [pricePence, setPricePence] = useState(
    rec.finalPricePence ?? rec.estimatedPricePence ?? 0
  )
  const [adminNotes, setAdminNotes] = useState(rec.adminNotes || '')
  const [deliveryMethodId, setDeliveryMethodId] = useState('royal_mail_tracked_48')

  const canQuote = ['pending', 'reviewing'].includes(rec.status)

  const handleSendQuote = async () => {
    if (pricePence <= 0) {
      toast.error('Please set a price')
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/admin/recommendations/${rec.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricePence,
          adminNotes: adminNotes || undefined,
          deliveryMethodId,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send quote')
      }
      toast.success('Quote sent! Payment link emailed to customer.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send quote')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl shadow-card hover:shadow-card-hover transition-shadow">
      <div className="p-6 flex gap-5">
        {rec.imageUrl && (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-brand-arctic border border-brand-border">
            <Image src={rec.imageUrl} alt={rec.name} fill className="object-cover" sizes="80px" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-brand-text">{rec.name}</p>
              <p className="text-xs text-brand-muted mt-0.5">{rec.email}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <RecommendationStatusSelect recId={rec.id} currentStatus={rec.status} />
              <span className="text-xs text-brand-muted">
                {new Date(rec.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>

          <p className="text-sm text-brand-text mt-3 leading-relaxed line-clamp-3">
            {rec.description}
          </p>

          {/* Details row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {rec.estimatedPricePence && (
              <span className="text-xs text-brand-muted">
                Est: {formatPrice(rec.estimatedPricePence)}
              </span>
            )}
            {rec.finalPricePence && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                Final: {formatPrice(rec.finalPricePence)}
              </span>
            )}
            {rec.estimatedVolumeCm3 && (
              <span className="text-xs text-brand-muted">
                {rec.estimatedVolumeCm3} cm³
              </span>
            )}
            {rec.modelFileUrl && (
              <a
                href={rec.modelFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
              >
                <ExternalLinkIcon className="w-3 h-3" />
                Model file
              </a>
            )}
            {rec.referenceUrl && (
              <a
                href={rec.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline"
              >
                <ExternalLinkIcon className="w-3 h-3" />
                Reference
              </a>
            )}
            {rec.orderId && (
              <a
                href={`/admin/orders/${rec.orderId}`}
                className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline"
              >
                <LinkBreak2Icon className="w-3 h-3" />
                View order
              </a>
            )}
          </div>

          {/* Quote button */}
          {canQuote && (
            <button
              onClick={onToggleQuote}
              className="mt-3 px-3 py-1.5 text-xs font-semibold bg-brand-blue text-white rounded-lg hover:bg-brand-blue-dark transition-colors"
            >
              {isQuoteOpen ? 'Close Quote Panel' : 'Quote & Send Payment Link'}
            </button>
          )}
        </div>
      </div>

      {/* Quote panel */}
      {isQuoteOpen && canQuote && (
        <div className="border-t border-brand-border p-6 bg-brand-arctic/30 dark:bg-brand-arctic/5 rounded-b-2xl">
          <h3 className="text-sm font-bold text-brand-text mb-4">Send Quote & Payment Link</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">
                Price (pence)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pricePence}
                  onChange={(e) => setPricePence(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  min={1}
                />
                <span className="text-xs text-brand-muted whitespace-nowrap">
                  = {formatPrice(pricePence)}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">
                Delivery Method
              </label>
              <select
                value={deliveryMethodId}
                onChange={(e) => setDeliveryMethodId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
              >
                {DELIVERY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({formatPrice(opt.price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={1}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-blue/30 resize-none"
                placeholder="Notes visible to customer..."
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSendQuote}
              disabled={sending || pricePence <= 0}
              className="px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending…' : 'Send Quote & Payment Link'}
            </button>
            <span className="text-xs text-brand-muted">
              Customer will receive an email with a payment link
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
