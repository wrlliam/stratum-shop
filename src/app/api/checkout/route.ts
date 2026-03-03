import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe, getDeliveryOption, VAT_RATE } from '@/lib/stripe'
import { db, products, bundles, orders, orderItems, productOptionGroups, productOptionChoices, coupons, couponProducts } from '@/lib/db'
import { eq, asc, sql, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { generateOrderNumber } from '@/lib/utils'
import { z } from 'zod'

const selectedOptionSchema = z.object({
  groupName: z.string(),
  choiceLabel: z.string(),
  priceModifier: z.number().int(),
})

const addressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().default(''),
  city: z.string().min(1),
  county: z.string().optional().default(''),
  postcode: z.string().min(1),
  country: z.string().default('GB'),
})

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().optional(),
      bundleId: z.string().optional(),
      quantity: z.number().int().positive(),
      selectedOptions: z.array(selectedOptionSchema).optional(),
    })
  ),
  deliveryMethodId: z.string(),
  email: z.string().email(),
  address: addressSchema,
  couponCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = checkoutSchema.parse(body)

    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user?.id

    const deliveryOption = getDeliveryOption(data.deliveryMethodId)
    if (!deliveryOption) {
      return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 })
    }

    // Build line items
    const lineItems: {
      name: string
      price: number
      quantity: number
      imageUrl?: string
      productId?: string
      bundleId?: string
      selectedOptions?: { groupName: string; choiceLabel: string; priceModifier: number }[]
    }[] = []

    for (const item of data.items) {
      if (item.productId) {
        const product = await db.query.products.findFirst({
          where: eq(products.id, item.productId),
          with: {
            images: true,
            optionGroups: {
              orderBy: asc(productOptionGroups.order),
              with: { choices: { orderBy: asc(productOptionChoices.order) } },
            },
          },
        })
        if (!product || !product.active) continue

        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for "${product.name}". Only ${product.stock} available.` },
            { status: 400 }
          )
        }

        // Server-side verify option modifiers
        let verifiedModifier = 0
        const verifiedOptions: { groupName: string; choiceLabel: string; priceModifier: number }[] = []
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          for (const sel of item.selectedOptions) {
            const group = product.optionGroups?.find((g) => g.name === sel.groupName)
            if (!group) continue
            const groupType = (group.type as string) || 'select'

            if (groupType === 'select') {
              const choice = group.choices.find((c) => c.label === sel.choiceLabel)
              if (!choice) continue
              verifiedModifier += choice.priceModifier
              verifiedOptions.push({
                groupName: group.name,
                choiceLabel: choice.label,
                priceModifier: choice.priceModifier,
              })
            } else if (groupType === 'boolean' && group.choices[0]) {
              // Boolean: client sends the choice label when toggled on
              verifiedModifier += group.choices[0].priceModifier
              verifiedOptions.push({
                groupName: group.name,
                choiceLabel: group.choices[0].label,
                priceModifier: group.choices[0].priceModifier,
              })
            } else if (groupType === 'text' && group.choices[0] && sel.choiceLabel) {
              // Text: client sends user-typed text as choiceLabel
              verifiedModifier += group.choices[0].priceModifier
              verifiedOptions.push({
                groupName: group.name,
                choiceLabel: sel.choiceLabel,
                priceModifier: group.choices[0].priceModifier,
              })
            }
          }
        }

        const itemPrice = product.price + verifiedModifier
        const optionSuffix = verifiedOptions.length > 0
          ? ` (${verifiedOptions.map((o) => `${o.groupName}: ${o.choiceLabel}`).join(', ')})`
          : ''

        lineItems.push({
          name: product.name + optionSuffix,
          price: itemPrice,
          quantity: item.quantity,
          imageUrl: product.images[0]?.url,
          productId: product.id,
          selectedOptions: verifiedOptions.length > 0 ? verifiedOptions : undefined,
        })
      } else if (item.bundleId) {
        const bundle = await db.query.bundles.findFirst({
          where: eq(bundles.id, item.bundleId),
          with: {
            bundleProducts: { with: { product: { with: { images: true } } } },
          },
        })
        if (!bundle || !bundle.active) continue

        // Check stock for all products in the bundle
        for (const bp of bundle.bundleProducts) {
          const requiredQty = bp.quantity * item.quantity
          if (bp.product.stock < requiredQty) {
            return NextResponse.json(
              { error: `Insufficient stock for "${bp.product.name}" in bundle "${bundle.name}". Only ${bp.product.stock} available.` },
              { status: 400 }
            )
          }
        }

        const bundleTotal = bundle.bundleProducts.reduce(
          (sum, bp) => sum + bp.product.price * bp.quantity,
          0
        )
        const discountedPrice = Math.round(bundleTotal * (1 - bundle.discountPercent / 100))

        lineItems.push({
          name: `${bundle.name} (Bundle - ${bundle.discountPercent}% off)`,
          price: discountedPrice,
          quantity: item.quantity,
          imageUrl: bundle.imageUrl || bundle.bundleProducts[0]?.product.images[0]?.url,
          bundleId: bundle.id,
        })
      }
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 })
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const deliveryPrice = deliveryOption.price

    // Validate and apply coupon
    let discountAmount = 0
    let couponId: string | undefined
    let couponCode: string | undefined
    let couponRecord: typeof coupons.$inferSelect | undefined

    if (data.couponCode) {
      couponRecord = (await db.query.coupons.findFirst({
        where: eq(coupons.code, data.couponCode.toUpperCase().trim()),
      })) ?? undefined

      if (!couponRecord || !couponRecord.active) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 })
      }
      if (couponRecord.expiresAt && new Date(couponRecord.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
      }
      if (couponRecord.maxUses && couponRecord.usedCount >= couponRecord.maxUses) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
      }

      // Check product restrictions — empty = applies to everything
      const restrictions = await db
        .select({ productId: couponProducts.productId })
        .from(couponProducts)
        .where(eq(couponProducts.couponId, couponRecord.id))
      const restrictedIds = restrictions.map((r) => r.productId)

      // Compute subtotal eligible for discount
      const eligibleSubtotal =
        restrictedIds.length === 0
          ? subtotal
          : lineItems.reduce((sum, item) => {
              if (item.productId && restrictedIds.includes(item.productId)) {
                return sum + item.price * item.quantity
              }
              return sum
            }, 0)

      if (eligibleSubtotal === 0) {
        return NextResponse.json(
          { error: 'This coupon is not valid for the items in your cart' },
          { status: 400 }
        )
      }

      if (couponRecord.minOrderAmount && eligibleSubtotal < couponRecord.minOrderAmount) {
        return NextResponse.json({ error: 'Order does not meet minimum amount for this coupon' }, { status: 400 })
      }

      if (couponRecord.type === 'percentage') {
        discountAmount = Math.round(eligibleSubtotal * (couponRecord.value / 100))
      } else {
        discountAmount = Math.min(couponRecord.value, eligibleSubtotal)
      }

      couponId = couponRecord.id
      couponCode = couponRecord.code
    }

    const preTaxTotal = subtotal + deliveryPrice - discountAmount
    const taxAmount = Math.round(preTaxTotal * VAT_RATE)
    const total = preTaxTotal + taxAmount

    const orderNumber = generateOrderNumber()

    // Create pending order with address
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        email: data.email,
        status: 'pending',
        subtotal,
        deliveryPrice,
        taxAmount,
        total,
        discountAmount,
        couponId: couponId || null,
        couponCode: couponCode || null,
        deliveryMethod: data.deliveryMethodId,
        deliveryAddress: data.address,
      })
      .returning()

    await db.insert(orderItems).values(
      lineItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        bundleId: item.bundleId,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity,
        isBundle: !!item.bundleId,
        selectedOptions: item.selectedOptions || null,
      }))
    )

    // Increment coupon usage
    if (couponRecord) {
      await db
        .update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(eq(coupons.id, couponRecord.id))
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Build Stripe line items
    // Stripe requires publicly accessible HTTPS image URLs
    const isPublicUrl = appUrl.startsWith('https://')
    const getStripeImages = (imageUrl?: string): string[] => {
      if (!imageUrl) return []
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return [imageUrl]
      if (imageUrl.startsWith('/') && isPublicUrl) return [`${appUrl}${imageUrl}`]
      return []
    }

    const stripeLineItems = [
      ...lineItems.map((item) => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: item.name,
            images: getStripeImages(item.imageUrl),
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      {
        price_data: {
          currency: 'gbp',
          product_data: { name: `Delivery: ${deliveryOption.name}` },
          unit_amount: deliveryPrice,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'gbp',
          product_data: { name: 'VAT (20%)' },
          unit_amount: taxAmount,
        },
        quantity: 1,
      },
    ]

    // Build Stripe session params
    const stripeSessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: data.email,
      line_items: stripeLineItems,
      metadata: {
        orderId: order.id,
        orderNumber,
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    }

    // Apply discount in Stripe if coupon used — always amount_off since we pre-compute it
    if (discountAmount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: discountAmount,
        currency: 'gbp',
        duration: 'once',
      })
      stripeSessionParams.discounts = [{ coupon: stripeCoupon.id }]
    }

    const stripeSession = await stripe.checkout.sessions.create(stripeSessionParams)

    if (!stripeSession.url) {
      return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
    }

    // Update order with stripe session id
    await db
      .update(orders)
      .set({ stripeSessionId: stripeSession.id })
      .where(eq(orders.id, order.id))

    return NextResponse.json({ url: stripeSession.url, sessionId: stripeSession.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid request' }, { status: 400 })
    }
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
