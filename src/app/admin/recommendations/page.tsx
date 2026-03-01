import Image from 'next/image'
import { db, recommendations } from '@/lib/db'
import { desc } from 'drizzle-orm'
import { StatusBadge } from '@/components/ui/Badge'
import { RecommendationStatusSelect } from '@/components/admin/RecommendationStatusSelect'
import { ExternalLinkIcon } from '@radix-ui/react-icons'

export const dynamic = 'force-dynamic'

export default async function AdminRecommendationsPage() {
  const allRecs = await db.query.recommendations.findMany({
    orderBy: desc(recommendations.createdAt),
  })

  const pending = allRecs.filter((r) => r.status === 'pending').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">Print Requests</h1>
        <p className="text-brand-muted text-sm mt-1">
          {allRecs.length} total • {pending} pending review
        </p>
      </div>

      <div className="space-y-4">
        {allRecs.map((rec) => (
          <div
            key={rec.id}
            className="bg-white border border-brand-border rounded-2xl p-6 flex gap-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
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

              {rec.referenceUrl && (
                <a
                  href={rec.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:underline mt-2"
                >
                  <ExternalLinkIcon className="w-3 h-3" />
                  Reference link
                </a>
              )}
            </div>
          </div>
        ))}

        {allRecs.length === 0 && (
          <div className="text-center py-16 bg-white border border-brand-border rounded-2xl">
            <p className="text-brand-muted">No print requests yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
