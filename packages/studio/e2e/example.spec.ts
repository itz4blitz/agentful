/**
 * Example E2E Test
 *
 * Demonstrates how to use the test infrastructure
 * This file can be deleted once you understand the patterns
 */

import { test } from './fixtures/app.fixture';
import { createBasePageTest } from './base/base-page-test';
import { createBaseComponentTest } from './base/base-component-test';

/**
 * Example 1: Using fixtures directly
 */
test.describe('App - Using Fixtures', () => {
  test('should load home page', async ({ app, selectors, assertions }) => {
    // Navigate to home page
    await app.goto();

    // Wait for page to be stable
    await app.waitForStable();

    // Assert header is visible
    await assertions.assertVisible(selectors.header);

    // Assert page title
    await assertions.assertTitle(/agentful/i);
  });

  test('should display all cards', async ({ selectors, assertions }) => {
    // Get all cards
    const cards = selectors.cards;

    // Assert cards exist
    await assertions.assertCount(cards, 9);

    // Assert first card has content
    const firstCard = selectors.first('[class*="Card"]');
    await assertions.assertVisible(firstCard);
  });

  test('should toggle theme', async ({ themeHelper, assertions }) => {
    // Get initial theme
    const initialTheme = await themeHelper.isDarkMode();

    // Toggle theme
    await themeHelper.toggleTheme();

    // Wait for transition
    await themeHelper.waitForThemeTransition();

    // Assert theme changed
    const newTheme = await themeHelper.isDarkMode();
    await assertions.assertTheme(newTheme ? 'dark' : 'light');
  });
});

/**
 * Example 2: Using BasePageTest
 */
test.describe('App - Using BasePageTest', () => {
  test('should render home page correctly', async ({ page }) => {
    // Create page test instance
    const pageTest = createBasePageTest(page, {
      path: '/',
      title: /agentful/i,
      heading: /welcome/i,
    });

    // Run setup
    await pageTest.setup();

    // Assert we're on correct page
    await pageTest.assertOnCorrectPage();

    // Assert page is accessible
    await pageTest.assertAccessible();

    // Test theme switching
    await pageTest.testThemeSwitching();
  });
});

/**
 * Example 3: Using BaseComponentTest
 */
test.describe('Components - Using BaseComponentTest', () => {
  test('should test card component', async ({ page }) => {
    // Create component test instance
    const componentTest = createBaseComponentTest(page, {
      selector: '[class*="Card"]:first-child',
      name: 'Feature Card',
    });

    // Run setup
    await componentTest.setup();

    // Assert component is visible
    await componentTest.assertComponentVisible();

    // Assert component has content
    await componentTest.assertComponentText(/\w+/);

    // Test interaction
    await componentTest.testComponentInteraction();

    // Screenshot component
    await componentTest.screenshotComponent();
  });

  test('should test button component', async ({ page }) => {
    const componentTest = createBaseComponentTest(page, {
      selector: 'button:first-of-type',
      name: 'Primary Button',
    });

    await componentTest.setup();

    // Test button is enabled
    await componentTest.assertComponentEnabled();

    // Click button
    await componentTest.clickComponent();

    // Screenshot component
    await componentTest.screenshotComponent();
  });
});

/**
 * Example 4: Performance testing
 */
test.describe('Performance', () => {
  test('should load page within performance budget', async ({ app, performanceHelper }) => {
    await app.goto();

    // Assert Core Web Vitals
    await performanceHelper.assertCoreWebVitals();

    // Assert custom performance thresholds
    await performanceHelper.assertPerformance({
      maxDomContentLoaded: 2000,
      maxLoadComplete: 3000,
      maxFirstContentfulPaint: 1500,
    });
  });
});

/**
 * Example 5: Screenshot testing
 */
test.describe('Visual Regression', () => {
  test('should match baseline screenshot', async ({ page, screenshotHelper }) => {
    await page.goto('/');

    // Take screenshot and compare with baseline
    const screenshot = await screenshotHelper.screenshotPage();

    // Note: First run will create baseline, subsequent runs will compare
    // Uncomment to enable visual regression:
    // await expect(screenshot).toMatchSnapshot('home-page.png');
  });
});

/**
 * Example 6: API mocking
 */
test.describe('API Mocking', async () => {
  // Note: You need to use the api.fixture for this
  // test('should handle API errors gracefully', async ({ page, mockAPI }) => {
  //   await mockAPI.get('**/api/user**', {
  //     status: 500,
  //     body: { error: 'Internal server error' },
  //   });
  //
  //   await page.goto('/');
  //   // Assert error handling
  // });
});

/**
 * Example 7: Cross-browser testing
 */
test.describe('Cross-Browser', () => {
  // These tests will run in all configured browsers
  test('should work in all browsers', async ({ app }) => {
    await app.goto();
    await app.waitForStable();

    // Test basic functionality
    const title = await app.getTitle();
    expect(title).toBeTruthy();
  });
});

/**
 * Example 8: Device testing
 */
test.describe('Responsive Design', () => {
  // Test at different breakpoints
  const breakpoints = [
    { width: 1920, height: 1080, name: 'desktop-large' },
    { width: 1280, height: 720, name: 'desktop-small' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  for (const breakpoint of breakpoints) {
    test(`should render at ${breakpoint.name}`, async ({ page }) => {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('/');

      // Assert page is functional at this viewport
      const title = await page.title();
      expect(title).toBeTruthy();
    });
  }
});
