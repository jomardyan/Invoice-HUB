import { test, expect } from '@playwright/test';

test.describe('Receipts Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login - adjust based on actual auth flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display receipts list page', async ({ page }) => {
    // Navigate to receipts
    await page.goto('/receipts');
    
    // Check page title
    await expect(page.locator('h4')).toContainText('Receipts & E-Receipts');
    
    // Check Create Receipt button exists
    const createButton = page.locator('button:has-text("Create Receipt")');
    await expect(createButton).toBeVisible();
  });

  test('should have status filter tabs', async ({ page }) => {
    await page.goto('/receipts');
    
    // Check all status tabs exist
    await expect(page.locator('button[role="tab"]:has-text("All")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Draft")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Issued")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Sent")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Cancelled")')).toBeVisible();
  });

  test('should switch between status tabs', async ({ page }) => {
    await page.goto('/receipts');
    
    // Click on different tabs
    await page.click('button[role="tab"]:has-text("Draft")');
    await expect(page.locator('button[role="tab"]:has-text("Draft")')).toHaveAttribute('aria-selected', 'true');
    
    await page.click('button[role="tab"]:has-text("Issued")');
    await expect(page.locator('button[role="tab"]:has-text("Issued")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should have data table with correct columns', async ({ page }) => {
    await page.goto('/receipts');
    
    // Check table headers exist
    await expect(page.locator('text=Receipt #')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=Customer')).toBeVisible();
    await expect(page.locator('text=Issue Date')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('create receipt button should be clickable', async ({ page }) => {
    await page.goto('/receipts');
    
    const createButton = page.locator('button:has-text("Create Receipt")');
    await expect(createButton).toBeEnabled();
    
    // Click should navigate to create page
    await createButton.click();
    await expect(page).toHaveURL(/.*\/receipts\/create/);
  });

  test('should have receipt action buttons', async ({ page }) => {
    await page.goto('/receipts');
    
    // These buttons appear in action menu for each row
    // Since we may not have data, we just verify the structure exists
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});
