import { NextRequest, NextResponse } from 'next/server'
import { db, products, productImages, productOptionGroups, productOptionChoices } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { z } from 'zod'

const optionChoiceSchema = z.object({
  label: z.string().min(1),
  priceModifier: z.number().int().default(0),
})

const optionGroupSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['select', 'boolean', 'text']).default('select'),
  choices: z.array(optionChoiceSchema).min(1),
})

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().int().positive().optional(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  weight: z.number().int().nullable().optional(),
  material: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  printTime: z.number().int().nullable().optional(),
  sku: z.string().nullable().optional(),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).optional(),
  optionGroups: z.array(optionGroupSchema).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const withClause = {
      images: { orderBy: asc(productImages.order) },
      optionGroups: {
        orderBy: asc(productOptionGroups.order),
        with: { choices: { orderBy: asc(productOptionChoices.order) } },
      },
    } as const

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: withClause,
    })

    if (!product) {
      // Try by slug
      const bySlug = await db.query.products.findFirst({
        where: eq(products.slug, id),
        with: withClause,
      })
      if (!bySlug) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(bySlug)
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await request.json()
    const data = updateProductSchema.parse(body)

    const { images, optionGroups, ...rest } = data

    if (Object.keys(rest).length > 0) {
      await db
        .update(products)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(products.id, id))
    }

    if (images !== undefined) {
      await db.delete(productImages).where(eq(productImages.productId, id))
      if (images.length > 0) {
        await db.insert(productImages).values(
          images.map((img, i) => ({
            productId: id,
            url: img.url,
            alt: img.alt || '',
            order: i,
          }))
        )
      }
    }

    if (optionGroups !== undefined) {
      // Delete existing groups (cascade deletes choices)
      await db.delete(productOptionGroups).where(eq(productOptionGroups.productId, id))
      // Re-insert
      for (let gi = 0; gi < optionGroups.length; gi++) {
        const group = optionGroups[gi]
        const [insertedGroup] = await db
          .insert(productOptionGroups)
          .values({ productId: id, name: group.name, type: group.type, order: gi })
          .returning()
        if (group.choices.length > 0) {
          await db.insert(productOptionChoices).values(
            group.choices.map((c, ci) => ({
              groupId: insertedGroup.id,
              label: c.label,
              priceModifier: c.priceModifier,
              order: ci,
            }))
          )
        }
      }
    }

    const updated = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        images: { orderBy: asc(productImages.order) },
        optionGroups: {
          orderBy: asc(productOptionGroups.order),
          with: { choices: { orderBy: asc(productOptionChoices.order) } },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    await db.delete(products).where(eq(products.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
