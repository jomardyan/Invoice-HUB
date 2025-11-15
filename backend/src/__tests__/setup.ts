// Setup file for Jest tests
// This file runs before all tests to configure the test environment

// Mock localStorage if not available
if (typeof localStorage === 'undefined') {
  (global as any).localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

  // Polyfill TextEncoder / TextDecoder for Node versions where it's not available
  if (typeof (global as any).TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    (global as any).TextEncoder = TextEncoder;
    (global as any).TextDecoder = TextDecoder;
  }

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: navigation') ||
        args[0].includes('Error: Could not find a default'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
