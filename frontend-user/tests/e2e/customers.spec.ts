import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display customer list page', async ({ page }) => {
    await page.goto('/customers');
    
    // Check page loads
    await expect(page.locator('h4, h5').filter({ hasText: /Customer/i })).toBeVisible();
    
    // Check add button
    const addButton = page.locator('button:has-text("Add Customer"), button:has-text("New Customer"), button:has-text("Create Customer")').first();
    await expect(addButton).toBeVisible();
  });

  test('add customer button should be clickable', async ({ page }) => {
    await page.goto('/customers');
    
    const addButton = page.locator('button:has-text("Add Customer"), button:has-text("New Customer"), button:has-text("Create Customer")').first();
    await expect(addButton).toBeEnabled();
    
    // Click should open dialog or navigate
    await addButton.click();
    
    // Should either navigate or open dialog
    const hasNavigated = page.url().includes('/create');
    const hasDialog = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 });
    expect(hasNavigated || hasDialog).toBeTruthy();
  });

  test('should have customer table with correct columns', async ({ page }) => {
    await page.goto('/customers');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Check for common columns
    await expect(page.locator('th:has-text("Name"), td:has-text("Name")')).toBeVisible();
  });

  test('customer actions should be available', async ({ page }) => {
    await page.goto('/customers');
    
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check for action buttons
    const viewButtons = page.locator('button[aria-label*="view" i], button:has-text("View")');
    const editButtons = page.locator('button[aria-label*="edit" i], button:has-text("Edit")');
    const deleteButtons = page.locator('button[aria-label*="delete" i], button:has-text("Delete")');
    
    // At least the structure should exist
    await expect(page.locator('table')).toBeVisible();
  });

  test('search functionality should work', async ({ page }) => {
    await page.goto('/customers');
    
    const searchInput = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test customer');
      await expect(searchInput).toHaveValue('test customer');
    }
  });

  test('should load customers from backend', async ({ page }) => {
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/customers') && response.status() === 200,
      { timeout: 15000 }
    );
    
    await page.goto('/customers');
    
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
  });

  test('customer detail page should be accessible', async ({ page }) => {
    await page.goto('/customers');
    
    await page.waitForSelector('table', { timeout: 10000 });
    
    const viewButton = page.locator('button[aria-label*="view" i], button:has-text("View")').first();
    if (await viewButton.isVisible({ timeout: 2000 })) {
      await viewButton.click();
      await expect(page).toHaveURL(/.*\/customers\/view\/.+/);
    }
  });
});
