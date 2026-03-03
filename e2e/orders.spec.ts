import { test, expect } from '@playwright/test'

test.describe('Order Management', () => {
  test('orders API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/orders')
    expect(response.status()).toBe(401)
  })

  test('orders page requires authentication', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForTimeout(2000)
    const url = page.url()
    const hasLoginRedirect = url.includes('/login')
    const hasAuthMessage = await page.locator('text=/sign in|log in|unauthorized/i').isVisible().catch(() => false)
    expect(hasLoginRedirect || hasAuthMessage).toBeTruthy()
  })

  test('order detail API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/orders/nonexistent-id')
    expect(response.status()).toBe(401)
  })

  test('order cancel API requires authentication', async ({ page }) => {
    const response = await page.request.post('/api/orders/nonexistent-id/cancel')
    expect(response.status()).toBe(401)
  })
})
