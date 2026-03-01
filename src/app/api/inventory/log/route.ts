import { NextRequest, NextResponse } from 'next/server'
import { db, inventoryLog, products } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50') || 50, 1), 100)
  const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)

  try {
    const logs = await db.query.inventoryLog.findMany({
      where: productId ? eq(inventoryLog.productId, productId) : undefined,
      with: { product: true },
      orderBy: desc(inventoryLog.createdAt),
      limit,
      offset,
    })
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Inventory log error:', error)
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 })
  }
}
