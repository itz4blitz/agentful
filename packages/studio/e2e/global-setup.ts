/**
 * Global Test Setup
 *
 * Runs once before all tests
 * Use for global test initialization
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('\n=================================');
  console.log('🚀 Starting E2E Test Suite');
  console.log('=================================\n');

  // Log test environment
  console.log('Test Environment:', process.env.TEST_ENV || 'test');
  console.log('Base URL:', process.env.BASE_URL || 'http://localhost:5173');
  console.log('CI:', !!process.env.CI);
  console.log('');

  // Setup test database (if needed)
  // await setupTestDatabase();

  // Seed test data (if needed)
  // await seedTestData();

  // Start mock servers (if needed)
  // await startMockServers();

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
