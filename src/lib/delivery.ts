export const DELIVERY_OPTIONS = [
  {
    id: 'royal_mail_2nd',
    name: 'Royal Mail 2nd Class',
    description: '2-3 business days',
    price: 285, // pence
    icon: '📮',
  },
  {
    id: 'royal_mail_1st',
    name: 'Royal Mail 1st Class',
    description: '1-2 business days',
    price: 385,
    icon: '📬',
  },
  {
    id: 'royal_mail_tracked_48',
    name: 'Royal Mail Tracked 48',
    description: '2-3 business days (tracked)',
    price: 350,
    icon: '📦',
  },
  {
    id: 'royal_mail_tracked_24',
    name: 'Royal Mail Tracked 24',
    description: '1-2 business days (tracked)',
    price: 450,
    icon: '🚀',
  },
] as const

export type DeliveryOptionId = (typeof DELIVERY_OPTIONS)[number]['id']

export function getDeliveryOption(id: string) {
  return DELIVERY_OPTIONS.find((o) => o.id === id)
}

// UK VAT rate
export const VAT_RATE = 0.2

export function calculateTax(amount: number): number {
  return Math.round(amount * VAT_RATE)
}
