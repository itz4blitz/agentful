/**
 * Base Page Test Class
 *
 * Specialized base class for page-level testing
 * Provides page-specific assertions and helpers
 */

import { Page, expect, TestInfo } from '@playwright/test';
import { BaseTest } from './base-test';

/**
 * Page test configuration
 */
export interface PageTestConfig {
  path: string;
  title?: string | RegExp;
  heading?: string | RegExp;
  waitForSelector?: string;
}

/**
 * Base Page Test Class
 * For testing individual pages
 */
export abstract class BasePageTest extends BaseTest {
  protected config: PageTestConfig;

  constructor(page: Page, config: PageTestConfig) {
    super(page);
    this.config = config;
  }

  /**
   * Setup - navigate to page and verify it loaded
   */
  protected async setup(): Promise<void> {
    await this.navigateToPage();
    await this.assertPageLoaded();
  }

  /**
   * Navigate to the page under test
   */
  protected async navigateToPage(): Promise<void> {
    await this.navigateTo(this.config.path);
  }

  /**
   * Assert page loaded successfully
   */
  protected async assertPageLoaded(): Promise<void> {
    await this.waitForStable();

    if (this.config.title) {
      await this.assertions.assertTitle(this.config.title);
    }

    if (this.config.heading) {
      await this.assertions.assertText(
        this.selectors.byRole('heading', { name: this.config.heading }),
        this.config.heading
      );
    }

    if (this.config.waitForSelector) {
      await this.waitForVisible(this.config.waitForSelector);
    }
  }

  /**
   * Assert we're on the correct page
   */
  protected async assertOnCorrectPage(): Promise<void> {
    await this.assertions.assertURL(this.config.path);
  }

  /**
   * Assert page has required elements
   */
  protected async assertHasRequiredElements(selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      await expect(
        this.page.locator(selector),
        `Element "${selector}" should exist on page`
      ).toBeVisible();
    }
  }

  /**
   * Assert page is accessible
   */
  protected async assertAccessible(): Promise<void> {
    // Check for heading hierarchy
    const headings = await this.page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length, 'Page should have at least one heading').toBeGreaterThan(0);

    // Check for skip links (a11y)
    const skipLink = this.page.locator('a[href^="#"]:has-text("skip")').first();
    if (await skipLink.count() > 0) {
      await expect(skipLink, 'Skip link should be visible').toBeVisible();
    }

    // Check for landmarks
    const main = this.page.locator('main').or(this.page.locator('[role="main"]'));
    await expect(main, 'Page should have main landmark').toHaveCount(1);

    const nav = this.page.locator('nav').or(this.page.locator('[role="navigation"]'));
    await expect(nav, 'Page should have navigation landmark').toHaveCountGreaterThan(0);
  }

  /**
   * Assert page SEO basics
   */
  protected async assertSEO(): Promise<void> {
    // Check title
    const title = await this.page.title();
    expect(title, 'Page should have a title').toBeTruthy();
    expect(title.length, 'Title should be descriptive').toBeGreaterThan(20);

    // Check meta description
    const metaDescription = await this.page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription, 'Page should have meta description').toBeTruthy();
    expect(metaDescription!.length, 'Meta description should be descriptive').toBeGreaterThan(50);

    // Check canonical link
    const canonical = this.page.locator('link[rel="canonical"]');
    await expect(canonical, 'Page should have canonical link').toHaveCount(1);
  }

  /**
   * Assert page performance
   */
  protected async assertPerformance(maxLoadTime: number = 3000): Promise<void> {
    const loadTime = await this.performanceHelper.measurePageLoadTime();
    expect(loadTime, `Page should load in under ${maxLoadTime}ms`).toBeLessThanOrEqual(maxLoadTime);
  }

  /**
   * Test page theme switching
   */
  protected async testThemeSwitching(): Promise<void> {
    const isDark = await this.themeHelper.isDarkMode();

    // Toggle theme
    await this.themeHelper.toggleTheme();
    await this.themeHelper.waitForThemeTransition();

    // Verify theme changed
    const newIsDark = await this.themeHelper.isDarkMode();
    expect(newIsDark, 'Theme should have changed').not.toBe(isDark);

    // Toggle back
    await this.themeHelper.toggleTheme();
    await this.themeHelper.waitForThemeTransition();

    const finalIsDark = await this.themeHelper.isDarkMode();
    expect(finalIsDark, 'Theme should be back to original').toBe(isDark);
  }

  /**
   * Take screenshot of current page state
   */
  protected async screenshotPage(): Promise<void> {
    const testName = this.config.path.replace(/\//g, '-');
    await this.screenshotHelper.saveScreenshot(`${testName}.png`);
  }

  /**
   * Test page at different viewports
   */
  protected async testAtViewports(viewports: Array<{ width: number; height: number; name: string }>): Promise<void> {
    for (const viewport of viewports) {
      await this.setViewport(viewport.width, viewport.height);
      await this.wait(200); // Wait for layout to settle

      // Assert page is still functional
      await this.assertOnCorrectPage();

      // Take screenshot
      await this.screenshotHelper.saveScreenshot(
        `${this.config.path.replace(/\//g, '-')}-${viewport.name}.png`
      );
    }
  }

  /**
   * Test page navigation
   */
  protected async testNavigation(links: Array<{ text: string; expectedPath: string }>): Promise<void> {
    for (const link of links) {
      await this.clickByText(link.text);
      await this.waitForNavigation();
      await this.assertURL(link.expectedPath);

      // Go back
      await this.goBack();
      await this.waitForNavigation();
    }
  }

  /**
   * Assert page has no console errors
   */
  protected async assertNoErrors(): Promise<void> {
    const errors: string[] = [];

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to catch any errors
    await this.wait(1000);

    expect(errors, 'Page should have no console errors').toEqual([]);
  }
}

/**
 * Page test fixture builder
 */
export function createBasePageTest(page: Page, config: PageTestConfig): BasePageTest {
  const TestClass = class extends BasePageTest {};
  return new TestClass(page, config);
}
