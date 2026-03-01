import { NextRequest, NextResponse } from 'next/server'
import { db, bundles, bundleProducts, products, productImages } from '@/lib/db'
import { eq, desc, asc, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createSlug } from '@/lib/utils'
import { z } from 'zod'

const createBundleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  discountPercent: z.number().int().min(0).max(100).default(0),
  imageUrl: z.string().optional(),
  active: z.boolean().default(true),
  productIds: z.array(z.string()).min(2, 'A bundle needs at least 2 products'),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminView = searchParams.get('admin') === 'true'

  try {
    const session = adminView
      ? await auth.api.getSession({ headers: await headers() })
      : null
    const isAdmin = session?.user?.role === 'admin'

    const rows = await db.query.bundles.findMany({
      where: isAdmin ? undefined : eq(bundles.active, true),
      with: {
        bundleProducts: {
          with: {
            product: {
              with: { images: { orderBy: asc(productImages.order) } },
            },
          },
        },
      },
      orderBy: desc(bundles.createdAt),
    })

    return NextResponse.json(rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createBundleSchema.parse(body)

    const slug = createSlug(data.name)

    const [bundle] = await db
      .insert(bundles)
      .values({
        name: data.name,
        slug,
        description: data.description,
        discountPercent: data.discountPercent,
        imageUrl: data.imageUrl,
        active: data.active,
      })
      .returning()

    await db.insert(bundleProducts).values(
      data.productIds.map((productId) => ({
        bundleId: bundle.id,
        productId,
      }))
    )

    const created = await db.query.bundles.findFirst({
      where: eq(bundles.id, bundle.id),
      with: {
        bundleProducts: {
          with: {
            product: { with: { images: true } },
          },
        },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
