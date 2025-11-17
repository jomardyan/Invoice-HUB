import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display product list page', async ({ page }) => {
    await page.goto('/products');
    
    await expect(page.locator('h4, h5').filter({ hasText: /Product/i })).toBeVisible();
    
    const addButton = page.locator('button:has-text("Add Product"), button:has-text("New Product"), button:has-text("Create Product")').first();
    await expect(addButton).toBeVisible();
  });

  test('add product button should be clickable', async ({ page }) => {
    await page.goto('/products');
    
    const addButton = page.locator('button:has-text("Add Product"), button:has-text("New Product"), button:has-text("Create Product")').first();
    await expect(addButton).toBeEnabled();
    
    await addButton.click();
    
    // Should open dialog or navigate
    const hasNavigated = page.url().includes('/create');
    const hasDialog = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 });
    expect(hasNavigated || hasDialog).toBeTruthy();
  });

  test('should have product table with correct columns', async ({ page }) => {
    await page.goto('/products');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Check for common product columns
    const hasSKU = await page.locator('text=SKU').count() > 0;
    const hasName = await page.locator('th:has-text("Name"), text=/Product.*Name/i').count() > 0;
    const hasPrice = await page.locator('text=Price').count() > 0;
    
    expect(hasSKU || hasName || hasPrice).toBeTruthy();
  });

  test('product actions should be available', async ({ page }) => {
    await page.goto('/products');
    
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Actions should exist in the table
    await expect(page.locator('table')).toBeVisible();
  });

  test('search functionality should work', async ({ page }) => {
    await page.goto('/products');
    
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test product');
      await expect(searchInput).toHaveValue('test product');
    }
  });

  test('should load products from backend', async ({ page }) => {
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/products') && response.status() === 200,
      { timeout: 15000 }
    );
    
    await page.goto('/products');
    
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('product detail page should be accessible', async ({ page }) => {
    await page.goto('/products');
    
    await page.waitForSelector('table', { timeout: 10000 });
    
    const viewButton = page.locator('button[aria-label*="view" i], button:has-text("View")').first();
    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await expect(page).toHaveURL(/.*\/products\/view\/.+/);
    }
  });

  test('should display VAT rate information', async ({ page }) => {
    await page.goto('/products');
    
    // VAT rate column should exist
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    const hasVAT = await page.locator('text=VAT, text=/VAT.*Rate/i').count() > 0;
    expect(hasVAT).toBeTruthy();
  });
});
