import { NextRequest, NextResponse } from 'next/server'
import { db, printBatches, products } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { z } from 'zod'

const createBatchSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    const batches = await db.query.printBatches.findMany({
      where: status ? eq(printBatches.status, status) : undefined,
      with: { product: true },
      orderBy: desc(printBatches.createdAt),
    })
    return NextResponse.json({ batches })
  } catch (error) {
    console.error('Batch list error:', error)
    return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createBatchSchema.parse(body)

    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const [batch] = await db
      .insert(printBatches)
      .values({
        productId: data.productId,
        quantity: data.quantity,
        notes: data.notes,
        createdBy: session.user.id,
      })
      .returning()

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Batch create error:', error)
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }
}
