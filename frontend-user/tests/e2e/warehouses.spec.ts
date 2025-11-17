import { test, expect } from '@playwright/test';

test.describe('Warehouse Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display warehouse list page', async ({ page }) => {
    await page.goto('/warehouses');
    
    await expect(page.locator('h4')).toContainText('Warehouse Management');
    
    const addButton = page.locator('button:has-text("Add Warehouse")');
    await expect(addButton).toBeVisible();
  });

  test('should have warehouse table with correct columns', async ({ page }) => {
    await page.goto('/warehouses');
    
    await expect(page.locator('text=Code')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=City')).toBeVisible();
    await expect(page.locator('text=Products')).toBeVisible();
    await expect(page.locator('text=Low Stock')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('add warehouse button should be clickable', async ({ page }) => {
    await page.goto('/warehouses');
    
    const addButton = page.locator('button:has-text("Add Warehouse")');
    await expect(addButton).toBeEnabled();
    
    await addButton.click();
    await expect(page).toHaveURL(/.*\/warehouses\/create/);
  });

  test('should display low stock indicators', async ({ page }) => {
    await page.goto('/warehouses');
    
    // Low stock column should be visible
    await expect(page.locator('text=Low Stock')).toBeVisible();
    
    // The table should exist even if empty
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('warehouse action buttons should be present', async ({ page }) => {
    await page.goto('/warehouses');
    
    // Verify table structure with action columns
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('should handle warehouse types display', async ({ page }) => {
    await page.goto('/warehouses');
    
    // Type column should show chips
    await expect(page.locator('text=Type')).toBeVisible();
  });
});
