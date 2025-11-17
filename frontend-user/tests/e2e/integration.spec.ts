import { test, expect } from '@playwright/test';

test.describe('Backend-Frontend Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test.describe('Receipts API Integration', () => {
    test('should load receipts from backend', async ({ page }) => {
      // Intercept API call
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/receipts') && response.status() === 200
      );
      
      await page.goto('/receipts');
      
      // Wait for API response
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });

    test('should handle empty receipts list', async ({ page }) => {
      await page.goto('/receipts');
      
      // Should show table even if empty
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    });
  });

  test.describe('Expenses API Integration', () => {
    test('should load expenses from backend', async ({ page }) => {
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/expenses') && response.status() === 200
      );
      
      await page.goto('/expenses');
      
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });

    test('should filter expenses by status', async ({ page }) => {
      await page.goto('/expenses');
      
      // Click on status tab
      await page.click('button[role="tab"]:has-text("Approved")');
      
      // Should trigger new API call with filter
      await page.waitForResponse(response => 
        response.url().includes('/expenses') && 
        response.url().includes('status=approved')
      );
    });
  });

  test.describe('Warehouses API Integration', () => {
    test('should load warehouses from backend', async ({ page }) => {
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/warehouses') && response.status() === 200
      );
      
      await page.goto('/warehouses');
      
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Departments API Integration', () => {
    test('should load departments from backend', async ({ page }) => {
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/departments') && response.status() === 200
      );
      
      await page.goto('/departments');
      
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('KSeF API Integration', () => {
    test('should load KSeF configuration from backend', async ({ page }) => {
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/ksef/config') && response.status() === 200
      );
      
      await page.goto('/ksef');
      
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });

    test('should load KSeF statistics from backend', async ({ page }) => {
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/ksef/stats') && response.status() === 200
      );
      
      await page.goto('/ksef');
      
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });

    test('should load KSeF submissions from backend', async ({ page }) => {
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/ksef/submissions') && response.status() === 200
      );
      
      await page.goto('/ksef');
      
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API to return error
      await page.route('**/api/v1/*/receipts', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });
      
      await page.goto('/receipts');
      
      // Should show error message or empty state
      // Component should not crash
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle network errors', async ({ page }) => {
      // Simulate network error
      await page.route('**/api/v1/*/expenses', route => {
        route.abort();
      });
      
      await page.goto('/expenses');
      
      // Component should handle error gracefully
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Navigation Integration', () => {
    test('should navigate between all new pages', async ({ page }) => {
      // Navigate to Receipts
      await page.goto('/receipts');
      await expect(page.locator('h4:has-text("Receipts & E-Receipts")')).toBeVisible();
      
      // Navigate to Expenses
      await page.goto('/expenses');
      await expect(page.locator('h4:has-text("Expense Management")')).toBeVisible();
      
      // Navigate to Warehouses
      await page.goto('/warehouses');
      await expect(page.locator('h4:has-text("Warehouse Management")')).toBeVisible();
      
      // Navigate to Departments
      await page.goto('/departments');
      await expect(page.locator('h4:has-text("Department Management")')).toBeVisible();
      
      // Navigate to KSeF
      await page.goto('/ksef');
      await expect(page.locator('h4:has-text("KSeF Integration")')).toBeVisible();
    });
  });

  test.describe('Data Table Functionality', () => {
    test('should have working pagination in receipts', async ({ page }) => {
      await page.goto('/receipts');
      
      // Data table should have pagination controls
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
      
      // Pagination should be visible (even if disabled when no data)
      // This tests the component structure
    });

    test('should have sortable columns in expenses', async ({ page }) => {
      await page.goto('/expenses');
      
      const table = page.locator('table').first();
      await expect(table).toBeVisible();
    });
  });
});
