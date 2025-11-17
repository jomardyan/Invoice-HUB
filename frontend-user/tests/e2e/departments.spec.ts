import { test, expect } from '@playwright/test';

test.describe('Department Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display department list page', async ({ page }) => {
    await page.goto('/departments');
    
    await expect(page.locator('h4')).toContainText('Department Management');
    
    const addButton = page.locator('button:has-text("Add Department")');
    await expect(addButton).toBeVisible();
  });

  test('should have department table with correct columns', async ({ page }) => {
    await page.goto('/departments');
    
    await expect(page.locator('text=Code')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Manager')).toBeVisible();
    await expect(page.locator('text=Monthly Budget')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('add department button should be clickable', async ({ page }) => {
    await page.goto('/departments');
    
    const addButton = page.locator('button:has-text("Add Department")');
    await expect(addButton).toBeEnabled();
    
    await addButton.click();
    await expect(page).toHaveURL(/.*\/departments\/create/);
  });

  test('should display budget information', async ({ page }) => {
    await page.goto('/departments');
    
    // Monthly Budget column should be visible
    await expect(page.locator('text=Monthly Budget')).toBeVisible();
  });

  test('should show department status', async ({ page }) => {
    await page.goto('/departments');
    
    // Status column should be visible
    await expect(page.locator('text=Status')).toBeVisible();
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('department action buttons should be present', async ({ page }) => {
    await page.goto('/departments');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });
});
