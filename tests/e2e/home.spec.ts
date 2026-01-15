import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/SaaS/i);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Pricing Page', () => {
  test('should display pricing plans', async ({ page }) => {
    await page.goto('/pricing');

    // Look for pricing-related content
    await expect(page.getByText(/pricing|planos|preços/i).first()).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should redirect to sign-in when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to sign-in or show auth UI
    await expect(page).toHaveURL(/sign-in|login|auth/);
  });

  test('sign-in page should load', async ({ page }) => {
    await page.goto('/sign-in');

    // Clerk sign-in component should be present
    await expect(page.locator('[data-clerk-component], form')).toBeVisible({ timeout: 10000 });
  });

  test('sign-up page should load', async ({ page }) => {
    await page.goto('/sign-up');

    // Clerk sign-up component should be present
    await expect(page.locator('[data-clerk-component], form')).toBeVisible({ timeout: 10000 });
  });
});
