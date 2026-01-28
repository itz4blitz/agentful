# E2E Test Infrastructure

Complete end-to-end testing infrastructure for agentful_web using Playwright.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Test Infrastructure](#test-infrastructure)
  - [Helpers](#helpers)
  - [Fixtures](#fixtures)
  - [Base Classes](#base-classes)
  - [Configuration](#configuration)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [Running Tests](#running-tests)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)

## Overview

This infrastructure provides:

- **Reusable helpers** for common testing tasks (selectors, assertions, theme testing, screenshots, performance)
- **Powerful fixtures** for app pages, environment config, device emulation, test data, and API mocking
- **Base test classes** for page-level and component-level testing
- **TypeScript types** for full type safety
- **Playwright configuration** with multiple browsers and devices
- **Global setup/teardown** for test environment management

## Installation

```bash
# Install dependencies
npm install -D @playwright/test @faker-js/faker

# Install Playwright browsers
npx playwright install

# Install specific browsers only
npx playwright install chromium
```

## Directory Structure

```
e2e/
├── helpers/                    # Helper utilities
│   ├── test-data-generator.ts  # Generate test data with faker
│   ├── selectors.ts            # Common selectors and locators
│   ├── assertions.ts           # Custom assertion methods
│   ├── theme-helper.ts         # Theme switching utilities
│   ├── screenshot-helper.ts    # Screenshot and visual regression
│   └── performance-helper.ts   # Performance measurement
│
├── fixtures/                   # Test fixtures
│   ├── app.fixture.ts         # Main app page object
│   ├── environment.fixture.ts # Environment configuration
│   ├── device.fixture.ts      # Device emulation
│   ├── data.fixture.ts        # Test data generators
│   └── api.fixture.ts         # API mocking and interception
│
├── base/                       # Base test classes
│   ├── base-test.ts           # Foundation for all tests
│   ├── base-page-test.ts      # Page-level testing
│   └── base-component-test.ts # Component-level testing
│
├── types.d.ts                  # TypeScript type definitions
├── global-setup.ts            # Global test setup
├── global-teardown.ts         # Global test teardown
├── example.spec.ts            # Example tests
└── README.md                  # This file
```

## Quick Start

### 1. Run Example Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/example.spec.ts

# Run in specific browser
npx playwright test --project=chromium
```

### 2. Write Your First Test

```typescript
import { test } from './fixtures/app.fixture';

test('my first test', async ({ app, selectors, assertions }) => {
  // Navigate to page
  await app.goto();

  // Interact with page
  await selectors.byText('Click me').click();

  // Assert results
  await assertions.assertVisible(selectors.byText('Success!'));
});
```

## Test Infrastructure

### Helpers

#### Test Data Generator (`test-data-generator.ts`)

Generate realistic test data using faker:

```typescript
import { generateTestUser, generateFormData } from './helpers/test-data-generator';

// Generate user
const user = generateTestUser({ role: 'admin' });

// Generate form data
const formData = generateFormData({
  email: 'email',
  password: 'password',
  name: 'name',
});
```

#### Selectors (`selectors.ts`)

Reusable selector strategies:

```typescript
import { createSelectors } from './helpers/selectors';

const selectors = createSelectors(page);

// By data-testid
await selectors.byTestId('submit-button').click();

// By text
await selectors.byText('Submit').click();

// By role
await selectors.byRole('button', { name: 'Submit' }).click();

// Predefined helpers
await selectors.header.click();
await selectors.themeToggle.click();
await selectors.buttonByText('Submit').click();
```

#### Assertions (`assertions.ts`)

Custom assertion methods:

```typescript
import { createAssertions } from './helpers/assertions';

const assertions = createAssertions(page);

// Visibility
await assertions.assertVisible(element);
await assertions.assertHidden(element);

// Text content
await assertions.assertText(element, 'Expected text');
await assertions.assertTextContains(element, 'partial text');

// Attributes
await assertions.assertAttribute(element, 'href', '/expected-path');

// State
await assertions.assertEnabled(element);
await assertions.assertDisabled(element);
await assertions.assertChecked(checkbox);

// Accessibility
await assertions.assertAccessible(element);
await assertions.assertA11yLabel(element, 'Label text');
```

#### Theme Helper (`theme-helper.ts`)

Test dark/light mode:

```typescript
import { createThemeHelper } from './helpers/theme-helper';

const themeHelper = createThemeHelper(page);

// Get/set theme
await themeHelper.setTheme('dark');
await themeHelper.assertTheme('dark');

// Toggle theme
await themeHelper.toggleTheme();

// Test persistence
await themeHelper.assertThemePersists('light');

// Test theme toggle functionality
await themeHelper.testThemeToggle();
```

#### Screenshot Helper (`screenshot-helper.ts`)

Visual regression testing:

```typescript
import { createScreenshotHelper } from './helpers/screenshot-helper';

const screenshotHelper = createScreenshotHelper(page);

// Take screenshot
await screenshotHelper.saveScreenshot('home-page.png');

// Screenshot element
await screenshotHelper.saveElementScreenshot(element, 'card.png');

// Compare with baseline
await screenshotHelper.compareWithBaseline('home-page');

// Screenshot at breakpoints
await screenshotHelper.screenshotAtBreakpoints([
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 375, height: 667, name: 'mobile' },
]);
```

#### Performance Helper (`performance-helper.ts`)

Measure performance metrics:

```typescript
import { createPerformanceHelper } from './helpers/performance-helper';

const perfHelper = createPerformanceHelper(page);

// Measure metrics
const metrics = await perfHelper.measureMetrics();

// Measure Core Web Vitals
await perfHelper.assertCoreWebVitals();

// Assert performance thresholds
await perfHelper.assertPerformance({
  maxDomContentLoaded: 2000,
  maxLoadComplete: 3000,
});

// Get slowest resources
const slowResources = await perfHelper.getSlowestResources(5);
```

### Fixtures

#### App Fixture (`app.fixture.ts`)

Main application fixture:

```typescript
import { test } from './fixtures/app.fixture';

test('using app fixture', async ({ app, selectors, assertions, themeHelper }) => {
  await app.goto('/');
  await app.waitForStable();

  const title = await app.getTitle();
  const url = app.getURL();

  await app.clearBrowserData();
});
```

#### Environment Fixture (`environment.fixture.ts`)

Environment-specific configuration:

```typescript
import { test, getEnvironmentConfig } from './fixtures/environment.fixture';

test('test staging environment', async ({ env }) => {
  console.log(env.baseURL); // https://staging.example.com
  console.log(env.apiURL);  // https://staging-api.example.com
});
```

#### Device Fixture (`device.fixture.ts`)

Device emulation:

```typescript
import { test } from './fixtures/device.fixture';

test('test on mobile', async ({ device, emulateDevice }) => {
  await emulateDevice('mobile');

  // Test mobile-specific functionality
});
```

#### Data Fixture (`data.fixture.ts`)

Ready-to-use test data:

```typescript
import { test } from './fixtures/data.fixture';

test('using test data', async ({ testData }) => {
  const user = testData.users.admin();
  const loginForm = testData.forms.login();
  const product = testData.content.product();

  // Use generated data in tests
});
```

#### API Fixture (`api.fixture.ts`)

Mock API responses:

```typescript
import { test, mockResponses } from './fixtures/api.fixture';

test('mock API', async ({ page, mockAPI }) => {
  await mockAPI.get('**/api/user**', mockResponses.success({
    id: '1',
    name: 'Test User',
  }));

  await mockAPI.post('**/api/login**', mockResponses.error(
    'Invalid credentials',
    401
  ));
});
```

### Base Classes

#### Base Test (`base-test.ts`)

Foundation for all tests:

```typescript
import { BaseTest } from './base/base-test';

class MyTest extends BaseTest {
  protected async setup() {
    await super.setup();
    // Custom setup
  }

  protected async teardown() {
    // Custom teardown
    await super.teardown();
  }
}
```

#### Base Page Test (`base-page-test.ts`)

Page-level testing:

```typescript
import { createBasePageTest } from './base/base-page-test';

test('test home page', async ({ page }) => {
  const pageTest = createBasePageTest(page, {
    path: '/',
    title: /My App/,
    heading: /Welcome/,
  });

  await pageTest.setup();
  await pageTest.assertAccessible();
  await pageTest.testThemeSwitching();
});
```

#### Base Component Test (`base-component-test.ts`)

Component-level testing:

```typescript
import { createBaseComponentTest } from './base/base-component-test';

test('test button component', async ({ page }) => {
  const componentTest = createBaseComponentTest(page, {
    selector: 'button.primary',
    name: 'Primary Button',
  });

  await componentTest.setup();
  await componentTest.assertComponentVisible();
  await componentTest.testComponentInteraction();
  await componentTest.assertComponentAccessible();
});
```

## Writing Tests

### Using Fixtures (Recommended)

```typescript
import { test } from './fixtures/app.fixture';

test.describe('Feature', () => {
  test('should work', async ({ app, selectors, assertions }) => {
    await app.goto('/feature');
    await selectors.byText('Action').click();
    await assertions.assertVisible(selectors.byText('Success'));
  });
});
```

### Using Base Classes

```typescript
import { createBasePageTest } from './base/base-page-test';

test('feature page', async ({ page }) => {
  const pageTest = createBasePageTest(page, {
    path: '/feature',
    title: /Feature/,
  });

  await pageTest.setup();
  await pageTest.assertOnCorrectPage();
});
```

### Testing Multiple States

```typescript
import { createBaseComponentTest } from './base/base-component-test';

test('button states', async ({ page }) => {
  const test = createBaseComponentTest(page, {
    selector: 'button',
    name: 'Button',
  });

  await test.testComponentStates([
    {
      name: 'hover',
      action: async () => await test.hoverComponent(),
    },
    {
      name: 'focus',
      action: async () => await test.focusComponent(),
    },
    {
      name: 'disabled',
      action: async () => {
        await page.evaluate(() =>
          document.querySelector('button')?.setAttribute('disabled', 'true')
        );
      },
    },
  ]);
});
```

## Best Practices

### 1. Use Data-TestID Attributes

```html
<!-- Good -->
<button data-testid="submit-button">Submit</button>

<!-- Bad (brittle) -->
<button class="btn btn-primary">Submit</button>
```

### 2. Use User-Centric Selectors

```typescript
// Good - by role
await page.getByRole('button', { name: 'Submit' }).click();

// Good - by label
await page.getByLabel('Email').fill('test@example.com');

// Bad - by CSS
await page.$('.btn-primary').click();
```

### 3. Wait for Stability

```typescript
await app.goto('/page');
await app.waitForStable(); // Wait for network to settle

// Now assert
await assertions.assertVisible(element);
```

### 4. Use Assertions, Not Timeouts

```typescript
// Good
await assertions.assertVisible(element);

// Bad
await page.waitForTimeout(5000);
```

### 5. Test Accessibility

```typescript
await componentTest.assertComponentAccessible();
await pageTest.assertAccessible();
```

### 6. Mock External Services

```typescript
await mockAPI.get('**/api/external**', mockResponses.success({
  data: 'mocked',
}));
```

### 7. Test Responsive Design

```typescript
const viewports = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' },
];

for (const vp of viewports) {
  await page.setViewportSize(vp);
  await page.goto('/');

  // Assert responsive behavior
  const isMobile = vp.width < 768;
  const menuToggle = page.locator('[aria-label="Menu"]');
  await expect(menuToggle).toBeVisible();
}
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific file
npx playwright test e2e/example.spec.ts

# Run tests matching pattern
npx playwright test -g "should work"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### CI/CD Commands

```bash
# Run in CI mode
TEST_ENV=production npx playwright test

# Run with retries
npx playwright test --retries=3

# Run with workers
npx playwright test --workers=4
```

## Debugging

### 1. Use Playwright Inspector

```bash
npx playwright test --debug
```

### 2. Use UI Mode

```bash
npm run test:e2e:ui
```

### 3. Screenshots on Failure

Screenshots are automatically captured on test failure and saved to `test-results/screenshots/`.

### 4. Trace Viewer

```bash
# View trace file
npx playwright show-trace test-results/artifacts/trace.zip
```

### 5. Console Logs

```typescript
// Mock console errors
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.error('Console error:', msg.text());
  }
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:5173
TEST_ENV=test
CI=true
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com/)
- [WebAIM Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For issues or questions about the test infrastructure, please check:
1. Example tests in `e2e/example.spec.ts`
2. Helper files in `e2e/helpers/`
3. Fixture files in `e2e/fixtures/`
4. Base classes in `e2e/base/`
