import { NextResponse } from 'next/server'
import { db, products } from '@/lib/db'
import { eq, and, isNull, sql } from 'drizzle-orm'

export async function GET() {
  try {
    // Get distinct materials from active products
    const materialsResult = await db
      .selectDistinct({ material: products.material })
      .from(products)
      .where(and(eq(products.active, true), isNull(products.deletedAt)))

    const materials = materialsResult
      .map((r) => r.material)
      .filter((m): m is string => !!m)
      .sort()

    // Get all tags from active products
    const tagsResult = await db
      .select({ tags: products.tags })
      .from(products)
      .where(and(eq(products.active, true), isNull(products.deletedAt)))

    const tagSet = new Set<string>()
    for (const row of tagsResult) {
      if (row.tags) {
        for (const tag of row.tags) {
          tagSet.add(tag)
        }
      }
    }
    const tags = Array.from(tagSet).sort()

    // Get price range
    const priceResult = await db
      .select({
        min: sql<number>`COALESCE(MIN(${products.price}), 0)`,
        max: sql<number>`COALESCE(MAX(${products.price}), 0)`,
      })
      .from(products)
      .where(and(eq(products.active, true), isNull(products.deletedAt)))

    return NextResponse.json({
      materials,
      tags,
      priceRange: {
        min: Number(priceResult[0].min),
        max: Number(priceResult[0].max),
      },
    })
  } catch (error) {
    console.error('Filters fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 })
  }
}
