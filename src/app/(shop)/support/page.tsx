import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db, supportTickets } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Support Tickets' }

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-brand-arctic text-brand-muted border-brand-border',
}

export default async function SupportPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login?callbackUrl=/support')

  const tickets = await db.query.supportTickets.findMany({
    where: eq(supportTickets.userId, session.user.id),
    orderBy: desc(supportTickets.updatedAt),
  })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-brand-muted hover:text-brand-blue transition-colors mb-4 inline-block">
            ← Back to shop
          </Link>
          <h1 className="text-2xl font-bold text-brand-text">Support Tickets</h1>
          <p className="text-brand-muted text-sm mt-1">
            {tickets.length === 0 ? 'No tickets yet' : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/contact"
          className="px-4 py-2.5 bg-brand-blue text-white font-semibold rounded-xl text-sm hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
        >
          New Ticket
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 bg-brand-surface rounded-2xl border border-brand-border">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="font-semibold text-brand-text mb-2">No support tickets</h3>
          <p className="text-brand-muted text-sm mb-6">Need help? Open a support ticket and we'll get back to you.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-semibold rounded-xl hover:bg-brand-blue-dark transition-colors shadow-blue-sm"
          >
            Get Support →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/support/${ticket.id}`}
              className="flex items-center justify-between gap-4 bg-brand-surface border border-brand-border rounded-2xl p-5 hover:shadow-card transition-shadow group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-brand-text group-hover:text-brand-blue transition-colors truncate">
                  {ticket.subject}
                </p>
                <p className="text-xs text-brand-muted mt-1">
                  {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}updated {new Date(ticket.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${STATUS_COLORS[ticket.status] ?? ''}`}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
                <span className="text-brand-muted text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
