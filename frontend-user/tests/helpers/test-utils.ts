import { Page } from '@playwright/test';

/**
 * Test utilities for Invoice-HUB Playwright tests
 */

export class TestHelpers {
  /**
   * Login to the application
   */
  static async login(page: Page, email = 'test@example.com', password = 'password123') {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  }

  /**
   * Wait for API response
   */
  static async waitForApiResponse(page: Page, urlPattern: string | RegExp) {
    return page.waitForResponse(response => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern) && response.status() === 200;
      }
      return urlPattern.test(url) && response.status() === 200;
    });
  }

  /**
   * Check if table is loaded and visible
   */
  static async verifyTableLoaded(page: Page) {
    const table = page.locator('table').first();
    await table.waitFor({ state: 'visible' });
    return table;
  }

  /**
   * Navigate to a specific tenant page
   */
  static async navigateToTenantPage(page: Page, tenantId: string, path: string) {
    await page.goto(`/${tenantId}${path}`);
  }

  /**
   * Verify page title
   */
  static async verifyPageTitle(page: Page, expectedTitle: string) {
    const title = page.locator('h4').first();
    await title.waitFor({ state: 'visible' });
    return title.textContent();
  }

  /**
   * Click button and wait for navigation
   */
  static async clickAndNavigate(page: Page, buttonText: string, expectedUrl: string | RegExp) {
    await page.click(`button:has-text("${buttonText}")`);
    await page.waitForURL(expectedUrl);
  }

  /**
   * Mock API response
   */
  static async mockApiResponse(page: Page, url: string | RegExp, data: any, status = 200) {
    await page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }

  /**
   * Mock API error
   */
  static async mockApiError(page: Page, url: string | RegExp, status = 500) {
    await page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error', status }),
      });
    });
  }

  /**
   * Get table row count
   */
  static async getTableRowCount(page: Page) {
    const rows = page.locator('table tbody tr');
    return rows.count();
  }

  /**
   * Verify status chip exists
   */
  static async verifyStatusChip(page: Page, status: string) {
    const chip = page.locator(`[class*="MuiChip"]:has-text("${status}")`);
    return chip.isVisible();
  }

  /**
   * Switch tab and verify selection
   */
  static async switchTab(page: Page, tabName: string) {
    await page.click(`button[role="tab"]:has-text("${tabName}")`);
    const tab = page.locator(`button[role="tab"]:has-text("${tabName}")`);
    const isSelected = await tab.getAttribute('aria-selected');
    return isSelected === 'true';
  }
}

export default TestHelpers;
