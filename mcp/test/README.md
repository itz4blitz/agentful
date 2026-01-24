# MCP Server Test Suite

Comprehensive integration tests for the agentful MCP server implementation.

## Test Structure

```
mcp/test/
├── server.test.js                      # Core server functionality
├── tools/
│   └── launch-specialist.test.js       # Tool-specific tests
├── resources/
│   └── state.test.js                   # Resource access tests
├── adapters/
│   └── execution-adapter.test.js       # Executor integration tests
├── integration/
│   └── end-to-end.test.js              # Full MCP flow tests
└── fixtures/
    ├── mock-state.json                 # Test state data
    ├── mock-completion.json            # Test completion data
    ├── mock-executor.js                # Mock AgentExecutor
    ├── test-helpers.js                 # Shared test utilities
    └── test-agents/                    # Test agent definitions
        ├── backend.md
        └── frontend.md
```

## Running Tests

### Run all MCP tests
```bash
npm test -- mcp/test
```

### Run specific test file
```bash
npm test -- mcp/test/server.test.js
```

### Run with coverage
```bash
npm run test:coverage -- mcp/test
```

### Watch mode
```bash
npm run test:watch -- mcp/test
```

## Test Coverage

The test suite covers:

### Server Tests (`server.test.js`)
- ✅ Server initialization with custom options
- ✅ Tool registration (8 tools)
- ✅ Resource registration (4 resources)
- ✅ Error handling for unknown tools/resources
- ✅ Server lifecycle and graceful shutdown

### Tool Tests (`tools/launch-specialist.test.js`)
- ✅ Valid agent launch with unique execution IDs
- ✅ Context passing (empty, complex objects)
- ✅ Error handling (invalid agent, special characters)
- ✅ Response format validation
- ✅ Concurrent agent launches

### Resource Tests (`resources/state.test.js`)
- ✅ Read existing state file successfully
- ✅ Handle missing state file gracefully
- ✅ JSON formatting and MIME types
- ✅ State content validation
- ✅ Concurrent reads
- ✅ State updates reflection

### Adapter Tests (`adapters/execution-adapter.test.js`)
- ✅ Integration with lib/pipeline/executor.js
- ✅ Async execution tracking
- ✅ Error propagation
- ✅ Cancellation support
- ✅ Event emission (started, completed, failed)
- ✅ Progress callbacks
- ✅ Context passing to executor

### Integration Tests (`integration/end-to-end.test.js`)
- ✅ Full agent launch → status → result flow
- ✅ Resource access integration
- ✅ Tool listing and discovery
- ✅ Error handling across the stack
- ✅ Real-world usage scenarios:
  - Typical development workflow
  - Cancellation workflow
  - Progress update workflow
  - Validation workflow
- ✅ Data consistency across operations
- ✅ Performance with rapid calls

## Test Utilities

### Mock Executor (`fixtures/mock-executor.js`)
Simulates `AgentExecutor` without spawning real processes:
- Configurable delays and failures
- Event emission
- Execution tracking
- Status management

### Test Helpers (`fixtures/test-helpers.js`)
- `createTestEnvironment()` - Creates temporary test directory
- `cleanupTestEnvironment()` - Cleans up test directory
- `waitFor()` - Async condition polling
- `createMockMCPClient()` - Mock MCP client
- `createTestProductSpec()` - Generate test product spec

## Coverage Goals

Target: **≥80% coverage** across all metrics

| Metric | Target | Current |
|--------|--------|---------|
| Lines | ≥80% | TBD |
| Branches | ≥80% | TBD |
| Functions | ≥80% | TBD |
| Statements | ≥80% | TBD |

## Test Patterns

### AAA Pattern (Arrange-Act-Assert)
All tests follow this structure:
```javascript
it('should do something', async () => {
  // Arrange: Set up test data
  const testData = { ... };

  // Act: Execute the operation
  const result = await server.callTool('name', testData);

  // Assert: Verify expectations
  expect(result).toBeDefined();
});
```

### Test Isolation
- Each test has `beforeEach` setup
- Each test has `afterEach` cleanup
- Tests don't depend on each other
- Temporary directories for file operations

### Async Testing
- Uses `async/await` for clarity
- `waitFor()` helper for async conditions
- Proper cleanup in `afterEach`

## Debugging Tests

### Enable verbose logging
```bash
DEBUG=agentful:* npm test -- mcp/test
```

### Run single test
```javascript
it.only('should do something', async () => {
  // This test will run alone
});
```

### Skip test temporarily
```javascript
it.skip('should do something', async () => {
  // This test will be skipped
});
```

## Common Issues

### Test timeouts
If tests timeout, increase the timeout:
```javascript
it('long running test', async () => {
  // test code
}, 30000); // 30 second timeout
```

### File system race conditions
Use `waitFor()` instead of `setTimeout()`:
```javascript
// Bad
await new Promise(resolve => setTimeout(resolve, 100));

// Good
await waitFor(() => condition);
```

### Cleanup not happening
Always use `afterEach` for cleanup:
```javascript
afterEach(async () => {
  await cleanupTestEnvironment(testDir);
  mockExecutor.reset();
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-release checks

### GitHub Actions
```yaml
- name: Run MCP tests
  run: npm test -- mcp/test --coverage
```

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Use descriptive test names
3. Add tests for both success and error paths
4. Ensure tests are isolated
5. Update coverage thresholds if needed
6. Document complex test scenarios

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Model Context Protocol Spec](https://spec.modelcontextprotocol.io)
- [agentful Testing Guide](../../docs/testing.md)
