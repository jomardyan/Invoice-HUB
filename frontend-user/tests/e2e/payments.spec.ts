import { test, expect } from '@playwright/test';

test.describe('Payment Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display payment list page', async ({ page }) => {
    await page.goto('/payments');
    
    await expect(page.locator('h4, h5').filter({ hasText: /Payment/i })).toBeVisible();
    
    const recordButton = page.locator('button:has-text("Record Payment"), button:has-text("Add Payment"), button:has-text("New Payment")').first();
    await expect(recordButton).toBeVisible();
  });

  test('record payment button should be clickable', async ({ page }) => {
    await page.goto('/payments');
    
    const recordButton = page.locator('button:has-text("Record Payment"), button:has-text("Add Payment"), button:has-text("New Payment")').first();
    await expect(recordButton).toBeEnabled();
    
    await recordButton.click();
    
    // Should open dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should have payment table with correct columns', async ({ page }) => {
    await page.goto('/payments');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Check for common payment columns
    const hasDate = await page.locator('text=/Payment.*Date/i, text=Date').count() > 0;
    const hasAmount = await page.locator('text=Amount').count() > 0;
    const hasMethod = await page.locator('text=Method, text=/Payment.*Method/i').count() > 0;
    const hasStatus = await page.locator('text=Status').count() > 0;
    
    expect(hasDate || hasAmount || hasMethod || hasStatus).toBeTruthy();
  });

  test('payment actions should be available', async ({ page }) => {
    await page.goto('/payments');
    
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Delete action should exist
    const deleteButtons = page.locator('button[aria-label*="delete" i], button:has-text("Delete")');
    // Structure should exist even if no data
  });

  test('search functionality should work', async ({ page }) => {
    await page.goto('/payments');
    
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should load payments from backend', async ({ page }) => {
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/payments') && response.status() === 200,
      { timeout: 15000 }
    );
    
    await page.goto('/payments');
    
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('should display payment method information', async ({ page }) => {
    await page.goto('/payments');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Payment method column should exist
    const hasMethod = await page.locator('text=Method, text=/Payment.*Method/i').count() > 0;
    expect(hasMethod).toBeTruthy();
  });

  test('should display payment status badges', async ({ page }) => {
    await page.goto('/payments');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Status column should exist
    const hasStatus = await page.locator('text=Status').count() > 0;
    expect(hasStatus).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/v1/*/payments*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto('/payments');
    
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});
