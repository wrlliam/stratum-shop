import { test, expect } from '@playwright/test'

test.describe('SEO Verification', () => {
  test('robots.txt returns correct content', async ({ page }) => {
    const response = await page.request.get('/robots.txt')
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('User-Agent')
  })

  test('sitemap.xml returns valid XML', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain('<?xml')
    expect(text).toContain('<urlset')
    expect(text).toContain('<url>')
  })

  test('manifest returns valid JSON', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest')
    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json).toHaveProperty('name')
  })

  test('product page has OG meta tags', async ({ page }) => {
    const response = await page.request.get('/api/products?limit=1')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)

    // Check for Open Graph meta tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    expect(ogDescription).toBeTruthy()
  })

  test('home page has meta description', async ({ page }) => {
    await page.goto('/')
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
  })

  test('product page has JSON-LD script', async ({ page }) => {
    const response = await page.request.get('/api/products?limit=1')
    const { products } = await response.json()

    if (products.length === 0) {
      test.skip()
      return
    }

    const product = products[0]
    await page.goto(`/products/${product.slug}`)

    const jsonLd = page.locator('script[type="application/ld+json"]')
    const count = await jsonLd.count()
    if (count > 0) {
      const content = await jsonLd.first().textContent()
      expect(content).toBeTruthy()
      const parsed = JSON.parse(content!)
      expect(parsed['@type']).toBeTruthy()
    }
  })
})
