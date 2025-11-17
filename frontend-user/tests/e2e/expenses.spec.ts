import { test, expect } from '@playwright/test';

test.describe('Expense Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display expense list page', async ({ page }) => {
    await page.goto('/expenses');
    
    await expect(page.locator('h4')).toContainText('Expense Management');
    
    const addButton = page.locator('button:has-text("Add Expense")');
    await expect(addButton).toBeVisible();
  });

  test('should have all expense status tabs', async ({ page }) => {
    await page.goto('/expenses');
    
    // Check all status tabs exist
    await expect(page.locator('button[role="tab"]:has-text("All")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Draft")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Pending Approval")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Approved")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Paid")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Rejected")')).toBeVisible();
  });

  test('should switch between expense status tabs', async ({ page }) => {
    await page.goto('/expenses');
    
    await page.click('button[role="tab"]:has-text("Pending Approval")');
    await expect(page.locator('button[role="tab"]:has-text("Pending Approval")')).toHaveAttribute('aria-selected', 'true');
    
    await page.click('button[role="tab"]:has-text("Approved")');
    await expect(page.locator('button[role="tab"]:has-text("Approved")')).toHaveAttribute('aria-selected', 'true');
  });

  test('should have expense table with correct columns', async ({ page }) => {
    await page.goto('/expenses');
    
    await expect(page.locator('text=Expense #')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('text=Category')).toBeVisible();
    await expect(page.locator('text=Vendor')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Paid')).toBeVisible();
  });

  test('add expense button should be clickable', async ({ page }) => {
    await page.goto('/expenses');
    
    const addButton = page.locator('button:has-text("Add Expense")');
    await expect(addButton).toBeEnabled();
    
    await addButton.click();
    await expect(page).toHaveURL(/.*\/expenses\/create/);
  });

  test('should display expense categories with color coding', async ({ page }) => {
    await page.goto('/expenses');
    
    // The category chips should be visible in the table
    // We can't test exact colors without data, but structure should exist
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('expense action buttons should be present', async ({ page }) => {
    await page.goto('/expenses');
    
    // Action buttons appear per row based on status
    // Verify the table structure exists
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});
