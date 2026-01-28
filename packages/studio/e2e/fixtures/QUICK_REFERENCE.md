# Test Fixtures Quick Reference

Quick reference guide for commonly used test fixtures and utilities.

## Table of Contents
- [Constants](#constants)
- [Data Loaders](#data-loaders)
- [Data Generators](#data-generators)
- [Test Helpers](#test-helpers)
- [Environment Setup](#environment-setup)
- [Common Patterns](#common-patterns)

---

## Constants

### Test IDs
```typescript
import { TEST_IDS } from '@/fixtures'

// Theme
TEST_IDS.THEME_TOGGLE
TEST_IDS.THEME_PROVIDER
TEST_IDS.THEME_ICON

// Error Boundary
TEST_IDS.ERROR_BOUNDARY
TEST_IDS.ERROR_MESSAGE
TEST_IDS.ERROR_RELOAD_BUTTON

// Forms
TEST_IDS.FORM
TEST_IDS.FORM_INPUT
TEST_IDS.FORM_SUBMIT
```

### Wait Times
```typescript
import { WAIT_TIMES } from '@/fixtures'

WAIT_TIMES.INSTANT        // 50ms
WAIT_TIMES.SHORT         // 300ms
WAIT_TIMES.TRANSITION    // 500ms
WAIT_TIMES.MEDIUM        // 1000ms
WAIT_TIMES.NAVIGATION    // 2000ms
WAIT_TIMES.THEME_SWITCH  // 400ms
```

### Viewports
```typescript
import { VIEWPORTS } from '@/fixtures'

VIEWPORTS.MOBILE_SMALL   // 375x667
VIEWPORTS.TABLET         // 768x1024
VIEWPORTS.DESKTOP_MEDIUM // 1920x1080
```

### Performance Thresholds
```typescript
import { PERFORMANCE_THRESHOLDS } from '@/fixtures'

PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT  // 2000ms
PERFORMANCE_THRESHOLDS.THEME_SWITCH            // 200ms
PERFORMANCE_THRESHOLDS.BUTTON_CLICK            // 100ms
```

---

## Data Loaders

### Theme
```typescript
import { loadThemeFromStorage } from '@/fixtures'

// Load dark theme
await loadThemeFromStorage(page, 'dark')

// Load light theme
await loadThemeFromStorage(page, 'light')

// Load system theme
await loadThemeFromStorage(page, 'system')
```

### Storage
```typescript
import { loadStorageItems, getStorageItem } from '@/fixtures'

// Load multiple items
await loadStorageItems(page, {
  theme: JSON.stringify('dark'),
  userPrefs: JSON.stringify({ fontSize: 'lg' }),
})

// Get single item
const theme = await getStorageItem(page, 'theme')
```

### User Personas
```typescript
import { loadUserPersona, USER_PERSONAS } from '@/fixtures'

// Load predefined persona
await loadUserPersona(page, USER_PERSONAS.ACCESSIBILITY_USER)

// Load custom persona
await loadUserPersona(page, {
  id: 'custom-user',
  name: 'Custom User',
  preferences: { theme: 'dark', fontSize: 'lg' },
  behavior: { usesKeyboard: true },
  setup: async () => { /* ... */ },
  teardown: async () => { /* ... */ },
})
```

### API Mocking
```typescript
import { loadMockAPIResponse, loadMockAPIError } from '@/fixtures'

// Mock success response
await loadMockAPIResponse(page, '/api/users', {
  users: [{ id: 1, name: 'Test' }]
})

// Mock error response
await loadMockAPIError(page, '/api/users', 500, 'Server Error')
```

---

## Data Generators

### Common Generators
```typescript
import {
  generateRandomString,
  generateRandomEmail,
  generateRandomUser,
  generateRandomPassword,
} from '@/fixtures'

const randomString = generateRandomString(10)        // "aB1xY9zQm2"
const randomEmail = generateRandomEmail()             // "xY9zQm2aB1@example.com"
const randomUser = generateRandomUser()               // { id, name, email, ... }
const randomPassword = generateRandomPassword(12)     // "xY9@xY9#xY9!"
```

### Specialized Generators
```typescript
import {
  generateRandomPhoneNumber,
  generateRandomAddress,
  generateRandomColor,
  generateRandomURL,
} from '@/fixtures'

const phone = generateRandomPhoneNumber()  // "+1 (555) 123-4567"
const address = generateRandomAddress()    // { street, city, state, zip }
const color = generateRandomColor()        // "#f3a2b1"
const url = generateRandomURL()            // "https://example.com/xyz123"
```

---

## Test Helpers

### Element Interactions
```typescript
import {
  waitForVisible,
  waitForHidden,
  clickAndWaitForNavigation,
  typeSlowly,
  hover,
} from '@/fixtures'

// Wait for element
const element = await waitForVisible(page, '#button')

// Wait for element to hide
await waitForHidden(page, '#modal')

// Click and wait for navigation
await clickAndWaitForNavigation(page, '#link')

// Type slowly (simulate real user)
await typeSlowly(page, '#input', 'Hello World')

// Hover over element
await hover(page, '#menu-trigger')
```

### Form Helpers
```typescript
import { fillForm, submitForm } from '@/fixtures'

// Fill form
await fillForm(page, {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello',
})

// Submit form
await submitForm(page, '#contact-form')
```

### Theme Helpers
```typescript
import { toggleTheme, setTheme } from '@/fixtures'

// Toggle theme
await toggleTheme(page)

// Set specific theme
await setTheme(page, 'dark')
```

### Scroll Helpers
```typescript
import {
  scrollToElement,
  scrollToTop,
  scrollToBottom,
  getScrollPosition,
} from '@/fixtures'

// Scroll to element
await scrollToElement(page, '#footer')

// Scroll to top
await scrollToTop(page)

// Scroll to bottom
await scrollToBottom(page)

// Get scroll position
const { x, y } = await getScrollPosition(page)
```

### Screenshot Helpers
```typescript
import { takeScreenshot } from '@/fixtures'

// Take screenshot
await takeScreenshot(page, 'my-test')
```

---

## Environment Setup

### Complete Setup
```typescript
import { setupTestEnvironment, cleanupTestEnvironment } from '@/fixtures'

test.beforeEach(async ({ page }) => {
  await setupTestEnvironment(page, {
    theme: 'dark',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezone: 'America/New_York',
    reducedMotion: true,
    highContrast: false,
    offline: false,
    networkSpeed: 'fast3g',
    errorTracking: true,
    performanceMonitoring: true,
  })
})

test.afterEach(async ({ page }) => {
  await cleanupTestEnvironment(page)
})
```

### Individual Setup Functions
```typescript
import {
  setupDarkMode,
  setupLightMode,
  setupMobileViewport,
  setupAccessibilityFeatures,
  setupSlowNetwork,
  setupOfflineMode,
} from '@/fixtures'

// Setup dark mode
await setupDarkMode(page)

// Setup mobile
await setupMobileViewport(page.context(), 'iphone-12')

// Setup accessibility
await setupAccessibilityFeatures(page, {
  reducedMotion: true,
  highContrast: true,
})

// Setup slow network
await setupSlowNetwork(page, 'slow3g')

// Setup offline mode
await setupOfflineMode(page)
```

---

## Common Patterns

### Pattern 1: Test with User Persona
```typescript
test('accessibility user can navigate', async ({ page }) => {
  const persona = USER_PERSONAS.ACCESSIBILITY_USER

  // Setup
  await setupTestEnvironment(page, {
    theme: persona.preferences.theme,
    reducedMotion: persona.behavior.expectsAnimations === false,
  })

  // Test
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()

  // Teardown
  await cleanupTestEnvironment(page)
})
```

### Pattern 2: Test Theme Switching
```typescript
test('theme persists across reloads', async ({ page }) => {
  // Set theme
  await setTheme(page, 'dark')
  let state = await getThemeState(page)
  expect(state.htmlClass).toContain('dark')

  // Reload
  await page.reload()

  // Verify theme persisted
  state = await getThemeState(page)
  expect(state.htmlClass).toContain('dark')
})
```

### Pattern 3: Test Form Validation
```typescript
test('form shows validation errors', async ({ page }) => {
  await page.goto('/contact')

  // Submit empty form
  await submitForm(page)

  // Check for errors
  await waitForVisible(page, '[data-testid="input-error"]')

  // Fill with invalid data
  await fillForm(page, {
    email: 'invalid-email',
  })

  // Submit again
  await submitForm(page)

  // Verify error message
  const error = await getText(page, '[data-testid="input-error"]')
  expect(error).toMatch(/invalid email/i)
})
```

### Pattern 4: Test Error Boundary
```typescript
test('error boundary catches errors', async ({ page }) => {
  // Setup error tracking
  await setupTestEnvironment(page, {
    errorTracking: true,
  })

  await page.goto('/')

  // Trigger error
  await page.evaluate(() => {
    throw new Error('Test error')
  })

  // Wait for error boundary
  await waitForErrorBoundary(page)

  // Verify error UI
  await expect(page.locator(`[data-testid="${TEST_IDS.ERROR_BOUNDARY}"]`))
    .toBeVisible()

  // Check captured errors
  const errors = await getCapturedErrors(page)
  expect(errors).toHaveLength(1)
  expect(errors[0].message).toBe('Test error')
})
```

### Pattern 5: Test API Responses
```typescript
test('displays user data from API', async ({ page }) => {
  // Mock API response
  await loadMockAPIResponse(page, '/api/user', {
    user: { id: 1, name: 'Test User' }
  })

  await page.goto('/profile')

  // Verify data is displayed
  await expect(page.locator('text=Test User')).toBeVisible()
})
```

### Pattern 6: Test Performance
```typescript
test('page load meets performance thresholds', async ({ page }) => {
  // Setup performance monitoring
  await setupTestEnvironment(page, {
    performanceMonitoring: true,
  })

  // Navigate to page
  await page.goto('/')

  // Get metrics
  const metrics = await getPerformanceMetrics(page)

  // Verify thresholds
  expect(metrics['first-contentful-paint']).toBeLessThanOrEqual(
    PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT
  )
})
```

---

## Tips and Tricks

### 1. Always use test IDs over CSS selectors
```typescript
// ✅ Good
await page.click(`[data-testid="${TEST_IDS.THEME_TOGGLE}"]`)

// ❌ Bad
await page.click('button[aria-label*="theme"]')
```

### 2. Use constants for magic numbers
```typescript
// ✅ Good
await page.waitForTimeout(WAIT_TIMES.THEME_SWITCH)

// ❌ Bad
await page.waitForTimeout(300)
```

### 3. Cleanup after each test
```typescript
test.afterEach(async ({ page }) => {
  await cleanupTestEnvironment(page)
})
```

### 4. Use helpers for complex operations
```typescript
// ✅ Good
const state = await getThemeState(page)

// ❌ Bad
const theme = await page.evaluate(() => localStorage.getItem('theme'))
const htmlClass = await page.locator('html').getAttribute('class')
```

### 5. Group related tests
```typescript
test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page, { theme: 'light' })
  })

  test('toggles theme', async ({ page }) => { /* ... */ })
  test('persists theme', async ({ page }) => { /* ... */ })
})
```

---

## Import Examples

### Import Everything
```typescript
import * as fixtures from '@/fixtures'
```

### Import Specific Items
```typescript
import { TEST_IDS, WAIT_TIMES, getThemeState } from '@/fixtures'
```

### Import from Sub-modules
```typescript
import { THEME_STATES } from '@/fixtures/data/theme-data'
import { setupDarkMode } from '@/fixtures/utils/environment-setup'
```

---

## Type Safety

All fixtures are fully typed. Use TypeScript for autocomplete:

```typescript
import type { ThemeConfig, UserPersona } from '@/fixtures'

const theme: ThemeConfig = THEME_STATES.LIGHT
const user: UserPersona = USER_PERSONAS.NEW_USER
```

---

## See Also

- [README.md](./README.md) - Detailed documentation
- [../fixtures](./) - All fixtures and utilities
