import { NextRequest, NextResponse } from 'next/server'
import { db, products, productImages, productOptionGroups, productOptionChoices } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { requireAdmin } from '@/lib/api-guard'
import { createSlug } from '@/lib/utils'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const source = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: asc(productImages.order) },
      optionGroups: {
        orderBy: asc(productOptionGroups.order),
        with: { choices: { orderBy: asc(productOptionChoices.order) } },
      },
    },
  })

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newName = `${source.name} (Copy)`
  const baseSlug = createSlug(newName)
  let newSlug = baseSlug
  let attempt = 1
  while (true) {
    const existing = await db.query.products.findFirst({ where: eq(products.slug, newSlug) })
    if (!existing) break
    newSlug = `${baseSlug}-${attempt++}`
  }

  const [newProduct] = await db
    .insert(products)
    .values({
      name: newName,
      slug: newSlug,
      active: false,
      description: source.description,
      shortDescription: source.shortDescription,
      price: source.price,
      compareAtPrice: source.compareAtPrice,
      stock: source.stock,
      tags: source.tags,
      featured: source.featured,
      weight: source.weight,
      sku: source.sku,
      material: source.material,
      color: source.color,
      printTime: source.printTime,
      productType: source.productType,
      modelUrl: source.modelUrl,
      digitalFileUrl: source.digitalFileUrl,
      digitalFilePath: source.digitalFilePath,
      customOrderFields: source.customOrderFields,
      lowStockThreshold: source.lowStockThreshold,
      lowStockAlerts: source.lowStockAlerts,
      filamentCostPence: source.filamentCostPence,
      estimatedMinutes: source.estimatedMinutes,
      filamentId: source.filamentId,
      saleEndsAt: source.saleEndsAt,
      saleStopAtStock: source.saleStopAtStock,
    })
    .returning()

  if (source.images.length > 0) {
    await db.insert(productImages).values(
      source.images.map((img, i) => ({
        productId: newProduct.id,
        url: img.url,
        alt: img.alt || '',
        order: i,
      }))
    )
  }

  for (let gi = 0; gi < source.optionGroups.length; gi++) {
    const group = source.optionGroups[gi]
    const [insertedGroup] = await db
      .insert(productOptionGroups)
      .values({ productId: newProduct.id, name: group.name, type: group.type, order: gi })
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

  return NextResponse.json({ id: newProduct.id })
}
