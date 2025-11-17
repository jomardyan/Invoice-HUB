# Playwright End-to-End Tests for Invoice-HUB

## Overview
This directory contains comprehensive Playwright tests for all features of the Invoice-HUB application frontend.

## Test Coverage

### Authentication Tests (`auth.spec.ts`)
- ✅ Login page display and elements
- ✅ Login form validation (email, password)
- ✅ Sign in button functionality
- ✅ Navigation to register page
- ✅ Form input handling
- ✅ Register page display and elements
- ✅ Registration form validation
- ✅ Password visibility toggle
- ✅ Form submission handling

### Dashboard Tests (`dashboard.spec.ts`)
- ✅ Dashboard display after login
- ✅ Navigation menu presence
- ✅ User menu functionality
- ✅ Logout functionality
- ✅ Statistics cards display
- ✅ Navigation links

### Invoice Tests (`invoices.spec.ts`)
- ✅ Invoice list page display
- ✅ Create invoice button
- ✅ Status tabs/filters
- ✅ Invoice table with columns
- ✅ Search functionality
- ✅ Invoice actions (view, edit, delete)
- ✅ Invoice create page (multi-step form)
- ✅ Invoice detail page navigation
- ✅ Invoice edit functionality
- ✅ API integration tests

### Customer Tests (`customers.spec.ts`)
- ✅ Customer list page display
- ✅ Add customer button and dialog
- ✅ Customer table columns
- ✅ Customer actions (view, edit, delete)
- ✅ Search functionality
- ✅ Customer detail page
- ✅ API integration

### Product Tests (`products.spec.ts`)
- ✅ Product list page display
- ✅ Add product button and dialog
- ✅ Product table columns (SKU, Name, Price, VAT)
- ✅ Product actions
- ✅ Search functionality
- ✅ Product detail page
- ✅ VAT rate display
- ✅ API integration

### Payment Tests (`payments.spec.ts`)
- ✅ Payment list page display
- ✅ Record payment button and dialog
- ✅ Payment table columns
- ✅ Payment method display
- ✅ Payment status badges
- ✅ Search functionality
- ✅ Delete payment action
- ✅ API integration and error handling

### Receipt Tests (`receipts.spec.ts`)
- ✅ Receipt list page display
- ✅ Create receipt button
- ✅ Status filter tabs (All, Draft, Issued, Sent, Cancelled)
- ✅ Tab switching functionality
- ✅ Receipt table columns
- ✅ Receipt actions
- ✅ Empty state handling
- ✅ API integration

### Expense Tests (`expenses.spec.ts`)
- ✅ Expense list page display
- ✅ Add expense button
- ✅ Status tabs (All, Draft, Pending, Approved, Paid, Rejected)
- ✅ Tab switching
- ✅ Expense table columns
- ✅ Category display with color coding
- ✅ Expense actions

### Department Tests (`departments.spec.ts`)
- ✅ Department list page display
- ✅ Add department button
- ✅ Department table columns
- ✅ Budget information display
- ✅ Department status
- ✅ Department actions

### Warehouse Tests (`warehouses.spec.ts`)
- ✅ Warehouse list page display
- ✅ Add warehouse button
- ✅ Warehouse table columns
- ✅ Warehouse type display
- ✅ Low stock indicators
- ✅ Search functionality
- ✅ Warehouse actions
- ✅ API integration

### KSeF Integration Tests (`ksef.spec.ts`)
- ✅ KSeF dashboard display
- ✅ Configure KSeF button
- ✅ Configuration panel
- ✅ KSeF integration toggle
- ✅ Auto-submit toggle
- ✅ Statistics display
- ✅ Submissions table
- ✅ Submission actions
- ✅ API integration

### Reports Tests (`reports.spec.ts`)
- ✅ Reports page display
- ✅ Report type tabs/navigation
- ✅ Date range filters
- ✅ Generate report button
- ✅ Report data/charts display
- ✅ Export functionality
- ✅ Sales report
- ✅ Aging report
- ✅ Customer analytics
- ✅ JPK-FA generator

### Templates & Notifications Tests (`templates-notifications.spec.ts`)
- ✅ Templates page display
- ✅ Create template button
- ✅ Template list/grid
- ✅ Template actions
- ✅ Notifications page display
- ✅ Notification list
- ✅ Notification filters
- ✅ Mark as read functionality
- ✅ API integration

### Integrations Tests (`integrations.spec.ts`)
- ✅ Integrations page display
- ✅ Integration tabs
- ✅ API key management section
- ✅ Generate API key button
- ✅ API key actions (copy, revoke, delete)
- ✅ Webhook management section
- ✅ Create webhook button
- ✅ Webhook actions (edit, test, delete)
- ✅ API integration

### Settings Tests (`settings.spec.ts`)
- ✅ Settings page display
- ✅ Settings navigation tabs
- ✅ Profile settings display
- ✅ Profile form fields
- ✅ Save profile button
- ✅ Company settings display
- ✅ Save company button
- ✅ Allegro settings
- ✅ Allegro connect button
- ✅ BaseLinker settings
- ✅ BaseLinker API key field
- ✅ Cancel button
- ✅ API integration

### Integration Tests (`integration.spec.ts`)
- ✅ Backend-Frontend API integration
- ✅ Receipts API integration
- ✅ Expenses API integration with filters
- ✅ Warehouses API integration
- ✅ Departments API integration
- ✅ KSeF API integration (config, stats, submissions)
- ✅ Error handling tests
- ✅ Network error handling
- ✅ Navigation integration
- ✅ Data table functionality

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npm run test:e2e auth.spec.ts
```

### Run tests in UI mode
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Test Statistics

- **Total Test Files**: 16
- **Total Test Cases**: ~160 tests
- **Browser Coverage**: Chromium, Firefox, WebKit
- **Coverage Areas**: 
  - Authentication & Authorization
  - CRUD Operations (Create, Read, Update, Delete)
  - Form Validation
  - Button Functionality
  - Navigation
  - API Integration
  - Error Handling
  - UI Components

## Test Design Principles

1. **Comprehensive Coverage**: All major features and buttons are tested
2. **Button Testing**: Every interactive button is verified for:
   - Visibility
   - Enabled state
   - Click functionality
   - Expected behavior
3. **Flexible Assertions**: Tests use flexible selectors and multiple fallback checks
4. **API Integration**: Tests verify backend communication
5. **Error Handling**: Tests ensure graceful error handling
6. **Real User Flows**: Tests simulate actual user interactions

## Notes

- Tests require the development server to be running (automatically started by Playwright)
- Some tests may need backend API to be running for full integration testing
- Tests use flexible selectors to handle UI variations
- Screenshots are captured on test failures for debugging
