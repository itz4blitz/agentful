---
name: testing
description: Guides test strategy, planning, and coverage optimization for quality assurance
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Testing Strategy Skill

## Responsibilities

### 1. Test Planning
- Identify what needs testing (unit, integration, E2E)
- Determine appropriate test coverage for each layer
- Plan test data and fixtures
- Design mocking strategies

### 2. Coverage Strategy
- Achieve 80%+ code coverage
- Focus on critical paths first
- Balance coverage vs. test value
- Identify coverage gaps

### 3. Test Patterns
- Unit test patterns (AAA: Arrange, Act, Assert)
- Integration test patterns (API, database)
- E2E test patterns (user workflows)
- Performance test patterns (load, stress)

### 4. Framework Selection
- Recommend testing frameworks by stack
- Configure test runners
- Set up test environments

## Workflow

### 1. Identify Testing Layers

**Unit Tests (70% of tests):**
- Pure functions
- Business logic
- Utility functions
- Validation rules
- Service layer methods
- Domain models

**Integration Tests (20% of tests):**
- API endpoints
- Database operations
- External service integrations
- Authentication flows
- Cache interactions
- Message queue handlers

**E2E Tests (10% of tests):**
- Critical user workflows
- Multi-step processes
- Cross-feature interactions
- Complete user journeys

### 2. Framework Recommendations

#### JavaScript/TypeScript
- **Unit/Integration:** Jest, Vitest
- **E2E:** Playwright, Cypress
- **API Testing:** Supertest, MSW (Mock Service Worker)
- **Component Testing:** React Testing Library, Testing Library

#### Python
- **Unit/Integration:** pytest, unittest
- **E2E:** Selenium, Playwright
- **API Testing:** pytest-httpx, responses
- **Mocking:** unittest.mock, pytest-mock

#### Go
- **Unit/Integration:** testing package, testify
- **E2E:** Playwright, chromedp
- **API Testing:** httptest package
- **Mocking:** testify/mock, gomock

#### Java
- **Unit/Integration:** JUnit 5, TestNG
- **E2E:** Selenium, Playwright
- **API Testing:** REST Assured, MockMvc
- **Mocking:** Mockito, PowerMock

### 3. Test Structure (AAA Pattern)

```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // ARRANGE - Set up test data and mocks
      const userData = {
        email: 'test@example.com',
        password: 'securePassword123',
        name: 'Test User'
      };
      const mockRepository = {
        save: jest.fn().mockResolvedValue({ id: 1, ...userData }),
        findByEmail: jest.fn().mockResolvedValue(null)
      };
      const service = new UserService(mockRepository);

      // ACT - Execute the function under test
      const result = await service.createUser(userData);

      // ASSERT - Verify expected outcomes
      expect(result.id).toBe(1);
      expect(result.email).toBe(userData.email);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name
        })
      );
    });

    it('should throw error for duplicate email', async () => {
      // ARRANGE
      const userData = {
        email: 'existing@example.com',
        password: 'securePassword123'
      };
      const mockRepository = {
        findByEmail: jest.fn().mockResolvedValue({ id: 1, email: userData.email }),
        save: jest.fn()
      };
      const service = new UserService(mockRepository);

      // ACT & ASSERT
      await expect(service.createUser(userData)).rejects.toThrow(
        'User with this email already exists'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should hash password before saving', async () => {
      // Test implementation details that matter for security
      const userData = {
        email: 'test@example.com',
        password: 'plainTextPassword'
      };
      const mockRepository = {
        save: jest.fn().mockResolvedValue({ id: 1, ...userData }),
        findByEmail: jest.fn().mockResolvedValue(null)
      };
      const service = new UserService(mockRepository);

      await service.createUser(userData);

      const savedUser = mockRepository.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe('plainTextPassword');
      expect(savedUser.password).toHaveLength(60); // bcrypt hash length
    });
  });
});
```

### 4. Coverage Strategies

#### High-Value Coverage

**Must cover (critical paths):**
- Authentication/authorization
- Payment processing
- Data validation and sanitization
- Security-sensitive operations
- Financial calculations
- Data encryption/decryption
- Access control logic

**Should cover (core features):**
- Business logic
- API endpoints
- Database operations
- State management
- Error handling
- Caching logic

**Nice to cover (supporting code):**
- Utility functions
- Formatting helpers
- UI components
- Configuration loaders

#### Coverage Metrics

```markdown
**Branch Coverage:**
- Test all if/else branches
- Test switch/case statements
- Test ternary operators
- Test error handling paths

**Edge Cases:**
- Empty arrays/objects
- Null/undefined values
- Boundary values (min, max, zero)
- Invalid input types
- Concurrent operations
```

