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
      include: ['lib/**/*.js', 'bin/**/*.js'],
      exclude: [
        'node_modules/**',
        'test/**',
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
      'test/**/*.spec.js'
    ],

    // Setup files
    setupFiles: [],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporters
    reporters: ['verbose'],

    // Aliases for imports
    alias: {
      '@': path.resolve(__dirname, './lib'),
      '@test': path.resolve(__dirname, './test')
    },

    // Isolation
    isolate: true,

    // Pool options
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './lib'),
      '@test': path.resolve(__dirname, './test')
    }
  }
});
