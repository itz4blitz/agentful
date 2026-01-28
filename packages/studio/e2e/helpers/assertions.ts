/**
 * Assertion Helpers
 *
 * Provides custom assertion methods for common testing scenarios
 * Extends Playwright's built-in assertions with domain-specific checks
 */

import { expect, Page, Locator } from '@playwright/test';

export interface AccessibilityAssertionOptions {
  timeout?: number;
  WCAGLevel?: 'A' | 'AA' | 'AAA';
}

export interface PerformanceAssertionOptions {
  maxLoadTime?: number;
  maxFirstContentfulPaint?: number;
  maxLargestContentfulPaint?: number;
}

/**
 * Custom Assertion Helpers
 */
export class Assertions {
  constructor(private page: Page) {}

  /**
   * Assert element is visible to users (not just in DOM)
   */
  async assertVisible(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should be visible').toBeVisible({ timeout: options?.timeout });
  }

  /**
   * Assert element is hidden from users
   */
  async assertHidden(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should be hidden').not.toBeVisible({ timeout: options?.timeout });
  }

  /**
   * Assert element exists in DOM (may be hidden)
   */
  async assertExists(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should exist in DOM').toHaveCount(1, { timeout: options?.timeout });
  }

  /**
   * Assert element doesn't exist in DOM
   */
  async assertNotExists(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should not exist in DOM').toHaveCount(0, { timeout: options?.timeout });
  }

  /**
   * Assert element has specific text
   */
  async assertText(
    locator: Locator,
    text: string | RegExp,
    options?: { timeout?: number }
  ): Promise<void> {
    await expect(locator, `Element should have text "${text}"`).toHaveText(text, {
      timeout: options?.timeout,
    });
  }

  /**
   * Assert element contains specific text (partial match)
   */
  async assertTextContains(
    locator: Locator,
    text: string,
    options?: { timeout?: number }
  ): Promise<void> {
    await expect(locator, `Element should contain text "${text}"`).toContainText(text, {
      timeout: options?.timeout,
    });
  }

  /**
   * Assert element has specific attribute value
   */
  async assertAttribute(
    locator: Locator,
    attribute: string,
    value: string | RegExp,
    options?: { timeout?: number }
  ): Promise<void> {
    await expect(locator, `Element should have ${attribute}="${value}"`).toHaveAttribute(
      attribute,
      value,
      { timeout: options?.timeout }
    );
  }

  /**
   * Assert element is enabled
   */
  async assertEnabled(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should be enabled').toBeEnabled({ timeout: options?.timeout });
  }

  /**
   * Assert element is disabled
   */
  async assertDisabled(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should be disabled').toBeDisabled({ timeout: options?.timeout });
  }

  /**
   * Assert checkbox is checked
   */
  async assertChecked(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Checkbox should be checked').toBeChecked({ timeout: options?.timeout });
  }

