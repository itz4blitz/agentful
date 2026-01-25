import { beforeEach, afterEach } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';

// Prevent MaxListenersExceededWarning in tests
// Each server instance adds SIGINT listeners, and with concurrent tests
// we can easily exceed the default limit of 10
beforeEach(() => {
  process.setMaxListeners(100);
});

// Reset to default after each test to avoid affecting other tests
afterEach(() => {
  process.setMaxListeners(10);
});
