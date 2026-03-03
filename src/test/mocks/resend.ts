import { vi } from 'vitest'

export const mockResend = {
  emails: {
    send: vi.fn().mockResolvedValue({ id: 'mock-email-id' }),
  },
}

export function mockResendModule() {
  vi.mock('@/lib/resend', () => ({
    resend: mockResend,
    FROM_EMAIL: 'test@stratum.store',
    APP_NAME: 'Stratum',
    APP_URL: 'http://localhost:3000',
  }))
}
