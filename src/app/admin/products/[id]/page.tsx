import { notFound } from 'next/navigation'
import { db, products, productImages, productOptionGroups, productOptionChoices } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { ProductForm } from '@/components/admin/ProductForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      images: { orderBy: asc(productImages.order) },
      optionGroups: {
        orderBy: asc(productOptionGroups.order),
        with: { choices: { orderBy: asc(productOptionChoices.order) } },
      },
    },
  })

  if (!product) notFound()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stratum-light">Edit Product</h1>
        <p className="text-stratum-muted text-sm mt-1 font-mono">{product.slug}</p>
      </div>
      <ProductForm product={product} />
    </div>
  )
}
