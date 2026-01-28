import { defineConfig, devices } from '@playwright/test';
import { defineConfig as defineBddConfig } from 'playwright-bdd';

/**
 * Read environment variables
 */
const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const testEnv = process.env.TEST_ENV || 'test';

/**
 * Playwright Configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Test match pattern
  testMatch: '**/*.spec.ts',

  // Timeout per test
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5 * 1000,
  },

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit the number of workers on CI
  workers: process.env.CI ? 2 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['list'],
  ],

  // Shared settings for all tests
  use: {
    // Base URL for tests
    baseURL,

    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Action timeout
    actionTimeout: 10 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors (for testing)
    ignoreHTTPSErrors: true,

    // Locale
    locale: 'en-US',

    // Timezone
    timezoneId: 'America/New_York',

    // User agent
    userAgent: 'Agentful-E2E-Test',

    // Capture console logs
    // Uncomment to debug console issues
    // launchOptions: {
    //   args: ['--enable-logging', '--log-level=0'],
    // },
  },

  // Configure projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },

    // Test against production preview (staging)
    {
      name: 'staging',
      use: {
        baseURL: process.env.STAGING_URL || 'https://staging.example.com',
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',

  // Global setup and teardown
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
});

/**
 * BDD Configuration (optional)
 * Uncomment if using Cucumber/Gherkin syntax
 */
// const bddConfig = defineBddConfig({
//   features: 'e2e/features/**/*.feature',
//   steps: 'e2e/steps/**/*.ts',
// });
