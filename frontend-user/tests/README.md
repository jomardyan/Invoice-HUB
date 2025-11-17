# Playwright E2E Tests for Invoice-HUB

## Overview

Comprehensive end-to-end tests for the new Polish invoice-related features using Playwright.

## Test Coverage

### Features Tested

1. **Receipts Management** (`receipts.spec.ts`)
   - Page display and navigation
   - Status filter tabs (All, Draft, Issued, Sent, Cancelled)
   - Data table with columns
   - Create receipt button
   - Action buttons

2. **Expense Management** (`expenses.spec.ts`)
   - Page display and navigation
   - Status tabs (All, Draft, Pending Approval, Approved, Paid, Rejected)
   - Category display with color coding
   - Data table with all columns
   - Add expense button
   - Action buttons (View, Edit, Approve, Reject, Mark Paid, Delete)

3. **Warehouse Management** (`warehouses.spec.ts`)
   - Page display and navigation
   - Data table with warehouse information
   - Low stock indicators
   - Warehouse types display
   - Add warehouse button
   - Action buttons

4. **Department Management** (`departments.spec.ts`)
   - Page display and navigation
   - Data table with department info
   - Budget tracking display
   - Manager assignment display
   - Add department button
   - Status management

5. **KSeF Integration** (`ksef.spec.ts`)
   - Dashboard display
   - Configuration panel with toggles
   - Statistics cards (Total, Accepted, Pending, Errors)
   - Submissions table
   - Configure button
   - Toggle interactions

6. **Backend-Frontend Integration** (`integration.spec.ts`)
   - API response validation for all features
   - Error handling tests
   - Navigation between pages
   - Data table functionality
   - Filtering and pagination

## Running Tests

### Prerequisites

```bash
# Install dependencies (already done)
npm install

# Install Playwright browsers
npx playwright install
```

### Run Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Run Specific Test Files

```bash
# Run only receipts tests
npx playwright test receipts.spec.ts

# Run only integration tests
npx playwright test integration.spec.ts

# Run specific test
npx playwright test -g "should display receipts list page"
```

## Test Structure

### Test Organization

Each test file follows this structure:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login and setup
  });

  test('should test specific functionality', async ({ page }) => {
    // Test implementation
  });
});
```

### Helper Functions

Common test utilities are available in `tests/helpers/test-utils.ts`:

- `TestHelpers.login()` - Login to application
- `TestHelpers.waitForApiResponse()` - Wait for API calls
- `TestHelpers.verifyTableLoaded()` - Check table visibility
- `TestHelpers.mockApiResponse()` - Mock API responses
- `TestHelpers.switchTab()` - Switch between tabs

## Test Configuration

Configuration is in `playwright.config.ts`:

- Base URL: `http://localhost:5173`
- Browsers: Chromium, Firefox, WebKit
- Screenshots: On failure
- Trace: On first retry
- Parallel execution enabled

## Writing New Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';

test('should display new feature', async ({ page }) => {
  // Navigate
  await page.goto('/new-feature');
  
  // Verify
  await expect(page.locator('h4')).toContainText('New Feature');
  
  // Interact
  await page.click('button:has-text("Action")');
  
  // Assert
  await expect(page).toHaveURL(/.*\/success/);
});
```

## Best Practices

1. **Use `data-testid` attributes** for stable selectors
2. **Wait for API responses** before assertions
3. **Mock API calls** when testing error states
4. **Keep tests independent** - no test should depend on another
5. **Use helper functions** for common operations
6. **Clean up** after tests if needed

## CI/CD Integration

Tests can run in CI with:

```bash
# Run in headless mode
CI=true npm run test:e2e
```

## Debugging

### Visual Debugging

```bash
# Open test in UI mode
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed
```

### Step-by-step Debugging

```bash
# Debug mode with inspector
npm run test:e2e:debug
```

### Screenshots and Traces

- Screenshots are saved on failure
- Traces available for failed tests
- View with: `npx playwright show-trace trace.zip`

## Coverage

Tests cover:
- ✅ All new page components
- ✅ Button interactions
- ✅ Tab navigation
- ✅ Data table display
- ✅ API integration
- ✅ Error handling
- ✅ Navigation flows

## Maintenance

Update tests when:
- Adding new features
- Changing UI components
- Modifying API endpoints
- Updating authentication flow

## Troubleshooting

### Common Issues

**Test timeout:**
```bash
# Increase timeout in playwright.config.ts
timeout: 60000
```

**Selector not found:**
- Check component is rendered
- Verify selector syntax
- Use `page.pause()` to debug

**API calls failing:**
- Ensure backend is running
- Check network tab in debug mode
- Verify API endpoints

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
