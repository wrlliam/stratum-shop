import type { Product, ProductImage, Bundle, BundleProduct, Order, OrderItem, ProductOptionGroup, ProductOptionChoice } from '@/lib/db/schema'

export type { Product, ProductImage, Bundle, BundleProduct, Order, OrderItem, ProductOptionGroup, ProductOptionChoice }

export type SelectedOption = {
  groupName: string
  choiceLabel: string
  priceModifier: number
}

export type ProductWithImages = Product & {
  images: ProductImage[]
}

export type ProductOptionGroupWithChoices = ProductOptionGroup & {
  choices: ProductOptionChoice[]
}

export type ProductWithImagesAndOptions = Product & {
  images: ProductImage[]
  optionGroups: ProductOptionGroupWithChoices[]
}

export type BundleWithProducts = Bundle & {
  bundleProducts: (BundleProduct & {
    product: ProductWithImages
  })[]
}

export type OrderWithItems = Order & {
  items: OrderItem[]
}

export type CartItem = {
  id: string
  productId?: string
  bundleId?: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  isBundle: boolean
  slug?: string
  selectedOptions?: SelectedOption[]
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  itemCount: number
}

export type DeliveryAddress = {
  name: string
  line1: string
  line2?: string
  city: string
  county?: string
  postcode: string
  country: string
}

export type AdminStats = {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  avgOrderValue: number
  revenueChangePercent: number
  revenueByMonth: { month: string; revenue: number; orders: number }[]
  dailyOrders: { date: string; orders: number; revenue: number }[]
  recentOrders: OrderWithItems[]
  topProducts: { name: string; sales: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  lowStockProducts: { id: string; name: string; stock: number }[]
  repeatCustomerRate: number
}
