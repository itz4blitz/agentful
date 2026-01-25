import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global setup and teardown
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['lib/**/*.js', 'bin/**/*.js', 'mcp/**/*.js'],
      exclude: [
        'node_modules/**',
        'test/**',
        'mcp/test/**',
        'docs/**',
        'template/**',
        '.claude/**',
        '.agentful/**',
        'bin/hooks/**'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },

    // Test file patterns
    include: [
      'test/**/*.test.js',
      'test/**/*.spec.js',
      'mcp/test/**/*.test.js',
      'mcp/test/**/*.spec.js'
    ],

    // Setup files
    setupFiles: ['./vitest.setup.js'],

    // Global teardown to cleanup processes
    globalTeardown: './vitest.global-teardown.js',

    // Timeouts - increased for performance tests with concurrent operations
    testTimeout: 120000,
    hookTimeout: 60000,
    teardownTimeout: 10000,

    // Reporters
    reporters: ['basic'],

    // Aliases for imports
    alias: {
      '@': path.resolve(__dirname, './lib'),
      '@test': path.resolve(__dirname, './test'),
      '@mcp': path.resolve(__dirname, './mcp')
    },

    // Isolation
    isolate: true,

    // Pool options - use forks instead of threads to support process.chdir()
    // (Worker threads don't support process.chdir() which is needed by hook tests)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    },

    // Control parallelism to prevent resource exhaustion
    fileParallelism: true
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './lib'),
      '@test': path.resolve(__dirname, './test'),
      '@mcp': path.resolve(__dirname, './mcp')
    }
  }
});
