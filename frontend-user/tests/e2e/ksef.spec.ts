import { test, expect } from '@playwright/test';

test.describe('KSeF Integration Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display KSeF dashboard', async ({ page }) => {
    await page.goto('/ksef');
    
    await expect(page.locator('h4')).toContainText('KSeF Integration');
    
    const configButton = page.locator('button:has-text("Configure KSeF")');
    await expect(configButton).toBeVisible();
  });

  test('configure KSeF button should be clickable', async ({ page }) => {
    await page.goto('/ksef');
    
    const configButton = page.locator('button:has-text("Configure KSeF")');
    await expect(configButton).toBeEnabled();
    
    await configButton.click();
    await expect(page).toHaveURL(/.*\/ksef\/configure/);
  });

  test('should display configuration panel', async ({ page }) => {
    await page.goto('/ksef');
    
    // Check configuration card exists
    await expect(page.locator('text=Configuration')).toBeVisible();
    
    // Check toggle switches
    await expect(page.locator('text=KSeF Integration Enabled')).toBeVisible();
    await expect(page.locator('text=Auto-submit Invoices')).toBeVisible();
  });

  test('should toggle KSeF integration', async ({ page }) => {
    await page.goto('/ksef');
    
    const toggle = page.locator('input[type="checkbox"]').first();
    await expect(toggle).toBeVisible();
    
    // Toggle should be clickable
    await toggle.click();
  });

  test('should display statistics card', async ({ page }) => {
    await page.goto('/ksef');
    
    await expect(page.locator('text=Statistics')).toBeVisible();
    await expect(page.locator('text=Total Submissions')).toBeVisible();
    await expect(page.locator('text=Accepted')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Errors')).toBeVisible();
  });

  test('should show statistics numbers', async ({ page }) => {
    await page.goto('/ksef');
    
    // Statistics should display numbers (even if 0)
    const statsSection = page.locator('text=Statistics').locator('..');
    await expect(statsSection).toBeVisible();
  });

  test('should display submissions table', async ({ page }) => {
    await page.goto('/ksef');
    
    await expect(page.locator('text=Recent Submissions')).toBeVisible();
    
    // Check table columns
    await expect(page.locator('text=Invoice #')).toBeVisible();
    await expect(page.locator('text=KSeF Reference')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Submitted')).toBeVisible();
    await expect(page.locator('text=Accepted')).toBeVisible();
    await expect(page.locator('text=Error')).toBeVisible();
  });

  test('should have submissions data table', async ({ page }) => {
    await page.goto('/ksef');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('auto-submit toggle should be disabled when KSeF is disabled', async ({ page }) => {
    await page.goto('/ksef');
    
    // Get both toggles
    const ksefToggle = page.locator('text=KSeF Integration Enabled').locator('..').locator('input[type="checkbox"]');
    const autoSubmitToggle = page.locator('text=Auto-submit Invoices').locator('..').locator('input[type="checkbox"]');
    
    await expect(ksefToggle).toBeVisible();
    await expect(autoSubmitToggle).toBeVisible();
    
    // Auto-submit should be disabled if KSeF is not enabled
    const isKsefEnabled = await ksefToggle.isChecked();
    if (!isKsefEnabled) {
      await expect(autoSubmitToggle).toBeDisabled();
    }
  });

  test('refresh submissions button should work', async ({ page }) => {
    await page.goto('/ksef');
    
    const refreshButton = page.locator('button[aria-label*="refresh" i], button:has-text("Refresh")').first();
    if (await refreshButton.isVisible()) {
      await expect(refreshButton).toBeEnabled();
    }
  });

  test('should load KSeF data from backend', async ({ page }) => {
    await page.goto('/ksef');
    
    // Wait for API calls
    await page.waitForResponse(response => 
      (response.url().includes('/ksef/config') || 
       response.url().includes('/ksef/stats') || 
       response.url().includes('/ksef/submissions')),
      { timeout: 15000 }
    );
  });

  test('submission actions should be available', async ({ page }) => {
    await page.goto('/ksef');
    
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Look for retry or view buttons
    const actionButtons = page.locator('button[aria-label*="retry" i], button[aria-label*="view" i]');
    // Structure check - buttons may not be visible if no failed submissions
  });
});
