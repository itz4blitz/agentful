import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.js';

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    // Use threads instead of forks for integration tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    // Only run integration tests
    include: ['test/integration/**/*.test.js'],
    // Shorter timeout for faster feedback
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  }
});
