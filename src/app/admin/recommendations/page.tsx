import { db, recommendations } from '@/lib/db'
import { desc } from 'drizzle-orm'
import { RecommendationsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function AdminRecommendationsPage() {
  const allRecs = await db.query.recommendations.findMany({
    orderBy: desc(recommendations.createdAt),
  })

  return <RecommendationsClient recommendations={allRecs} />
}