### 5. Test Data Management

```javascript
// fixtures/users.js
export const validUser = {
  email: 'valid@example.com',
  password: 'Password123!',
  name: 'Test User',
  role: 'user'
};

export const adminUser = {
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  name: 'Admin User',
  role: 'admin'
};

export const invalidUser = {
  email: 'invalid-email',  // Missing @
  password: '123',         // Too short
  name: ''                 // Empty name
};

export const createUserFixture = (overrides = {}) => ({
  ...validUser,
  ...overrides,
  id: Math.floor(Math.random() * 10000)
});

// Use in tests
import { validUser, invalidUser, createUserFixture } from '../fixtures/users';

// Create unique test data
const testUser = createUserFixture({ email: 'unique@example.com' });
```

#### Database Test Data

```javascript
// test/setup.js
import { setupTestDatabase, teardownTestDatabase } from './utils';

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Clear database between tests
afterEach(async () => {
  await clearAllTables();
});

// test/utils.js
export async function seedTestData() {
  const user = await db.users.create(validUser);
  const post = await db.posts.create({ userId: user.id, title: 'Test Post' });
  return { user, post };
}
```

### 6. Mocking Strategy

#### When to Mock

```markdown
**Always Mock:**
- External API calls (third-party services)
- Database connections (for unit tests)
- File system operations
- Email/SMS services
- Payment gateways
- Time-dependent code (Date.now(), timers)
- Random number generation
- Network requests

**Sometimes Mock:**
- Internal services (unit tests: yes, integration tests: no)
- Cache layers (depending on test type)
- Authentication middleware (depending on test focus)
```

#### When NOT to Mock

```markdown
**Never Mock:**
- The code under test
- Pure functions without side effects
- Simple data transformations
- Domain models
- Integration tests (test real interactions)
- Libraries that are part of the behavior
```

#### Mocking Examples

```javascript
// Mock external API
jest.mock('../services/paymentGateway', () => ({
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    transactionId: 'tx_123'
  })
}));

// Mock Date for time-dependent tests
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01'));
});

afterEach(() => {
  jest.useRealTimers();
});

// Mock filesystem
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('file contents'),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

// Partial mocks (mock some methods, keep others)
jest.mock('../services/userService', () => {
  const actual = jest.requireActual('../services/userService');
  return {
    ...actual,
    sendEmail: jest.fn() // Only mock this method
  };
});
```

### 7. Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- users.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create user"

# Run in watch mode
npm test -- --watch

# Run E2E tests
npm run test:e2e

# Run tests for changed files only
npm test -- --onlyChanged

# Update snapshots
npm test -- --updateSnapshot

# Run with verbose output
npm test -- --verbose

# Run tests in parallel (faster)
npm test -- --maxWorkers=4
```

### 8. Test Organization

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
│   │   │   ├── users.test.js
│   │   │   └── auth.test.js
│   │   └── database/
│   │       └── repositories.test.js
│   ├── e2e/                          # End-to-end tests
│   │   ├── user-registration.test.js
│   │   └── checkout-flow.test.js
│   ├── fixtures/                     # Test data
│   │   ├── users.js
│   │   └── products.js
│   ├── mocks/                        # Mock implementations
│   │   └── services/
│   └── setup.js                      # Global test setup
└── jest.config.js
```

## Test Coverage Goals

### Minimum Requirements
```markdown
**Overall Metrics:**
- Overall: 80%
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Critical Code (95%+ required):**
- Authentication/Authorization
- Payment processing
- Security functions
- Data encryption/decryption
- Financial calculations
- Access control

**Core Features (85%+ required):**
- Business logic
- API endpoints
- Data validation
- Database operations

**Supporting Code (70%+ acceptable):**
- Utility functions
- Formatters
- Logging
- Configuration
```

