/**
 * App Fixture
 *
 * Main application fixture that provides page objects and helper methods
 * for testing the entire application
 */

import { test as base, Page, expect } from '@playwright/test';
import { createSelectors } from '../helpers/selectors';
import { createAssertions } from '../helpers/assertions';
import { createThemeHelper } from '../helpers/theme-helper';
import { createScreenshotHelper } from '../helpers/screenshot-helper';
import { createPerformanceHelper } from '../helpers/performance-helper';

/**
 * App fixture type
 */
export type AppFixtures = {
  app: AppPage;
  selectors: ReturnType<typeof createSelectors>;
  assertions: ReturnType<typeof createAssertions>;
  themeHelper: ReturnType<typeof createThemeHelper>;
  screenshotHelper: ReturnType<typeof createScreenshotHelper>;
  performanceHelper: ReturnType<typeof createPerformanceHelper>;
};

/**
 * App Page Object
 * Provides high-level methods for interacting with the application
 */
export class AppPage {
  constructor(
    public page: Page,
    public selectors: ReturnType<typeof createSelectors>,
    public assertions: ReturnType<typeof createAssertions>,
    public themeHelper: ReturnType<typeof createThemeHelper>,
    public screenshotHelper: ReturnType<typeof createScreenshotHelper>,
    public performanceHelper: ReturnType<typeof createPerformanceHelper>
  ) {}

  /**
   * Navigate to application
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Get page URL
   */
  getURL(): string {
    return this.page.url();
  }

  /**
   * Wait for page to be stable
   */
  async waitForStable(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(100);
  }

  /**
   * Check if element is in viewport
   */
  async isInViewport(selector: string): Promise<boolean> {
    const element = this.page.locator(selector).first();
    const isVisible = await element.isVisible();
    return isVisible;
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).first().scrollIntoViewIfNeeded();
  }

  /**
   * Execute JavaScript in page context
   */
  async evaluate<R>(script: (arg: any) => R, arg?: any): Promise<R> {
    return await this.page.evaluate(script, arg);
  }

  /**
   * Get all console messages
   */
  getConsoleMessages(): string[] {
    const messages: string[] = [];
    this.page.on('console', (msg) => messages.push(msg.text()));
    return messages;
  }

  /**
   * Clear all browser data (cookies, localStorage, sessionStorage)
   */
  async clearBrowserData(): Promise<void> {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * Extend test with app fixture
 */
export const test = base.extend<AppFixtures>({
  // Create app page object
  app: async ({ page }, use) => {
    const selectors = createSelectors(page);
    const assertions = createAssertions(page);
    const themeHelper = createThemeHelper(page);
    const screenshotHelper = createScreenshotHelper(page);
    const performanceHelper = createPerformanceHelper(page);

    const appPage = new AppPage(
      page,
      selectors,
      assertions,
      themeHelper,
      screenshotHelper,
      performanceHelper
    );

    await use(appPage);
  },

  // Create selector helper
  selectors: async ({ page }, use) => {
    await use(createSelectors(page));
  },

  // Create assertion helper
  assertions: async ({ page }, use) => {
    await use(createAssertions(page));
  },

  // Create theme helper
  themeHelper: async ({ page }, use) => {
    await use(createThemeHelper(page));
  },

  // Create screenshot helper
  screenshotHelper: async ({ page }, use) => {
    await use(createScreenshotHelper(page));
  },

  // Create performance helper
  performanceHelper: async ({ page }, use) => {
    await use(createPerformanceHelper(page));
  },
});

export { expect } from '@playwright/test';
