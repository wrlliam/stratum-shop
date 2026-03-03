import { test, expect } from '@playwright/test'

test.describe('Bundles', () => {
  test('bundles page loads', async ({ page }) => {
    await page.goto('/bundles')
    await expect(page.locator('main')).toBeVisible()
  })

  test('bundle detail page loads', async ({ page }) => {
    // Get a bundle from the API
    const response = await page.request.get('/api/bundles')
    const bundles = await response.json()

    if (!Array.isArray(bundles) || bundles.length === 0) {
      test.skip()
      return
    }

    const bundle = bundles[0]
    await page.goto(`/bundles/${bundle.id}`)
    await expect(page.locator('main')).toBeVisible()
  })

  test('bundle shows discount percentage', async ({ page }) => {
    const response = await page.request.get('/api/bundles')
    const bundles = await response.json()

    if (!Array.isArray(bundles) || bundles.length === 0) {
      test.skip()
      return
    }

    const bundle = bundles[0]
    await page.goto(`/bundles/${bundle.id}`)
    // Should display discount info
    await expect(page.locator('text=/%|off|discount|save/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('bundle has add to cart button', async ({ page }) => {
    const response = await page.request.get('/api/bundles')
    const bundles = await response.json()

    if (!Array.isArray(bundles) || bundles.length === 0) {
      test.skip()
      return
    }

    const bundle = bundles[0]
    await page.goto(`/bundles/${bundle.id}`)
    const addButton = page.locator('button', { hasText: /add to cart|add bundle/i })
    await expect(addButton).toBeVisible()
  })
})