### Coverage Reports

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/index.js'
  ],
  coverageThresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    './src/services/auth/**/*.js': {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    }
  },
  coverageReporters: ['text', 'lcov', 'html']
};
```

## Test Patterns by Type

### Unit Test Pattern

```javascript
// Test pure business logic
describe('calculateDiscount', () => {
  it('should apply 10% discount for orders over $100', () => {
    const order = { total: 150, items: [] };
    const discount = calculateDiscount(order);
    expect(discount).toBe(15);
  });

  it('should not apply discount for orders under $100', () => {
    const order = { total: 50, items: [] };
    const discount = calculateDiscount(order);
    expect(discount).toBe(0);
  });

  it('should handle zero total', () => {
    const order = { total: 0, items: [] };
    const discount = calculateDiscount(order);
    expect(discount).toBe(0);
  });
});
```

### Integration Test Pattern

```javascript
// Test API endpoints with database
describe('POST /api/users', () => {
  let app;
  let db;

  beforeAll(async () => {
    app = await createTestApp();
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await db.users.deleteMany({});
  });

  it('should create user and return 201', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body).toMatchObject({
      email: userData.email,
      name: userData.name
    });
    expect(response.body.password).toBeUndefined();
    expect(response.body.id).toBeDefined();

    // Verify database state
    const savedUser = await db.users.findOne({ email: userData.email });
    expect(savedUser).toBeDefined();
  });
});
```

### E2E Test Pattern

```javascript
// test/e2e/user-registration.test.js
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete full registration process', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill in form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="name"]', 'New User');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify welcome message
    await expect(page.locator('h1')).toContainText('Welcome, New User');

    // Verify user menu shows email
    await page.click('[data-testid="user-menu"]');
    await expect(page.locator('[data-testid="user-email"]'))
      .toContainText('newuser@example.com');
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    await page.goto('/register');

    // Try to submit with invalid email
    await page.fill('[name="email"]', 'invalid-email');
    await page.fill('[name="password"]', '123');
    await page.click('button[type="submit"]');

    // Verify error messages
    await expect(page.locator('.error-email'))
      .toContainText('Invalid email address');
    await expect(page.locator('.error-password'))
      .toContainText('Password must be at least 8 characters');
  });
});
```

### Performance Test Pattern

```javascript
// Load testing with k6
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const response = http.get('https://api.example.com/users');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

## Rules

### DO
- ALWAYS write tests before marking feature complete
- DO focus on behavior, not implementation details
- DO test error cases and edge cases
- DO use descriptive test names ("it should..." or "should...")
- DO keep tests independent (no shared state)
- DO mock external dependencies
- DO test critical paths with 95%+ coverage
- DO write tests that document expected behavior
- DO use test fixtures for consistent data
- DO clean up test data after each test
- DO use setup/teardown hooks appropriately
- DO test both happy paths and error paths

### DON'T
- NEVER skip tests to speed up development
- NEVER test implementation details (test behavior)
- NEVER share mutable state between tests
- NEVER commit commented-out tests
- NEVER leave TODOs in test files
- NEVER test private methods directly (test through public API)
- NEVER write tests that depend on execution order
- NEVER hardcode dates or random values (use fixtures/mocks)
- NEVER ignore flaky tests (fix them or remove them)
- NEVER test framework code or third-party libraries

## Integration with Other Skills

### Used by Tester Agent
- Provides test planning guidance
- Defines coverage requirements
- Recommends testing frameworks

### References
- **Validation Skill:** For coverage checks and quality gates
- **Backend Skill:** For understanding what to test in services/APIs
- **Frontend Skill:** For component and E2E testing strategies

### Workflow Integration
1. **Before Implementation:** Plan test strategy
2. **During Implementation:** Write tests alongside code (TDD)
3. **After Implementation:** Verify coverage meets thresholds
4. **Before PR:** Ensure all tests pass and coverage is adequate

## Technology-Specific Guidance

### JavaScript/TypeScript (Jest/Vitest)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: ['src/**/*.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/test/'],
};

// Setup file
import '@testing-library/jest-dom';

global.beforeEach(() => {
  jest.clearAllMocks();
});
```

### Python (pytest)

```python
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = --cov=src --cov-report=html --cov-report=term

# conftest.py
import pytest

@pytest.fixture
def db_session():
    session = create_test_session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture
def test_user():
    return {
        'email': 'test@example.com',
        'password': 'Password123!'
    }
```

### Go (testing package)

```go
// user_service_test.go
package service

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestCreateUser(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    mockRepo.On("Save", mock.Anything).Return(nil)
    service := NewUserService(mockRepo)

    // Act
    user, err := service.CreateUser("test@example.com", "password")

    // Assert
    assert.NoError(t, err)
    assert.NotNil(t, user)
    mockRepo.AssertExpectations(t)
}
```

## Summary

This skill provides comprehensive guidance for:
- Planning test strategies across all layers
- Achieving optimal coverage while maximizing test value
- Following industry-standard testing patterns
- Selecting and configuring appropriate testing frameworks
- Writing maintainable, reliable tests
- Integrating testing into the development workflow

Use this skill to ensure high-quality, well-tested code that prevents regressions and documents expected behavior.
