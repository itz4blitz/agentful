/**
 * Base Test Class
 *
 * Provides common test setup, teardown, and utility methods
 * All E2E tests should extend this class
 */

import { Page, test, expect, TestInfo } from '@playwright/test';
import { AppPage } from '../fixtures/app.fixture';
import { createSelectors } from '../helpers/selectors';
import { createAssertions } from '../helpers/assertions';
import { createThemeHelper } from '../helpers/theme-helper';
import { createScreenshotHelper } from '../helpers/screenshot-helper';
import { createPerformanceHelper } from '../helpers/performance-helper';

/**
 * Base Test Class
 * Provides foundation for all E2E tests
 */
export abstract class BaseTest {
  protected page: Page;
  protected app: AppPage;
  protected selectors: ReturnType<typeof createSelectors>;
  protected assertions: ReturnType<typeof createAssertions>;
  protected themeHelper: ReturnType<typeof createThemeHelper>;
  protected screenshotHelper: ReturnType<typeof createScreenshotHelper>;
  protected performanceHelper: ReturnType<typeof createPerformanceHelper>;

  constructor(page: Page) {
    this.page = page;
    this.selectors = createSelectors(page);
    this.assertions = createAssertions(page);
    this.themeHelper = createThemeHelper(page);
    this.screenshotHelper = createScreenshotHelper(page);
    this.performanceHelper = createPerformanceHelper(page);

    this.app = new AppPage(
      page,
      this.selectors,
      this.assertions,
      this.themeHelper,
      this.screenshotHelper,
      this.performanceHelper
    );
  }

  /**
   * Setup method - called before each test
   * Override in subclasses to add custom setup logic
   */
  protected async setup(): Promise<void> {
    // Default setup: navigate to home page
    await this.app.goto();
    await this.app.waitForStable();
  }

  /**
   * Teardown method - called after each test
   * Override in subclasses to add custom teardown logic
   */
  protected async teardown(): Promise<void> {
    // Default teardown: clear browser data
    await this.app.clearBrowserData();
  }

  /**
   * Take screenshot on test failure
   */
  protected async captureFailure(testInfo: TestInfo): Promise<void> {
    const testName = testInfo.title.replace(/\s+/g, '-');
    await this.screenshotHelper.captureOnFailure(testName);
  }

  /**
   * Wait for page to be stable
   */
  protected async waitForStable(): Promise<void> {
    await this.app.waitForStable();
  }

  /**
   * Navigate to path
   */
  protected async navigateTo(path: string): Promise<void> {
    await this.app.goto(path);
  }

  /**
   * Reload page
   */
  protected async reload(): Promise<void> {
    await this.app.reload();
  }

  /**
   * Get current URL
   */
  protected getURL(): string {
    return this.app.getURL();
  }

  /**
   * Assert current URL matches pattern
   */
  protected async assertURL(pattern: string | RegExp): Promise<void> {
    await this.assertions.assertURL(pattern);
  }

  /**
   * Click element by text
   */
  protected async clickByText(text: string): Promise<void> {
    await this.selectors.byText(text).click();
  }

  /**
   * Fill input by label
   */
  protected async fillByLabel(label: string, value: string): Promise<void> {
    await this.selectors.byLabel(label).fill(value);
  }

  /**
   * Wait for element to be visible
   */
  protected async waitForVisible(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible' });
  }

  /**
   * Wait for element to be hidden
   */
  protected async waitForHidden(selector: string): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'hidden' });
  }

  /**
   * Execute JavaScript in page context
   */
  protected async evaluate<R>(script: (arg: any) => R, arg?: any): Promise<R> {
    return await this.app.evaluate(script, arg);
  }

  /**
   * Get text content of element
   */
  protected async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Get attribute value
   */
  protected async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  /**
   * Check if element exists
   */
  protected async exists(selector: string): Promise<boolean> {
    const count = await this.page.locator(selector).count();
    return count > 0;
  }

  /**
   * Check if element is visible
   */
  protected async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Scroll element into view
   */
  protected async scrollIntoView(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Hover over element
   */
  protected async hover(selector: string): Promise<void> {
    await this.page.locator(selector).hover();
  }

  /**
   * Focus element
   */
  protected async focus(selector: string): Promise<void> {
    await this.page.locator(selector).focus();
  }

  /**
   * Check checkbox
   */
  protected async check(selector: string): Promise<void> {
    await this.page.locator(selector).check();
  }

  /**
   * Uncheck checkbox
   */
  protected async uncheck(selector: string): Promise<void> {
    await this.page.locator(selector).uncheck();
  }

  /**
   * Select option from dropdown
   */
  protected async selectOption(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).selectOption(value);
  }

  /**
   * Upload file
   */
  protected async uploadFile(selector: string, filePath: string): Promise<void> {
    await this.page.locator(selector).setInputFiles(filePath);
  }

  /**
   * Press keyboard key
   */
  protected async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Type text with keyboard
   */
  protected async type(text: string, delay?: number): Promise<void> {
    await this.page.keyboard.type(text, { delay });
  }

  /**
   * Wait for specified time
   */
  protected async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Wait for navigation
   */
  protected async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for URL to change
   */
  protected async waitForURLChange(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }

  /**
   * Mock console errors
   */
  protected mockConsoleErrors(): void {
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  }

  /**
   * Assert no console errors
   */
  protected async assertNoConsoleErrors(): Promise<void> {
    await this.assertions.assertNoConsoleErrors();
  }

  /**
   * Get all console messages
   */
  protected getConsoleMessages(): string[] {
    const messages: string[] = [];
    this.page.on('console', (msg) => messages.push(msg.text()));
    return messages;
  }

  /**
   * Set viewport size
   */
  protected async setViewport(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  /**
   * Emulate device
   */
  protected async emulateDevice(device: {
    viewport: { width: number; height: number };
    userAgent?: string;
  }): Promise<void> {
    if (device.userAgent) {
      await this.page.setExtraHTTPHeaders({ 'User-Agent': device.userAgent });
    }
    await this.page.setViewportSize(device.viewport);
  }

  /**
   * Go back in history
   */
  protected async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Go forward in history
   */
  protected async goForward(): Promise<void> {
    await this.page.goForward();
  }
}

/**
 * Test fixture builder for BaseTest
 */
export function createBaseTest(page: Page, testInfo: TestInfo): BaseTest {
  const TestClass = class extends BaseTest {};
  return new TestClass(page);
}
