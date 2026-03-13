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
  primaryKey,
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
  tosAcceptedAt: timestamp('tos_accepted_at'),
  marketingEmails: boolean('marketing_emails').notNull().default(true),
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
    sku: text('sku'),
    material: text('material'), // e.g. PLA, PETG, ABS
    color: text('color'),
    printTime: integer('print_time'), // minutes
    productType: text('product_type').notNull().default('physical'), // 'physical' | 'digital' | 'custom_order' | '3d_model'
    modelUrl: text('model_url'),
    digitalFileUrl: text('digital_file_url'),
    digitalFilePath: text('digital_file_path'), // internal path for uploaded digital files
    customOrderFields: jsonb('custom_order_fields'), // [{type, label, required, placeholder, options}]
    lowStockThreshold: integer('low_stock_threshold'),
    lowStockAlerts: boolean('low_stock_alerts').notNull().default(false),
    filamentCostPence: integer('filament_cost_pence'),
    estimatedMinutes: integer('estimated_minutes'),
    filamentId: uuid('filament_id'), // reference to filaments table
    saleEndsAt: timestamp('sale_ends_at'),
    saleStopAtStock: integer('sale_stop_at_stock'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('products_slug_idx').on(t.slug),
    index('products_active_idx').on(t.active),
    index('products_featured_idx').on(t.featured),
    index('products_created_at_idx').on(t.createdAt),
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
    conditions: jsonb('conditions'), // [{field, operator, value}]
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('coupons_code_idx').on(t.code)]
)

// ─── Coupon Product Restrictions ─────────────────────────────────────────────
export const couponProducts = pgTable(
  'coupon_products',
  {
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.couponId, t.productId] })]
)

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    userId: text('user_id').references(() => user.id),
    email: text('email').notNull(),
    status: text('status').notNull().default('pending'), // pending, paid, processing, preparing, prepared, shipped, delivered, cancelled, refunded
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
    index('orders_email_idx').on(t.email),
    index('orders_stripe_payment_intent_idx').on(t.stripePaymentIntentId),
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
  type: text('type').notNull().default('select'), // 'select' | 'boolean' | 'text'
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

// ─── Announcement Banners ─────────────────────────────────────────────────────
export const banners = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  message: text('message').notNull(),
  type: text('type').notNull().default('info'), // 'info' | 'sale' | 'warning' | 'success'
  link: text('link'),
  linkText: text('link_text'),
  active: boolean('active').notNull().default(true),
  dismissible: boolean('dismissible').notNull().default(true),
  opacity: integer('opacity').notNull().default(100), // 0-100
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Banner = typeof banners.$inferSelect

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendations = pgTable('recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  referenceUrl: text('reference_url'),
  modelFileUrl: text('model_file_url'), // uploaded STL/3MF file URL
  estimatedVolumeCm3: integer('estimated_volume_cm3'), // parsed from model file
  estimatedPricePence: integer('estimated_price_pence'), // auto-quoted price
  status: text('status').notNull().default('pending'), // pending, reviewing, accepted, declined
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Settings ────────────────────────────────────────────────────────────────
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Audit Log ────────────────────────────────────────────────────────────────
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: text('admin_id').references(() => user.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata'),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('audit_log_created_at_idx').on(t.createdAt),
    index('audit_log_admin_id_idx').on(t.adminId),
  ]
)

// ─── Error Log ────────────────────────────────────────────────────────────────
export const errorLog = pgTable(
  'error_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    path: text('path').notNull(),
    method: text('method'),
    message: text('message').notNull(),
    stack: text('stack'),
    userId: text('user_id').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('error_log_created_at_idx').on(t.createdAt)]
)

