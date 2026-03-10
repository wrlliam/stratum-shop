import { NextRequest, NextResponse } from 'next/server'
import { db, bundles, bundleProducts, productImages } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { z } from 'zod'

const updateBundleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
  imageUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  productIds: z.array(z.string().uuid()).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const bundle = await db.query.bundles.findFirst({
      where: eq(bundles.id, id),
      with: {
        bundleProducts: {
          with: {
            product: { with: { images: { orderBy: asc(productImages.order) } } },
          },
        },
      },
    })

    if (!bundle) {
      const bySlug = await db.query.bundles.findFirst({
        where: eq(bundles.slug, id),
        with: {
          bundleProducts: {
            with: {
              product: { with: { images: { orderBy: asc(productImages.order) } } },
            },
          },
        },
      })
      if (!bySlug) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(bySlug)
    }

    return NextResponse.json(bundle)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    const body = await request.json()
    const data = updateBundleSchema.parse(body)
    const { productIds, ...rest } = data

    if (Object.keys(rest).length > 0) {
      await db.update(bundles).set({ ...rest, updatedAt: new Date() }).where(eq(bundles.id, id))
    }

    if (productIds) {
      await db.delete(bundleProducts).where(eq(bundleProducts.bundleId, id))
      if (productIds.length > 0) {
        await db.insert(bundleProducts).values(
          productIds.map((productId) => ({ bundleId: id, productId }))
        )
      }
    }

    const updated = await db.query.bundles.findFirst({
      where: eq(bundles.id, id),
      with: {
        bundleProducts: { with: { product: { with: { images: true } } } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    await db.delete(bundles).where(eq(bundles.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 })
  }
}
