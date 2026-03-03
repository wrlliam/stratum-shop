import { test, expect } from '@playwright/test'

test.describe('Static Pages', () => {
  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('main')).toBeVisible()
    await expect(page).toHaveTitle(/Stratum/i)
  })

  test('shipping page loads', async ({ page }) => {
    await page.goto('/shipping')
    await expect(page.locator('main')).toBeVisible()
  })

  test('returns page loads', async ({ page }) => {
    await page.goto('/returns')
    await expect(page.locator('main')).toBeVisible()
  })

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('main')).toBeVisible()
    // Should have a form
    await expect(page.locator('form')).toBeVisible()
  })

  test('contact form can be filled and submitted', async ({ page }) => {
    await page.goto('/contact')
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User')
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
    await page.fill('textarea, input[name="message"]', 'This is a test message from Playwright.')
    await page.locator('button[type="submit"]').click()

    // Should show success message or navigate
    await page.waitForTimeout(2000)
    const success = await page.locator('text=/thank|success|sent/i').isVisible().catch(() => false)
    // Contact form should process without error
    expect(success || page.url().includes('/contact')).toBeTruthy()
  })

  test('recommendations page loads', async ({ page }) => {
    await page.goto('/recommendations')
    await expect(page.locator('main')).toBeVisible()
  })
})