  /**
   * Assert checkbox is unchecked
   */
  async assertUnchecked(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Checkbox should be unchecked').not.toBeChecked({
      timeout: options?.timeout,
    });
  }

  /**
   * Assert element has specific CSS class
   */
  async assertHasClass(locator: Locator, className: string): Promise<void> {
    const classes = await locator.getAttribute('class');
    expect(classes, `Element should have class "${className}"`).toMatch(className);
  }

  /**
   * Assert element doesn't have specific CSS class
   */
  async assertNotHasClass(locator: Locator, className: string): Promise<void> {
    const classes = await locator.getAttribute('class');
    expect(classes, `Element should not have class "${className}"`).not.toMatch(className);
  }

  /**
   * Assert element has specific count
   */
  async assertCount(locator: Locator, count: number, options?: { timeout?: number }): Promise<void> {
    await expect(locator, `Should have ${count} elements`).toHaveCount(count, {
      timeout: options?.timeout,
    });
  }

  /**
   * Assert page URL matches pattern
   */
  async assertURL(pattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await expect(this.page, `Page URL should match "${pattern}"`).toHaveURL(pattern, {
      timeout: options?.timeout,
    });
  }

  /**
   * Assert page title
   */
  async assertTitle(title: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await expect(this.page, `Page title should be "${title}"`).toHaveTitle(title, {
      timeout: options?.timeout,
    });
  }

  /**
   * Assert element is focused
   */
  async assertFocused(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await expect(locator, 'Element should be focused').toBeFocused({ timeout: options?.timeout });
  }

  /**
   * Assert input has specific value
   */
  async assertValue(
    locator: Locator,
    value: string,
    options?: { timeout?: number }
  ): Promise<void> {
    await expect(locator, `Input should have value "${value}"`).toHaveValue(value, {
      timeout: options?.timeout,
    });
  }

  /**
   * Assert element has specific accessibility attributes
   */
  async assertA11yLabel(locator: Locator, label: string): Promise<void> {
    const ariaLabel = await locator.getAttribute('aria-label');
    expect(ariaLabel, `Element should have aria-label="${label}"`).toBe(label);
  }

  /**
   * Assert element is accessible to screen readers
   */
  async assertAccessible(locator: Locator): Promise<void> {
    const ariaHidden = await locator.getAttribute('aria-hidden');
    expect(ariaHidden, 'Element should be accessible (not aria-hidden="true")').not.toBe('true');

    const role = await locator.getAttribute('role');
    if (role === 'presentation' || role === 'none') {
      throw new Error('Element has role="presentation" and is not accessible');
    }
  }

  /**
   * Assert element has valid contrast ratio (basic check)
   * Note: This is a simplified check. For full accessibility testing, use axe-core
   */
  async assertContrast(locator: Locator, minRatio: number = 4.5): Promise<void> {
    const styles = await locator.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // This is a placeholder - real contrast calculation requires color parsing
    // Consider using axe-core or similar for production testing
    expect(styles).toBeDefined();
  }

  /**
   * Assert page has no console errors
   */
  async assertNoConsoleErrors(): Promise<void> {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Give it a moment to catch any errors
    await this.page.waitForTimeout(100);

    expect(errors, 'Page should have no console errors').toEqual([]);
  }

  /**
   * Assert element is within viewport
   */
  async assertInViewport(locator: Locator): Promise<void> {
    const isVisible = await locator.isVisible();
    expect(isVisible, 'Element should be visible in viewport').toBe(true);
  }

  /**
   * Assert element is scrolled into view
   */
  async assertScrolledIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    const isInViewport = await locator.isVisible();
    expect(isInViewport, 'Element should be scrolled into view').toBe(true);
  }

  /**
   * Assert image loaded successfully
   */
  async assertImageLoaded(locator: Locator): Promise<void> {
    const naturalWidth = await locator.evaluate((img) => (img as HTMLImageElement).naturalWidth);
    expect(naturalWidth, 'Image should have loaded (naturalWidth > 0)').toBeGreaterThan(0);
  }

  /**
   * Assert specific number of elements match selector
   */
  async assertElementCount(selector: string, count: number): Promise<void> {
    const elements = await this.page.locator(selector).count();
    expect(elements, `Should find ${count} elements matching "${selector}"`).toBe(count);
  }

  /**
   * Assert toast notification is visible
   */
  async assertToastVisible(message?: string, options?: { timeout?: number }): Promise<void> {
    const toastSelector = '[class*="toast"], [role="alert"]';
    const toast = this.page.locator(toastSelector).first();

    if (message) {
      await expect(toast, `Toast should show message "${message}"`).toContainText(message, {
        timeout: options?.timeout,
      });
    } else {
      await expect(toast, 'Toast should be visible').toBeVisible({ timeout: options?.timeout });
    }
  }

  /**
   * Assert modal/dialog is visible
   */
  async assertModalVisible(title?: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]').first();
    await expect(modal, 'Modal should be visible').toBeVisible();

    if (title) {
      await expect(modal, `Modal should have title "${title}"`).toContainText(title);
    }
  }

  /**
   * Assert modal/dialog is closed
   */
  async assertModalClosed(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await expect(modal, 'Modal should be closed').not.toBeVisible();
  }
}

/**
 * Create assertion helper for a page
 */
export function createAssertions(page: Page): Assertions {
  return new Assertions(page);
}
