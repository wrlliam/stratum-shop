import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Re-export shared constants so existing server-side imports continue to work
export { DELIVERY_OPTIONS, getDeliveryOption, VAT_RATE, calculateTax } from './delivery'
export type { DeliveryOptionId } from './delivery'

export function formatPrice(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}
