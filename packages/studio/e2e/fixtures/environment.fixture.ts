/**
 * Environment Fixture
 *
 * Provides environment-specific configuration and setup
 * Handles different environments (dev, staging, prod)
 */

import { test as base, Page } from '@playwright/test';

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  name: Environment;
  baseURL: string;
  apiURL: string;
  timeout: number;
  retries: number;
  screenshotOnFailure: boolean;
  videoOnFailure: boolean;
  traceOnFailure: boolean;
}

/**
 * Environment configurations
 */
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    name: 'development',
    baseURL: 'http://localhost:5173',
    apiURL: 'http://localhost:5173/api',
    timeout: 10000,
    retries: 0,
    screenshotOnFailure: true,
    videoOnFailure: false,
    traceOnFailure: true,
  },
  staging: {
    name: 'staging',
    baseURL: 'https://staging.example.com',
    apiURL: 'https://staging-api.example.com',
    timeout: 15000,
    retries: 2,
    screenshotOnFailure: true,
    videoOnFailure: true,
    traceOnFailure: true,
  },
  production: {
    name: 'production',
    baseURL: 'https://example.com',
    apiURL: 'https://api.example.com',
    timeout: 20000,
    retries: 3,
    screenshotOnFailure: true,
    videoOnFailure: true,
    traceOnFailure: true,
  },
  test: {
    name: 'test',
    baseURL: 'http://localhost:5173',
    apiURL: 'http://localhost:5173/api',
    timeout: 10000,
    retries: 0,
    screenshotOnFailure: true,
    videoOnFailure: false,
    traceOnFailure: 'retain-on-failure' as any,
  },
};

/**
 * Get current environment from env var or default to test
 */
export function getCurrentEnvironment(): Environment {
  const env = (process.env.TEST_ENV || 'test') as Environment;
  return env;
}

/**
 * Get environment config
 */
export function getEnvironmentConfig(env?: Environment): EnvironmentConfig {
  const environment = env || getCurrentEnvironment();
  return environments[environment];
}

/**
 * Environment fixture type
 */
export type EnvironmentFixtures = {
  env: EnvironmentConfig;
  environment: Environment;
};

/**
 * Extend test with environment fixture
 */
export const test = base.extend<EnvironmentFixtures>({
  // Current environment
  environment: async ({}, use) => {
    const env = getCurrentEnvironment();
    await use(env);
  },

  // Environment config
  env: async ({ environment }, use) => {
    const config = getEnvironmentConfig(environment);
    await use(config);
  },
});

/**
 * Setup environment before tests
 */
export async function setupEnvironment(page: Page, config: EnvironmentConfig): Promise<void> {
  // Set base URL
  await page.goto(config.baseURL);

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Set geolocation (if needed)
  // await page.setGeolocation({ latitude: 51.509865, longitude: -0.118092 });

  // Set timezone
  await page.emulateMedia({ timezoneId: 'America/New_York' });
}

/**
 * Cleanup environment after tests
 */
export async function cleanupEnvironment(page: Page): Promise<void> {
  // Clear cookies
  await page.context().clearCookies();

  // Clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Mock API responses for testing
 */
export async function mockAPI(page: Page, mocks: Record<string, any>): Promise<void> {
  for (const [route, handler] of Object.entries(mocks)) {
    await page.route(route, handler);
  }
}

/**
 * Setup test data in database
 * (Implement based on your backend)
 */
export async function setupTestData(data: any): Promise<void> {
  // Placeholder for test data setup
  // In a real app, you might call API endpoints or directly seed database
}

/**
 * Cleanup test data from database
 */
export async function cleanupTestData(): Promise<void> {
  // Placeholder for test data cleanup
}
