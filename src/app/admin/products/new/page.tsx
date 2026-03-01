import { ProductForm } from '@/components/admin/ProductForm'

export const metadata = { title: 'New Product — Admin' }

export default function NewProductPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stratum-light">New Product</h1>
        <p className="text-stratum-muted text-sm mt-1">
          Fill in the details below to add a new product to the store.
        </p>
      </div>
      <ProductForm />
    </div>
  )
}