// ─── Time & Cost Entries ──────────────────────────────────────────────────────
export const timeEntries = pgTable('time_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: text('admin_id').references(() => user.id),
  description: text('description').notNull(),
  minutes: integer('minutes').notNull(),
  category: text('category').notNull().default('labour'), // 'labour' | 'print_time'
  orderId: uuid('order_id').references(() => orders.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const costEntries = pgTable('cost_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: text('admin_id').references(() => user.id),
  type: text('type').notNull(), // 'electricity' | 'filament' | 'shipping' | 'other'
  description: text('description').notNull(),
  amountPence: integer('amount_pence').notNull(),
  filamentId: uuid('filament_id').references(() => filaments.id),
  gramsUsed: integer('grams_used'),
  orderId: uuid('order_id').references(() => orders.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Support Tickets ──────────────────────────────────────────────────────────
export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id').references(() => user.id),
    email: text('email').notNull(),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    status: text('status').notNull().default('open'), // 'open' | 'in_progress' | 'resolved' | 'closed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('support_tickets_status_idx').on(t.status),
    index('support_tickets_created_at_idx').on(t.createdAt),
    index('support_tickets_email_idx').on(t.email),
  ]
)

export const supportMessages = pgTable('support_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id')
    .notNull()
    .references(() => supportTickets.id, { onDelete: 'cascade' }),
  senderUserId: text('sender_user_id').references(() => user.id),
  senderEmail: text('sender_email').notNull(),
  body: text('body').notNull(),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Filaments Inventory ──────────────────────────────────────────────────────
export const filaments = pgTable('filaments', {
  id: uuid('id').defaultRandom().primaryKey(),
  brand: text('brand'),
  material: text('material').notNull(), // PLA, PETG, ABS, ASA, TPU, etc.
  color: text('color').notNull(),
  colorHex: text('color_hex'), // e.g. "#FFD700"
  pricePerKgPence: integer('price_per_kg_pence').notNull(), // pence per kg
  weightRemainingGrams: integer('weight_remaining_grams').notNull().default(1000),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ─── Custom Order Submissions (post-purchase) ─────────────────────────────────
export const customOrderSubmissions = pgTable('custom_order_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  fields: jsonb('fields').notNull(), // { [fieldLabel]: value }
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
})

// ─── Print Items (physical-to-digital tracking) ───────────────────────────────
export const printItems = pgTable('print_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  batchId: uuid('batch_id').references(() => printBatches.id),
  orderId: uuid('order_id').references(() => orders.id),
  scannedAt: timestamp('scanned_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────
export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  optionGroups: many(productOptionGroups),
  bundleProducts: many(bundleProducts),
  orderItems: many(orderItems),
  couponProducts: many(couponProducts),
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
  couponProducts: many(couponProducts),
}))

export const couponProductsRelations = relations(couponProducts, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponProducts.couponId],
    references: [coupons.id],
  }),
  product: one(products, {
    fields: [couponProducts.productId],
    references: [products.id],
  }),
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

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
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
  customOrderSubmission: many(customOrderSubmissions),
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

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(user, { fields: [supportTickets.userId], references: [user.id] }),
  messages: many(supportMessages),
}))

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [supportMessages.ticketId], references: [supportTickets.id] }),
  sender: one(user, { fields: [supportMessages.senderUserId], references: [user.id] }),
}))

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  admin: one(user, { fields: [timeEntries.adminId], references: [user.id] }),
  order: one(orders, { fields: [timeEntries.orderId], references: [orders.id] }),
}))

export const costEntriesRelations = relations(costEntries, ({ one }) => ({
  admin: one(user, { fields: [costEntries.adminId], references: [user.id] }),
  order: one(orders, { fields: [costEntries.orderId], references: [orders.id] }),
  filament: one(filaments, { fields: [costEntries.filamentId], references: [filaments.id] }),
}))

export const printItemsRelations = relations(printItems, ({ one }) => ({
  product: one(products, { fields: [printItems.productId], references: [products.id] }),
  batch: one(printBatches, { fields: [printItems.batchId], references: [printBatches.id] }),
  order: one(orders, { fields: [printItems.orderId], references: [orders.id] }),
}))

export const customOrderSubmissionsRelations = relations(customOrderSubmissions, ({ one }) => ({
  orderItem: one(orderItems, { fields: [customOrderSubmissions.orderItemId], references: [orderItems.id] }),
  user: one(user, { fields: [customOrderSubmissions.userId], references: [user.id] }),
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
export type CouponProduct = typeof couponProducts.$inferSelect
export type AuditLog = typeof auditLog.$inferSelect
export type Filament = typeof filaments.$inferSelect
export type CustomOrderSubmission = typeof customOrderSubmissions.$inferSelect
export type ErrorLog = typeof errorLog.$inferSelect
export type TimeEntry = typeof timeEntries.$inferSelect
export type CostEntry = typeof costEntries.$inferSelect
export type SupportTicket = typeof supportTickets.$inferSelect
export type SupportMessage = typeof supportMessages.$inferSelect
export type PrintItem = typeof printItems.$inferSelect
export type Setting = typeof settings.$inferSelect
