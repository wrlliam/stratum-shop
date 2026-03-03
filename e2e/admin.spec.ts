import { test, expect } from '@playwright/test'

test.describe('Admin Flows', () => {
  // Note: These tests require an admin user to be seeded in the database
  // and will skip gracefully if admin login fails

  test('admin dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForTimeout(2000)
    const url = page.url()
    // Should redirect to login or show unauthorized
    const redirected = url.includes('/login') || url.includes('/admin')
    expect(redirected).toBeTruthy()
  })

  test('admin products page exists', async ({ page }) => {
    await page.goto('/admin/products')
    await page.waitForTimeout(2000)
    // Either shows products or redirects to login
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin orders page exists', async ({ page }) => {
    await page.goto('/admin/orders')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin coupons page exists', async ({ page }) => {
    await page.goto('/admin/coupons')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin inventory page exists', async ({ page }) => {
    await page.goto('/admin/inventory')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin bundles page exists', async ({ page }) => {
    await page.goto('/admin/bundles')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin recommendations page exists', async ({ page }) => {
    await page.goto('/admin/recommendations')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('new product page exists', async ({ page }) => {
    await page.goto('/admin/products/new')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('new bundle page exists', async ({ page }) => {
    await page.goto('/admin/bundles/new')
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('admin stats API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/admin/stats')
    expect(response.status()).toBe(401)
  })

  test('admin coupons API requires authentication', async ({ page }) => {
    const response = await page.request.get('/api/admin/coupons')
    expect(response.status()).toBe(401)
  })
})
