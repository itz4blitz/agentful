import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '../node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  // Allow resolving from parent node_modules
  server: {
    fs: {
      allow: ['..'],
    },
  },
  // Configure module resolution
  optimizeDeps: {
    exclude: ['vscode'],
  },
})
