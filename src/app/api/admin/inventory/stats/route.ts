import { NextResponse } from 'next/server'
import { db, products } from '@/lib/db'
import { requireAdmin } from '@/lib/api-guard'
import { asc } from 'drizzle-orm'

export async function GET() {
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) return authResult

  try {
    const allProducts = await db.query.products.findMany({
      columns: { id: true, name: true, stock: true, price: true },
      orderBy: asc(products.name),
    })

    const totalSKUs = allProducts.length
    const totalUnits = allProducts.reduce((s, p) => s + p.stock, 0)
    const estimatedValue = allProducts.reduce((s, p) => s + p.stock * p.price, 0)

    const topByStock = [...allProducts]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10)

    return NextResponse.json({ totalSKUs, totalUnits, estimatedValue, topByStock })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
