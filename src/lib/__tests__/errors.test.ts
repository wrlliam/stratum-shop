import { describe, it, expect } from 'vitest'
import { ERROR_MESSAGES, getErrorMessage, parseApiError } from '../errors'

describe('getErrorMessage', () => {
  it('returns the mapped message for a known error code', () => {
    expect(getErrorMessage('UNAUTHORIZED')).toBe('You need to be signed in to do that.')
  })

  it('returns the mapped message for another known code', () => {
    expect(getErrorMessage('OUT_OF_STOCK')).toBe('Sorry, this item is out of stock.')
  })

  it('returns the raw string when the code is not in the map', () => {
    expect(getErrorMessage('Some unknown error text')).toBe('Some unknown error text')
  })
})

describe('parseApiError', () => {
  it('returns mapped message when response JSON has a code field', async () => {
    const response = new Response(JSON.stringify({ code: 'COUPON_EXPIRED' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
    const message = await parseApiError(response)
    expect(message).toBe('This coupon has expired.')
  })

  it('returns raw error string when response JSON has an error field but no code', async () => {
    const response = new Response(JSON.stringify({ error: 'Custom error message' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
    const message = await parseApiError(response)
    expect(message).toBe('Custom error message')
  })

  it('falls back to SERVER_ERROR when response is not valid JSON', async () => {
    const response = new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
    const message = await parseApiError(response)
    expect(message).toBe(ERROR_MESSAGES.SERVER_ERROR)
  })
})

describe('ERROR_MESSAGES', () => {
  it('has all values as non-empty strings', () => {
    const entries = Object.entries(ERROR_MESSAGES)
    expect(entries.length).toBeGreaterThan(0)
    for (const [key, value] of entries) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})
