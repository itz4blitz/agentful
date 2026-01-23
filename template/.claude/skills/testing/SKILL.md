---
name: testing
description: Test strategy, patterns, and coverage optimization for quality assurance
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Testing Strategy Skill

## Testing Pyramid

Distribute tests following the 70/20/10 rule:
- **70% Unit Tests** - Fast, isolated, test individual functions/methods
- **20% Integration Tests** - Test component interactions, APIs, database operations
- **10% E2E Tests** - Test complete user workflows end-to-end

## Test Structure: AAA Pattern

**Arrange - Act - Assert**

```
test('should create user with valid data', () => {
  // ARRANGE: Set up test data and dependencies
  const userData = { email: 'test@example.com', password: 'secure123' };
  const mockRepository = createMockRepository();
  const service = new UserService(mockRepository);

  // ACT: Execute the function under test
  const result = service.createUser(userData);

  // ASSERT: Verify expected outcomes
  expect(result.email).toBe(userData.email);
  expect(mockRepository.save).toHaveBeenCalled();
});
```

## Coverage Requirements

**Minimum Thresholds:**
- Overall coverage: 80%
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Critical code requires 95%+ coverage:**
- Authentication and authorization
- Payment processing
- Security functions
- Data encryption/decryption
- Financial calculations
- Access control logic

## What to Test

### High Priority (Must Cover)
- Business logic and algorithms
- Authentication and authorization flows
- Data validation and sanitization
- API endpoints and request handlers
- Database operations and queries
- Error handling and edge cases
- Security-sensitive operations

### Medium Priority (Should Cover)
- Utility functions and helpers
- State management logic
- Form validation
- UI component behavior
- Caching logic
- External service integrations

### Low Priority (Nice to Cover)
- Simple getters/setters
- Configuration loaders
- Logging statements
- Trivial formatting functions

## Mocking Strategy

### When to Mock
- External API calls (third-party services)
- Database connections (for unit tests)
- File system operations
- Email/SMS services
- Payment gateways
- Time-dependent code (dates, timers)
- Random number generation

### When NOT to Mock
- The code under test
- Pure functions without side effects
- Simple data transformations
- Integration tests (test real interactions)
- Domain models

## Test Data Management

**Use Fixtures for Consistent Test Data:**
```
fixtures/
├── users.js         # Standard user test data
├── products.js      # Product test data
└── orders.js        # Order test data
```

**Create Data Factories:**
```
function createUserFixture(overrides = {}) {
  return {
    id: generateId(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    ...overrides
  };
}
```

## Test Organization

```
project/
├── src/
│   ├── services/
│   │   ├── userService.js
│   │   └── userService.test.js      # Co-located with source
│   └── utils/
│       ├── validators.js
│       └── validators.test.js
├── tests/
│   ├── integration/                  # Integration tests
│   │   ├── api/
│   │   └── database/
│   ├── e2e/                          # End-to-end tests
│   ├── fixtures/                     # Shared test data
│   └── setup.js                      # Global test setup
└── test.config.js
```

## Running Tests

**Stack-Agnostic Commands:**

Consult your test framework's documentation for specific commands:
- Run all tests
- Run with coverage
- Run specific test file
- Run tests matching pattern
- Run in watch mode
- Update snapshots (if applicable)

## Common Test Frameworks by Language

**JavaScript/TypeScript:**
- Jest, Vitest, Mocha, Jasmine
- E2E: Playwright, Cypress, Puppeteer

**Python:**
- pytest, unittest, nose
- E2E: Selenium, Playwright

**Go:**
- testing package, testify
- E2E: chromedp, Selenium

**Java:**
- JUnit 5, TestNG
- E2E: Selenium, Playwright

**Rust:**
- Built-in test framework
- E2E: headless_chrome

**Ruby:**
- RSpec, Minitest
- E2E: Capybara

## Rules

### DO
- Write tests before marking features complete
- Test behavior, not implementation details
- Test error cases and edge cases
- Use descriptive test names
- Keep tests independent (no shared state)
- Mock external dependencies
- Test critical paths with high coverage
- Clean up test data after each test

### DON'T
- Skip tests to speed up development
- Test implementation details
- Share mutable state between tests
- Commit commented-out tests
- Leave TODOs in test files
- Test private methods directly
- Write tests that depend on execution order
- Hardcode dates or random values
- Ignore flaky tests (fix or remove them)
- Test framework code or third-party libraries

## Coverage Analysis

**Identify Coverage Gaps:**
1. Run coverage report
2. Find uncovered lines/branches
3. Assess criticality of uncovered code
4. Write tests for critical uncovered code
5. Accept lower coverage for non-critical paths

**Coverage is a metric, not a goal:**
- 80% coverage with good tests > 100% coverage with bad tests
- Focus on testing critical paths thoroughly
- Some code is too trivial to test

## Integration with Validation

The tester agent uses this skill for:
- Planning test strategy
- Writing comprehensive tests
- Achieving coverage thresholds
- Following testing best practices

The reviewer agent validates:
- Tests are passing
- Coverage meets 80% threshold
- No skipped/ignored tests without justification
