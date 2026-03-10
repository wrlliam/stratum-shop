import { NextRequest, NextResponse } from "next/server";
import {
  db,
  orders,
  orderItems,
  products,
  bundleProducts,
  inventoryLog,
} from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { FROM_EMAIL, APP_URL, getResend } from "@/lib/resend";
import { renderAsync } from "@react-email/components";
import { OrderCancellationEmail } from "@/lib/email/order-cancellation";

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Users can only cancel their own orders
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check order is in a cancellable state
    const cancellableStatuses = ["paid", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel an order with status "${order.status}"` },
        { status: 400 },
      );
    }

    // Check 24-hour window
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    if (orderAge > CANCEL_WINDOW_MS) {
      return NextResponse.json(
        {
          error:
            "Orders can only be cancelled within 24 hours of purchase. Please contact us for assistance.",
        },
        { status: 400 },
      );
    }

    let paymentIntentId = order.stripePaymentIntentId;

    if (!paymentIntentId) {
      if (!order.stripeSessionId) {
        return NextResponse.json(
          { error: "No payment intent or session found for this order" },
          { status: 400 },
        );
      }

      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );

      if (!session.payment_intent) {
        return NextResponse.json(
          {
            error: "Could not resolve a payment intent from the Stripe session",
          },
          { status: 400 },
        );
      }

      paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;

      // Persist it so future calls don't need to hit Stripe again
      await db
        .update(orders)
        .set({ stripePaymentIntentId: paymentIntentId, updatedAt: new Date() })
        .where(eq(orders.id, id));
    }

    // Issue Stripe refund — if already refunded, treat as a DB sync (don't double-refund)
    try {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });
    } catch (stripeErr: unknown) {
      const code = (stripeErr as { code?: string }).code;
      if (code !== "charge_already_refunded") {
        console.error('Stripe refund error:', stripeErr)
        return NextResponse.json({ error: 'Refund could not be processed. Please contact support.' }, { status: 502 })
      }
      // charge_already_refunded: refund already exists in Stripe — fall through to sync DB state
    }

    // Restore stock
    for (const item of order.items) {
      if (item.productId && !item.isBundle) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
        await db.insert(inventoryLog).values({
          productId: item.productId,
          quantityChange: item.quantity,
          reason: "refund",
        });
      } else if (item.bundleId) {
        const bps = await db.query.bundleProducts.findMany({
          where: eq(bundleProducts.bundleId, item.bundleId),
        });
        for (const bp of bps) {
          await db
            .update(products)
            .set({
              stock: sql`${products.stock} + ${bp.quantity * item.quantity}`,
            })
            .where(eq(products.id, bp.productId));
          await db.insert(inventoryLog).values({
            productId: bp.productId,
            quantityChange: bp.quantity * item.quantity,
            reason: "refund",
          });
        }
      }
    }

    // Update order status
    await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, id));

    // Send cancellation email
    try {
      const html = await renderAsync(
        OrderCancellationEmail({
          order,
          appUrl: APP_URL,
        }) as React.ReactElement,
      );
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: order.email,
        subject: `Order Cancelled: ${order.orderNumber} — Stratum`,
        html,
      });
    } catch (emailErr) {
      console.error("Failed to send cancellation email:", emailErr);
    }

    return NextResponse.json({ ok: true, status: "cancelled" });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 },
    );
  }
}
