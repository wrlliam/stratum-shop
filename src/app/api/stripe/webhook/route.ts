import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { resend, FROM_EMAIL, APP_URL } from "@/lib/resend";
import { publishEvent, cacheDel, STATS_CACHE_KEY } from "@/lib/redis";
import {
  db,
  orders,
  orderItems,
  products,
  bundleProducts,
  inventoryLog,
  costEntries,
  timeEntries,
} from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import { OrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { renderAsync } from "@react-email/components";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        // Check if order already has an address (from our checkout form)
        const existingOrder = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        });

        const shippingAddress = session.shipping_details?.address;

        const updateData: Record<string, unknown> = {
          status: "paid",
          stripePaymentIntentId: session.payment_intent as string,
          updatedAt: new Date(),
        };

        // Only set address from Stripe if we don't already have one
        if (!existingOrder?.deliveryAddress && shippingAddress) {
          updateData.deliveryAddress = {
            name: session.shipping_details?.name || "",
            line1: shippingAddress.line1 || "",
            line2: shippingAddress.line2 || undefined,
            city: shippingAddress.city || "",
            county: shippingAddress.state || undefined,
            postcode: shippingAddress.postal_code || "",
            country: shippingAddress.country || "GB",
          };
        }

        await db.update(orders).set(updateData).where(eq(orders.id, orderId));

        // Deduct stock for each item
        const orderItemsList = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, orderId),
        });

        for (const item of orderItemsList) {
          if (item.productId && !item.isBundle) {
            await db
              .update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(eq(products.id, item.productId));
            await db.insert(inventoryLog).values({
              productId: item.productId,
              quantityChange: -item.quantity,
              reason: "order_paid",
            });
            // Fetch product data once for cost tracking + sale/stock checks
            const updatedProduct = await db.query.products.findFirst({
              where: eq(products.id, item.productId),
              columns: { filamentCostPence: true, estimatedMinutes: true, name: true, stock: true, lowStockThreshold: true, lowStockAlerts: true, saleStopAtStock: true, compareAtPrice: true },
            })

            if (updatedProduct?.filamentCostPence) {
              await db.insert(costEntries).values({
                type: 'filament',
                description: `Auto: order ${orderId} item × ${item.quantity}`,
                amountPence: updatedProduct.filamentCostPence * item.quantity,
                orderId,
              }).catch(() => {})
            }
            if (updatedProduct?.estimatedMinutes) {
              await db.insert(timeEntries).values({
                description: `Auto: order ${orderId} item × ${item.quantity}`,
                minutes: updatedProduct.estimatedMinutes * item.quantity,
                orderId,
              }).catch(() => {})
            }

            // Auto-expire sale when stock hits saleStopAtStock
            if (
              updatedProduct?.saleStopAtStock != null &&
              updatedProduct.stock <= updatedProduct.saleStopAtStock &&
              updatedProduct.compareAtPrice
            ) {
              await db
                .update(products)
                .set({ compareAtPrice: null, saleEndsAt: null, saleStopAtStock: null })
                .where(eq(products.id, item.productId))
            }

            if (
              updatedProduct?.lowStockAlerts &&
              updatedProduct.lowStockThreshold !== null &&
              updatedProduct.lowStockThreshold !== undefined &&
              updatedProduct.stock <= updatedProduct.lowStockThreshold
            ) {
              await publishEvent({
                type: 'low_stock',
                productId: item.productId,
                name: updatedProduct.name,
                stock: updatedProduct.stock,
              })
              const adminEmail = process.env.ADMIN_EMAIL
              if (adminEmail) {
                await resend.emails.send({
                  from: FROM_EMAIL,
                  to: adminEmail,
                  subject: `Low Stock Alert: ${updatedProduct.name} — Stratum`,
                  html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><h2 style="color:#1a1a1a">Low Stock Alert</h2><p><strong>${updatedProduct.name}</strong> has reached low stock.</p><p>Current stock: <strong>${updatedProduct.stock}</strong> units</p><p>Threshold: ${updatedProduct.lowStockThreshold} units</p><a href="${APP_URL}/admin/inventory" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;margin-top:16px">View Inventory</a></div>`,
                }).catch(console.error);
              }
            }
          } else if (item.bundleId) {
            const bps = await db.query.bundleProducts.findMany({
              where: eq(bundleProducts.bundleId, item.bundleId),
            });
            for (const bp of bps) {
              await db
                .update(products)
                .set({
                  stock: sql`${products.stock} - ${bp.quantity * item.quantity}`,
                })
                .where(eq(products.id, bp.productId));
              await db.insert(inventoryLog).values({
                productId: bp.productId,
                quantityChange: -(bp.quantity * item.quantity),
                reason: "order_paid",
              });
            }
          }
        }

        // Send confirmation email
        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
          with: { items: true },
        });

        if (order) {
          const html = await renderAsync(
            OrderConfirmationEmail({
              order,
              appUrl: APP_URL,
            }) as React.ReactElement,
          );

          await resend.emails.send({
            from: FROM_EMAIL,
            to: order.email,
            subject: `Order Confirmed: ${order.orderNumber} — Stratum`,
            html,
          });

          // Invalidate stats cache + push real-time event
          await cacheDel(STATS_CACHE_KEY)
          await publishEvent({
            type: 'new_order',
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            email: order.email,
          })
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          await db
            .update(orders)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(orders.id, orderId));
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        if (paymentIntentId) {
          await db
            .update(orders)
            .set({ status: "refunded", updatedAt: new Date() })
            .where(eq(orders.stripePaymentIntentId, paymentIntentId));
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

export const config = {
  api: { bodyParser: false },
};
