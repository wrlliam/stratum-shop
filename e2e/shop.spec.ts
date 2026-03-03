import { test, expect } from '@playwright/test'

test.describe('Shop Browsing', () => {
  test('home page loads with hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Stratum/i)
    // Hero section should be visible
    const hero = page.locator('section').first()
    await expect(hero).toBeVisible()
  })

  test('navigate to products page', async ({ page }) => {
    await page.goto('/')
    await page.locator('a[href="/products"]').first().click()
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 })
    await expect(page.locator('main')).toBeVisible()
  })

  test('products page displays products', async ({ page }) => {
    await page.goto('/products')
    // Wait for products to load
    await page.waitForResponse('**/api/products**')
    // Should have product cards or empty state
    await expect(page.locator('main')).toBeVisible()
  })

  test('search products', async ({ page }) => {
    await page.goto('/products')
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      // Search should trigger API call
      await page.waitForTimeout(500) // debounce
    }
  })

  test('click product navigates to detail page', async ({ page }) => {
    await page.goto('/products')
    await page.waitForResponse('**/api/products**')

    // Click first product link if products exist
    const productLink = page.locator('a[href^="/products/"]').first()
    if (await productLink.isVisible()) {
      await productLink.click()
      await expect(page).toHaveURL(/\/products\//)
    }
  })

  test('recommendations page loads', async ({ page }) => {
    await page.goto('/recommendations')
    await expect(page.locator('main')).toBeVisible()
  })
})
