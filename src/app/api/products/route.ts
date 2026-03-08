import { NextRequest, NextResponse } from 'next/server'
import { db, products, productImages, productOptionGroups, productOptionChoices } from '@/lib/db'
import { eq, ilike, or, desc, asc, and, sql, gte, lte, gt } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { createSlug } from '@/lib/utils'
import { z } from 'zod'
import { optionGroupSchema, customOrderFieldSchema } from './_schemas'

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional(),
  stock: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  weight: z.number().int().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  printTime: z.number().int().optional(),
  sku: z.string().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  lowStockAlerts: z.boolean().default(false),
  filamentCostPence: z.number().int().min(0).optional(),
  estimatedMinutes: z.number().int().min(0).optional(),
  productType: z.enum(['physical', 'digital', '3d_model', 'custom_order']).default('physical'),
  modelUrl: z.string().optional(),
  digitalFileUrl: z.string().optional(),
  filamentId: z.string().uuid().optional(),
  digitalFilePath: z.string().optional(),
  saleEndsAt: z.string().optional(),
  saleStopAtStock: z.number().int().min(0).optional(),
  customOrderFields: z.array(customOrderFieldSchema).optional(),
  images: z.array(z.object({ url: z.string(), alt: z.string().optional() })).default([]),
  optionGroups: z.array(optionGroupSchema).default([]),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const order = searchParams.get('order') || 'desc'
  const featured = searchParams.get('featured')
  const tag = searchParams.get('tag')
  const material = searchParams.get('material')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const inStock = searchParams.get('inStock')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24') || 24, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)
  const adminView = searchParams.get('admin') === 'true'

  try {
    const session = adminView
      ? await auth.api.getSession({ headers: await headers() })
      : null
    const isAdmin = session?.user?.role === 'admin'

    const conditions = []

    if (!isAdmin) {
      conditions.push(eq(products.active, true))
    }

    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.shortDescription, `%${search}%`),
          ilike(products.material, `%${search}%`),
          ilike(products.color, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          sql`${products.tags}::text ilike ${'%' + search + '%'}`
        )
      )
    }

    if (featured === 'true') {
      conditions.push(eq(products.featured, true))
    }

    if (tag) {
      conditions.push(sql`${tag} = ANY(${products.tags})`)
    }

    if (material) {
      conditions.push(eq(products.material, material))
    }

    if (minPrice) {
      conditions.push(gte(products.price, parseInt(minPrice)))
    }

    if (maxPrice) {
      conditions.push(lte(products.price, parseInt(maxPrice)))
    }

    if (inStock === 'true') {
      conditions.push(gt(products.stock, 0))
    }

    const orderFn = order === 'asc' ? asc : desc
    const orderCol =
      sortBy === 'price'
        ? products.price
        : sortBy === 'name'
          ? products.name
          : products.createdAt

    const rows = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        images: { orderBy: asc(productImages.order) },
        optionGroups: {
          orderBy: asc(productOptionGroups.order),
          with: { choices: { orderBy: asc(productOptionChoices.order) } },
        },
      },
      orderBy: orderFn(orderCol),
      limit,
      offset,
    })

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    return NextResponse.json({ products: rows, total: Number(total[0].count) })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createProductSchema.parse(body)

    const slug = createSlug(data.name)

    const [product] = await db
      .insert(products)
      .values({
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        stock: data.stock,
        tags: data.tags,
        featured: data.featured,
        active: data.active,
        weight: data.weight,
        material: data.material,
        color: data.color,
        printTime: data.printTime,
        sku: data.sku,
        lowStockThreshold: data.lowStockThreshold,
        lowStockAlerts: data.lowStockAlerts,
        filamentCostPence: data.filamentCostPence,
        estimatedMinutes: data.estimatedMinutes,
        productType: data.productType,
        modelUrl: data.modelUrl,
        digitalFileUrl: data.digitalFileUrl,
        filamentId: data.filamentId,
        digitalFilePath: data.digitalFilePath,
        saleEndsAt: data.saleEndsAt ? new Date(data.saleEndsAt) : undefined,
        saleStopAtStock: data.saleStopAtStock,
        customOrderFields: data.customOrderFields,
      })
      .returning()

    if (data.images.length > 0) {
      await db.insert(productImages).values(
        data.images.map((img, i) => ({
          productId: product.id,
          url: img.url,
          alt: img.alt || data.name,
          order: i,
        }))
      )
    }

    // Insert option groups and choices
    for (let gi = 0; gi < data.optionGroups.length; gi++) {
      const group = data.optionGroups[gi]
      const [insertedGroup] = await db
        .insert(productOptionGroups)
        .values({ productId: product.id, name: group.name, type: group.type, order: gi })
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

    const created = await db.query.products.findFirst({
      where: eq(products.id, product.id),
      with: {
        images: true,
        optionGroups: {
          orderBy: asc(productOptionGroups.order),
          with: { choices: { orderBy: asc(productOptionChoices.order) } },
        },
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Product create error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
