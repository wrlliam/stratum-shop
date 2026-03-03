import { test, expect } from '@playwright/test'

test.describe('Product Detail Page', () => {
  test('product detail page loads', async ({ page }) => {
    // First get a product slug from the API
    const response = await page.request.get('/api/products?limit=1')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)
    await expect(page.locator('main')).toBeVisible()
  })

  test('product shows price', async ({ page }) => {
    const response = await page.request.get('/api/products?limit=1')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)
    // Price should be displayed with £ symbol
    await expect(page.locator('text=£').first()).toBeVisible()
  })

  test('add to cart button exists', async ({ page }) => {
    const response = await page.request.get('/api/products?limit=1')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)
    const addButton = page.locator('button', { hasText: /add to cart/i })
    await expect(addButton).toBeVisible()
  })

  test('clicking add to cart opens cart drawer', async ({ page }) => {
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
    // Cart drawer or notification should appear
    await expect(page.locator('text=/cart/i').first()).toBeVisible({ timeout: 3000 })
  })

  test('product images are present', async ({ page }) => {
    const response = await page.request.get('/api/products?limit=1')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)
    // Should have at least one image
    const images = page.locator('img')
    await expect(images.first()).toBeVisible()
  })
})
