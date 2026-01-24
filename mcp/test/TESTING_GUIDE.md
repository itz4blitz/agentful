# MCP Testing Guide

Complete guide for testing the Model Context Protocol implementation in agentful.

## Quick Start

```bash
# Run all MCP tests
npm run test:mcp

# Run with coverage
npm run test:mcp:coverage

# Watch mode
npm run test:mcp:watch

# Run specific suite
npx vitest run mcp/test/unit
npx vitest run mcp/test/integration
npx vitest run mcp/test/e2e
npx vitest run mcp/test/performance
npx vitest run mcp/test/security
```

## Test Organization

### Unit Tests (`mcp/test/unit/`)

Test individual components in isolation with all dependencies mocked.

**Transports**:
- `transports/stdio-transport.test.js` - stdio communication
- `transports/sse-transport.test.js` - SSE/HTTP communication

**Client**:
- `client/mcp-client.test.js` - MCP client operations

**Future Components**:
- `orchestrator/` - Distributed orchestration (when implemented)
- `auth/` - OAuth 2.1 flows (when implemented)

### Integration Tests (`mcp/test/integration/`)

Test interaction between components with minimal mocking.

- `multi-transport.test.js` - Cross-transport communication
- `end-to-end.test.js` - Full MCP protocol flows

### E2E Tests (`mcp/test/e2e/`)

Test complete user workflows from start to finish.

- `full-workflow.test.js` - Feature development lifecycle

### Performance Tests (`mcp/test/performance/`)

Test system performance under various loads.

- `load-test.test.js` - Concurrent requests, throughput, latency

### Security Tests (`mcp/test/security/`)

Test security aspects and attack prevention.

- `transport-security.test.js` - Input validation, injection prevention

## Writing Tests

### Test Structure

Follow the AAA pattern (Arrange-Act-Assert):

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ComponentName', () => {
  let component;

  beforeEach(() => {
    // Arrange: Setup
    component = createComponent();
  });

  afterEach(() => {
    // Cleanup
    component.destroy();
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange: Prepare test data
      const input = { foo: 'bar' };

      // Act: Execute operation
      const result = component.process(input);

      // Assert: Verify outcome
      expect(result).toBeDefined();
      expect(result.foo).toBe('bar');
    });
  });
});
```

### Mocking Best Practices

**Do Mock**:
- External APIs
- File system operations
- Network calls
- Time-dependent code

**Don't Mock**:
- The code under test
- Pure functions
- Simple data transformations

```javascript
import { vi } from 'vitest';

// Mock external module
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('mock data')
}));

// Mock executor
import { MockExecutor } from '../../fixtures/mock-executor.js';
const mockExecutor = new MockExecutor();
```

### Async Testing

```javascript
// Using async/await
it('should handle async operations', async () => {
  const result = await asyncOperation();
  expect(result).toBe('success');
});

// Waiting for events
it('should emit event', async () => {
  const eventPromise = new Promise(resolve => {
    emitter.once('event', resolve);
  });

  emitter.trigger();

  const data = await eventPromise;
  expect(data).toBeDefined();
});

// Timeout handling
it('should timeout', async () => {
  await expect(async () => {
    await longOperation();
  }).rejects.toThrow('timeout');
}, { timeout: 5000 });
```

### Test Fixtures

Use shared fixtures for common test data:

```javascript
import {
  createTestEnvironment,
  cleanupTestEnvironment,
  createTestProductSpec
} from '../../fixtures/test-helpers.js';

beforeEach(async () => {
  testDir = await createTestEnvironment();
  await createTestProductSpec(testDir);
});

