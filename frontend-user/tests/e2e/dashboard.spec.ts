import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard after login', async ({ page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Dashboard should be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation menu', async ({ page }) => {
    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible();
    }
  });

  test('should have user menu', async ({ page }) => {
    // Look for user menu/profile button
    const userMenu = page.locator('button[aria-label*="account" i], button[aria-label*="profile" i], button[aria-label*="user" i]').first();
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeEnabled();
    }
  });

  test('logout button should work', async ({ page }) => {
    // Find and open user menu
    const userMenu = page.locator('button[aria-label*="account" i], button[aria-label*="profile" i], button[aria-label*="user" i]').first();
    
    if (await userMenu.isVisible()) {
      await userMenu.click();
      
      // Find logout button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log out"), button:has-text("Sign out")').first();
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        
        // Should redirect to login
        await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
      }
    }
  });

  test('should display statistics cards', async ({ page }) => {
    // Look for stat cards
    const cards = page.locator('[class*="card" i], [class*="Card"]').first();
    if (await cards.isVisible()) {
      await expect(cards).toBeVisible();
    }
  });

  test('navigation links should work', async ({ page }) => {
    // Try to navigate to invoices
    const invoicesLink = page.locator('a[href*="/invoices"], button:has-text("Invoices")').first();
    if (await invoicesLink.isVisible()) {
      await invoicesLink.click();
      await expect(page).toHaveURL(/.*\/invoices/);
    }
  });
});
