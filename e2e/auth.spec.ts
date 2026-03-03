import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('main')).toBeVisible()
    // Should have email and password inputs
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"], input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()

    // Should show an error message
    await expect(page.locator('text=/error|invalid|incorrect/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
  })

  test('reset password page renders', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.locator('main')).toBeVisible()
  })

  test('orders page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/orders')
    // Should either redirect to login or show an auth message
    await page.waitForTimeout(2000)
    const url = page.url()
    const hasLoginRedirect = url.includes('/login')
    const hasAuthMessage = await page.locator('text=/sign in|log in|unauthorized/i').isVisible().catch(() => false)
    expect(hasLoginRedirect || hasAuthMessage).toBeTruthy()
  })
})
