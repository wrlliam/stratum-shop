import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  jsonb,
  serial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Better Auth Tables ────────────────────────────────────────────────────────
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    shortDescription: text('short_description'),
    price: integer('price').notNull(), // pence
    compareAtPrice: integer('compare_at_price'), // pence - for sale display
    stock: integer('stock').notNull().default(0),
    tags: text('tags').array().default([]),
    featured: boolean('featured').notNull().default(false),
    active: boolean('active').notNull().default(true),
    weight: integer('weight'), // grams, for shipping
    material: text('material'), // e.g. PLA, PETG, ABS
    color: text('color'),
    printTime: integer('print_time'), // minutes
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('products_slug_idx').on(t.slug),
    index('products_active_idx').on(t.active),
    index('products_featured_idx').on(t.featured),
  ]
)

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  alt: text('alt'),
  order: integer('order').notNull().default(0),
})

// ─── Bundles ──────────────────────────────────────────────────────────────────
export const bundles = pgTable('bundles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  discountPercent: integer('discount_percent').notNull().default(0),
  imageUrl: text('image_url'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const bundleProducts = pgTable('bundle_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  bundleId: uuid('bundle_id')
    .notNull()
    .references(() => bundles.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
})

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    type: text('type').notNull(), // 'fixed' | 'percentage'
    value: integer('value').notNull(), // pence for fixed, percentage for percentage
    minOrderAmount: integer('min_order_amount'), // pence, nullable
    maxUses: integer('max_uses'), // nullable = unlimited
    usedCount: integer('used_count').notNull().default(0),
    active: boolean('active').notNull().default(true),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('coupons_code_idx').on(t.code)]
)

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id').references(() => user.id),
    email: text('email').notNull(),
    status: text('status').notNull().default('pending'), // pending, paid, processing, shipped, delivered, cancelled, refunded
    stripeSessionId: text('stripe_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    subtotal: integer('subtotal').notNull(), // pence
    deliveryPrice: integer('delivery_price').notNull(), // pence
    taxAmount: integer('tax_amount').notNull(), // pence
    total: integer('total').notNull(), // pence
    deliveryMethod: text('delivery_method').notNull(),
    discountAmount: integer('discount_amount').notNull().default(0), // pence
    couponId: uuid('coupon_id').references(() => coupons.id),
    couponCode: text('coupon_code'),
    deliveryAddress: jsonb('delivery_address'),
    notes: text('notes'),
    trackingNumber: text('tracking_number'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('orders_user_id_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
  ]
)

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  bundleId: uuid('bundle_id').references(() => bundles.id),
  name: text('name').notNull(),
  imageUrl: text('image_url'),
  price: integer('price').notNull(), // pence per item
  quantity: integer('quantity').notNull().default(1),
  isBundle: boolean('is_bundle').notNull().default(false),
  selectedOptions: jsonb('selected_options'), // [{groupName, choiceLabel, priceModifier}]
})

// ─── Product Options ─────────────────────────────────────────────────────────
export const productOptionGroups = pgTable('product_option_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
})

export const productOptionChoices = pgTable('product_option_choices', {
  id: uuid('id').defaultRandom().primaryKey(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => productOptionGroups.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  priceModifier: integer('price_modifier').notNull().default(0), // pence
  order: integer('order').notNull().default(0),
})

// ─── Print Batches & Inventory Log ───────────────────────────────────────────
export const printBatches = pgTable('print_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('pending'), // pending, completed
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by').references(() => user.id),
})

export const inventoryLog = pgTable(
  'inventory_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantityChange: integer('quantity_change').notNull(),
    reason: text('reason').notNull(), // manual, batch_completed, order_paid, refund
    batchId: uuid('batch_id').references(() => printBatches.id),
    userId: text('user_id').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('inventory_log_product_id_idx').on(t.productId),
    index('inventory_log_created_at_idx').on(t.createdAt),
  ]
)

