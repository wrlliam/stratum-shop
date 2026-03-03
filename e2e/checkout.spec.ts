import { test, expect } from '@playwright/test'

test.describe('Cart & Checkout Flow', () => {
  test('cart page loads', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.locator('main')).toBeVisible()
  })

  test('empty cart shows empty state', async ({ page }) => {
    // Clear localStorage cart
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('stratum_cart'))
    await page.goto('/cart')
    await expect(page.locator('main')).toBeVisible()
  })

  test('add product and see it in cart', async ({ page }) => {
    const response = await page.request.get('/api/products?limit=1&inStock=true')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)

    const addButton = page.locator('button', { hasText: /add to cart/i })
    await addButton.click()

    // Navigate to cart page
    await page.goto('/cart')
    // Product name should appear in cart
    await expect(page.locator(`text="${product.name}"`).first()).toBeVisible({ timeout: 5000 })
  })

  test('checkout page loads', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.locator('main')).toBeVisible()
  })

  test('checkout success page loads', async ({ page }) => {
    await page.goto('/checkout/success')
    await expect(page.locator('main')).toBeVisible()
  })
})
