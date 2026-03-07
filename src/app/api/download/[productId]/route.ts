import { NextRequest, NextResponse } from 'next/server'
import { db, products, orders, orderItems } from '@/lib/db'
import { eq, and, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { readFile } from 'fs/promises'
import { resolve } from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'You must be signed in to download files' }, { status: 401 })
  }

  const { productId } = await params

  // Load the product
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { id: true, name: true, productType: true, digitalFilePath: true, digitalFileUrl: true },
  })

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  if (product.productType !== 'digital' && product.productType !== '3d_model') {
    return NextResponse.json({ error: 'This product does not have a downloadable file' }, { status: 400 })
  }

  if (!product.digitalFilePath && !product.digitalFileUrl) {
    return NextResponse.json({ error: 'No download file available yet' }, { status: 404 })
  }

  // Verify the user has a paid order containing this product
  const userOrders = await db.query.orders.findMany({
    where: and(eq(orders.userId, session.user.id), inArray(orders.status, ['paid', 'processing', 'prepared', 'shipped', 'delivered'])),
    columns: { id: true },
  })

  if (userOrders.length === 0) {
    return NextResponse.json({ error: 'No qualifying order found for this product' }, { status: 403 })
  }

  const orderIds = userOrders.map((o) => o.id)
  const purchasedItem = await db.query.orderItems.findFirst({
    where: and(
      inArray(orderItems.orderId, orderIds),
      eq(orderItems.productId, productId)
    ),
  })

  if (!purchasedItem) {
    return NextResponse.json({ error: 'You have not purchased this product' }, { status: 403 })
  }

  // If it's an internal file path, serve it directly
  if (product.digitalFilePath) {
    try {
      const privateRoot = resolve(process.cwd(), 'private')
      const filePath = resolve(privateRoot, product.digitalFilePath)
      if (!filePath.startsWith(privateRoot + '/')) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
      }
      const fileBuffer = await readFile(filePath)
      const ext = product.digitalFilePath.split('.').pop()?.toLowerCase() ?? 'bin'
      const mimeType = ext === 'pdf' ? 'application/pdf'
        : ext === 'glb' ? 'model/gltf-binary'
        : ext === 'gltf' ? 'model/gltf+json'
        : ext === 'zip' ? 'application/zip'
        : 'application/octet-stream'

      const licenseHeader = [
        `${product.name} — Licensed for personal use only.`,
        'You may not sell, redistribute, or commercially exploit this file.',
        `Downloaded by: ${session.user.email} on ${new Date().toISOString()}`,
      ].join(' | ')

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${product.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}"`,
          'X-License': licenseHeader,
          'Cache-Control': 'no-store',
        },
      })
    } catch {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
    }
  }

  // External URL — redirect with a short-lived token would be ideal; for now just redirect
  return NextResponse.redirect(product.digitalFileUrl!)
}