// ─── Order Messages ─────────────────────────────────────────────────────────
export const orderMessages = pgTable('order_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  sentByAdminId: text('sent_by_admin_id').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendations = pgTable('recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  referenceUrl: text('reference_url'),
  status: text('status').notNull().default('pending'), // pending, reviewing, accepted, declined
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────
export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  optionGroups: many(productOptionGroups),
  bundleProducts: many(bundleProducts),
  orderItems: many(orderItems),
}))

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}))

export const bundlesRelations = relations(bundles, ({ many }) => ({
  bundleProducts: many(bundleProducts),
  orderItems: many(orderItems),
}))

export const bundleProductsRelations = relations(bundleProducts, ({ one }) => ({
  bundle: one(bundles, {
    fields: [bundleProducts.bundleId],
    references: [bundles.id],
  }),
  product: one(products, {
    fields: [bundleProducts.productId],
    references: [products.id],
  }),
}))

export const couponsRelations = relations(coupons, ({ many }) => ({
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  messages: many(orderMessages),
  user: one(user, {
    fields: [orders.userId],
    references: [user.id],
    relationName: 'userOrders',
  }),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  bundle: one(bundles, {
    fields: [orderItems.bundleId],
    references: [bundles.id],
  }),
}))

export const orderMessagesRelations = relations(orderMessages, ({ one }) => ({
  order: one(orders, {
    fields: [orderMessages.orderId],
    references: [orders.id],
  }),
  sentBy: one(user, {
    fields: [orderMessages.sentByAdminId],
    references: [user.id],
    relationName: 'userOrderMessages',
  }),
}))

export const productOptionGroupsRelations = relations(productOptionGroups, ({ one, many }) => ({
  product: one(products, {
    fields: [productOptionGroups.productId],
    references: [products.id],
  }),
  choices: many(productOptionChoices),
}))

export const productOptionChoicesRelations = relations(productOptionChoices, ({ one }) => ({
  group: one(productOptionGroups, {
    fields: [productOptionChoices.groupId],
    references: [productOptionGroups.id],
  }),
}))

export const printBatchesRelations = relations(printBatches, ({ one }) => ({
  product: one(products, {
    fields: [printBatches.productId],
    references: [products.id],
  }),
  creator: one(user, {
    fields: [printBatches.createdBy],
    references: [user.id],
    relationName: 'userPrintBatches',
  }),
}))

export const inventoryLogRelations = relations(inventoryLog, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLog.productId],
    references: [products.id],
  }),
  batch: one(printBatches, {
    fields: [inventoryLog.batchId],
    references: [printBatches.id],
  }),
  user: one(user, {
    fields: [inventoryLog.userId],
    references: [user.id],
    relationName: 'userInventoryLog',
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
    relationName: 'userSessions',
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
    relationName: 'userAccounts',
  }),
}))

export const userRelations = relations(user, ({ many }) => ({
  orders: many(orders, { relationName: 'userOrders' }),
  sessions: many(session, { relationName: 'userSessions' }),
  accounts: many(account, { relationName: 'userAccounts' }),
  printBatches: many(printBatches, { relationName: 'userPrintBatches' }),
  inventoryLogs: many(inventoryLog, { relationName: 'userInventoryLog' }),
  orderMessages: many(orderMessages, { relationName: 'userOrderMessages' }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof user.$inferSelect
export type Product = typeof products.$inferSelect
export type ProductImage = typeof productImages.$inferSelect
export type Bundle = typeof bundles.$inferSelect
export type BundleProduct = typeof bundleProducts.$inferSelect
export type Order = typeof orders.$inferSelect
export type OrderItem = typeof orderItems.$inferSelect
export type Recommendation = typeof recommendations.$inferSelect
export type ProductOptionGroup = typeof productOptionGroups.$inferSelect
export type ProductOptionChoice = typeof productOptionChoices.$inferSelect
export type PrintBatch = typeof printBatches.$inferSelect
export type InventoryLogEntry = typeof inventoryLog.$inferSelect
export type OrderMessage = typeof orderMessages.$inferSelect
export type Coupon = typeof coupons.$inferSelect
