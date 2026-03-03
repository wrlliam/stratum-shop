import { vi } from 'vitest'

export const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  refunds: {
    create: vi.fn(),
  },
  coupons: {
    create: vi.fn(),
  },
}

export function mockStripeModule() {
  vi.mock('@/lib/stripe', () => ({
    stripe: mockStripe,
    getDeliveryOption: vi.fn((id: string) => {
      const options: Record<string, { id: string; name: string; price: number }> = {
        royal_mail_2nd: { id: 'royal_mail_2nd', name: 'Royal Mail 2nd Class', price: 285 },
        royal_mail_1st: { id: 'royal_mail_1st', name: 'Royal Mail 1st Class', price: 385 },
      }
      return options[id] || null
    }),
    VAT_RATE: 0.2,
    DELIVERY_OPTIONS: [
      { id: 'royal_mail_2nd', name: 'Royal Mail 2nd Class', price: 285 },
      { id: 'royal_mail_1st', name: 'Royal Mail 1st Class', price: 385 },
    ],
  }))
}
