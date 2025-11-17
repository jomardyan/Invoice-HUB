import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login page with all elements', async ({ page }) => {
      await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();
      await expect(page.locator('text=Sign in to continue to Invoice-HUB')).toBeVisible();
      
      // Check form fields
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      
      // Check buttons and links
      await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible();
      await expect(page.locator('a[href="/register"]:has-text("Sign up")')).toBeVisible();
    });

    test('sign in button should be enabled', async ({ page }) => {
      const signInButton = page.locator('button[type="submit"]:has-text("Sign In")');
      await expect(signInButton).toBeEnabled();
    });

    test('email field should accept input', async ({ page }) => {
      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    });

    test('password field should mask input', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await passwordInput.fill('testpassword');
      await expect(passwordInput).toHaveValue('testpassword');
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Invalid email address')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '12345');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible({ timeout: 5000 });
    });

    test('sign up link should navigate to register page', async ({ page }) => {
      await page.click('a[href="/register"]');
      await expect(page).toHaveURL(/.*\/register/);
    });

    test('form should disable inputs during submission', async ({ page }) => {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      
      // Mock API to delay response
      await page.route('**/api/v1/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      });
      
      await page.click('button[type="submit"]');
      
      // Inputs should be disabled during loading
      await expect(page.locator('input[name="email"]')).toBeDisabled();
      await expect(page.locator('input[name="password"]')).toBeDisabled();
    });
  });

  test.describe('Register Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('should display register page with all elements', async ({ page }) => {
      await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();
      await expect(page.locator('text=Sign up to start managing your invoices')).toBeVisible();
      
      // Check form fields
      await expect(page.locator('input[name="tenantName"]')).toBeVisible();
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      
      // Check buttons
      await expect(page.locator('button[type="submit"]:has-text("Create Account")')).toBeVisible();
      await expect(page.locator('a[href="/login"]:has-text("Sign in")')).toBeVisible();
    });

    test('create account button should be enabled', async ({ page }) => {
      const createButton = page.locator('button[type="submit"]:has-text("Create Account")');
      await expect(createButton).toBeEnabled();
    });

    test('all form fields should accept input', async ({ page }) => {
      await page.fill('input[name="tenantName"]', 'Test Company');
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="password"]', 'securepassword123');
      await page.fill('input[name="confirmPassword"]', 'securepassword123');
      
      await expect(page.locator('input[name="tenantName"]')).toHaveValue('Test Company');
      await expect(page.locator('input[name="firstName"]')).toHaveValue('John');
      await expect(page.locator('input[name="lastName"]')).toHaveValue('Doe');
      await expect(page.locator('input[name="email"]')).toHaveValue('john@example.com');
    });

    test('password toggle should work', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"]');
      const toggleButton = page.locator('button[aria-label="toggle password visibility"]').first();
      
      // Initially should be password type
      await expect(passwordInput).toHaveAttribute('type', 'password');
      
      // Click toggle
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      
      // Click again to hide
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should show error for missing fields', async ({ page }) => {
      await page.click('button[type="submit"]');
      await expect(page.locator('text=All fields are required')).toBeVisible();
    });

    test('should show error for password mismatch', async ({ page }) => {
      await page.fill('input[name="tenantName"]', 'Test Company');
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="password"]', 'securepassword123');
      await page.fill('input[name="confirmPassword"]', 'differentpassword');
      
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should show error for short password', async ({ page }) => {
      await page.fill('input[name="tenantName"]', 'Test Company');
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Doe');
      await page.fill('input[name="email"]', 'john@example.com');
      await page.fill('input[name="password"]', 'short');
      await page.fill('input[name="confirmPassword"]', 'short');
      
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Password must be at least 12 characters')).toBeVisible();
    });

    test('sign in link should navigate to login page', async ({ page }) => {
      await page.click('a[href="/login"]');
      await expect(page).toHaveURL(/.*\/login/);
    });
  });
});
