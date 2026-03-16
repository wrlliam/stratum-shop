const WEIGHT_TIERS = [
  { maxGrams: 750, label: 'large_letter' },
  { maxGrams: 2000, label: 'small_parcel' },
  { maxGrams: Infinity, label: 'medium_parcel' },
]

const DELIVERY_PRICES: Record<string, Record<string, number>> = {
  royal_mail_2nd:        { large_letter: 130, small_parcel: 335, medium_parcel: 595 },
  royal_mail_1st:        { large_letter: 165, small_parcel: 455, medium_parcel: 750 },
  royal_mail_tracked_48: { large_letter: 235, small_parcel: 409, medium_parcel: 649 },
  royal_mail_tracked_24: { large_letter: 295, small_parcel: 550, medium_parcel: 850 },
}

export const DELIVERY_OPTIONS = [
  {
    id: 'royal_mail_2nd',
    name: 'Royal Mail 2nd Class',
    description: '2-3 business days',
    price: 335, // small parcel base (pence)
    icon: '📮',
  },
  {
    id: 'royal_mail_1st',
    name: 'Royal Mail 1st Class',
    description: '1-2 business days',
    price: 455,
    icon: '📬',
  },
  {
    id: 'royal_mail_tracked_48',
    name: 'Royal Mail Tracked 48',
    description: '2-3 business days (tracked)',
    price: 409,
    icon: '📦',
  },
  {
    id: 'royal_mail_tracked_24',
    name: 'Royal Mail Tracked 24',
    description: '1-2 business days (tracked)',
    price: 550,
    icon: '🚀',
  },
] as const

export type DeliveryOptionId = (typeof DELIVERY_OPTIONS)[number]['id']

export function getDeliveryOption(id: string) {
  return DELIVERY_OPTIONS.find((o) => o.id === id)
}

export function formatDeliveryMethod(id: string): string {
  return getDeliveryOption(id)?.name ?? id.replace('royal_mail_', '').replace(/_/g, ' ').toUpperCase()
}

export function calculateDeliveryPrice(optionId: string, totalWeightGrams: number): number {
  const tier = WEIGHT_TIERS.find((t) => totalWeightGrams <= t.maxGrams)!.label
  return DELIVERY_PRICES[optionId]?.[tier] ?? getDeliveryOption(optionId)?.price ?? 0
}

export const DELIVERY_DISCLAIMER =
  'Delivery prices are rough estimates and depend on your item and location. The final delivery cost is calculated at checkout based on your order weight.'

// UK VAT rate
export const VAT_RATE = 0.2

export function calculateTax(amount: number): number {
  return Math.round(amount * VAT_RATE)
}