afterEach(async () => {
  await cleanupTestEnvironment(testDir);
});
```

## Test Coverage

### Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:mcp:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Configuration

See `vitest.config.js`:

```javascript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  include: ['mcp/**/*.js'],
  exclude: [
    'mcp/test/**',
    'mcp/node_modules/**'
  ],
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80
}
```

## Performance Testing

### Benchmarking

```javascript
it('should handle 100 concurrent requests in < 5s', async () => {
  const startTime = Date.now();

  const requests = Array(100).fill(null).map(() =>
    server.request({ method: 'tools/list' })
  );

  await Promise.all(requests);

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(5000);
});
```

### Measuring Latency

```javascript
it('should measure p50/p95/p99 latencies', async () => {
  const latencies = [];

  for (let i = 0; i < 1000; i++) {
    const start = process.hrtime.bigint();
    await operation();
    const end = process.hrtime.bigint();

    latencies.push(Number(end - start) / 1000000);
  }

  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  expect(p50).toBeLessThan(10);
  expect(p95).toBeLessThan(50);
  expect(p99).toBeLessThan(100);
});
```

### Memory Testing

```javascript
it('should not leak memory', async () => {
  if (global.gc) global.gc();
  const baseline = process.memoryUsage().heapUsed;

  // Perform operations
  for (let i = 0; i < 100; i++) {
    await operation();
  }

  if (global.gc) global.gc();
  const after = process.memoryUsage().heapUsed;

  const growth = (after - baseline) / 1024 / 1024;
  expect(growth).toBeLessThan(50); // Less than 50MB growth
});
```

## Security Testing

### Input Validation

```javascript
it('should reject malformed input', async () => {
  const malicious = [
    '{"__proto__": {"polluted": true}}',
    '<script>alert("xss")</script>',
    'A'.repeat(10 * 1024 * 1024) // 10MB
  ];

  for (const input of malicious) {
    const result = await process(input);
    // Should reject or sanitize
    expect(result.success).toBe(false);
  }
});
```

### Error Disclosure

```javascript
it('should not expose internal paths', async () => {
  const outputs = [];

  // Trigger error
  await expect(invalidOperation()).rejects.toThrow();

  // Check error messages
  outputs.forEach(output => {
    expect(output).not.toMatch(/\/Users\//);
    expect(output).not.toMatch(/node_modules/);
  });
});
```

## Debugging Tests

### Run Single Test

```bash
npx vitest run mcp/test/unit/transports/stdio-transport.test.js
```

### Run with Debug Logging

```bash
LOG_LEVEL=debug npx vitest run mcp/test
```

### Use Node Inspector

```bash
node --inspect-brk node_modules/.bin/vitest run mcp/test
```

### Console Output

```javascript
it('should debug something', () => {
  console.log('Debug info:', data);

  // Note: Use spyOn to suppress logs in tests
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  // Your test...

  consoleSpy.mockRestore();
});
```

## Common Issues

### Port Already in Use

**Problem**: SSE transport tests fail with `EADDRINUSE`

**Solution**: Use random ports or ensure cleanup

```javascript
const testPort = 9876 + Math.floor(Math.random() * 100);
```

### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solution**: Check for:
- Timing-dependent code (use proper waits)
- Shared state between tests (ensure cleanup)
- Race conditions (use proper async/await)

### Memory Leaks

**Problem**: Tests slow down or run out of memory

**Solution**:
- Clean up resources in `afterEach`
- Remove event listeners
- Close connections

```javascript
afterEach(async () => {
  await transport.stop();
  mockExecutor.reset();
  await cleanupTestEnvironment(testDir);
});
```

### Coverage Not Updating

**Problem**: Changes not reflected in coverage

**Solution**:
```bash
rm -rf coverage/
rm -rf node_modules/.vite
npm run test:mcp:coverage
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`
- Changes to `mcp/**` files

See `.github/workflows/mcp-test.yml`

### Running Locally Like CI

```bash
# Simulate CI environment
CI=true npm run test:mcp:coverage

# Check coverage threshold
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "Coverage too low: $COVERAGE%"
  exit 1
fi
```

## Test Quality Checklist

Before submitting tests:

- [ ] All tests follow AAA pattern
- [ ] Tests are isolated (no dependencies between tests)
- [ ] Tests are deterministic (same result every run)
- [ ] Tests are fast (unit tests < 100ms each)
- [ ] Mocks are used appropriately
- [ ] Cleanup is performed in `afterEach`
- [ ] Test names are descriptive
- [ ] Edge cases are covered
- [ ] Error paths are tested
- [ ] Coverage threshold met (80%+)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)
- [Test Coverage](https://vitest.dev/guide/coverage.html)
- [Mocking Guide](https://vitest.dev/guide/mocking.html)
