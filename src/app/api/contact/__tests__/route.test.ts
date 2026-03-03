import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

describe('POST /api/contact', () => {
  it('returns success for valid data', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, I have a question.',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns success with optional orderNumber', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Jane',
        email: 'jane@example.com',
        orderNumber: 'STR-ABC-1234',
        message: 'Where is my order?',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 400 for missing name', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        email: 'john@example.com',
        message: 'Hello',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid form data')
  })

  it('returns 400 for invalid email', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John',
        email: 'not-an-email',
        message: 'Hello',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty message', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John',
        email: 'john@example.com',
        message: '',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for empty body', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
