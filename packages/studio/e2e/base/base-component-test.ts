/**
 * Base Component Test Class
 *
 * Specialized base class for component-level testing
 * Provides component-specific assertions and helpers
 */

import { Page, Locator, expect } from '@playwright/test';
import { BaseTest } from './base-test';

/**
 * Component test configuration
 */
export interface ComponentTestConfig {
  selector: string;
  name: string;
  requiredProps?: string[];
}

/**
 * Base Component Test Class
 * For testing individual components
 */
export abstract class BaseComponentTest extends BaseTest {
  protected config: ComponentTestConfig;
  protected component: Locator;

  constructor(page: Page, config: ComponentTestConfig) {
    super(page);
    this.config = config;
    this.component = this.page.locator(config.selector);
  }

  /**
   * Setup - ensure component is mounted
   */
  protected async setup(): Promise<void> {
    await this.assertComponentExists();
  }

  /**
   * Assert component exists in DOM
   */
  protected async assertComponentExists(): Promise<void> {
    await expect(
      this.component,
      `Component "${this.config.name}" should exist`
    ).toHaveCount(1);
  }

  /**
   * Assert component is visible
   */
  protected async assertComponentVisible(): Promise<void> {
    await expect(
      this.component,
      `Component "${this.config.name}" should be visible`
    ).toBeVisible();
  }

  /**
   * Assert component is hidden
   */
  protected async assertComponentHidden(): Promise<void> {
    await expect(
      this.component,
      `Component "${this.config.name}" should be hidden`
      ).not.toBeVisible();
  }

  /**
   * Assert component has specific text
   */
  protected async assertComponentText(text: string | RegExp): Promise<void> {
    await expect(
      this.component,
      `Component "${this.config.name}" should have text`
    ).toContainText(text);
  }

  /**
   * Assert component has specific class
   */
  protected async assertComponentClass(className: string): Promise<void> {
    const classes = await this.component.getAttribute('class');
    expect(classes, `Component should have class "${className}"}`).toMatch(className);
  }

  /**
   * Assert component is enabled
   */
  protected async assertComponentEnabled(): Promise<void> {
    await expect(
      this.component,
      `Component "${this.config.name}" should be enabled`
    ).toBeEnabled();
  }

  /**
   * Assert component is disabled
   */
  protected async assertComponentDisabled(): Promise<void> {
    await expect(
      this.component,
      `Component "${this.config.name}" should be disabled`
    ).toBeDisabled();
  }

  /**
   * Click component
   */
  protected async clickComponent(): Promise<void> {
    await this.component.click();
  }

  /**
   * Hover over component
   */
  protected async hoverComponent(): Promise<void> {
    await this.component.hover();
  }

  /**
   * Focus component
   */
  protected async focusComponent(): Promise<void> {
    await this.component.focus();
  }

  /**
   * Type in component
   */
  protected async typeInComponent(text: string): Promise<void> {
    await this.component.fill(text);
  }

  /**
   * Get component text
   */
  protected async getComponentText(): Promise<string> {
    return await this.component.textContent() || '';
  }

  /**
   * Get component attribute
   */
  protected async getComponentAttribute(attr: string): Promise<string | null> {
    return await this.component.getAttribute(attr);
  }

  /**
   * Assert component is accessible
   */
  protected async assertComponentAccessible(): Promise<void> {
    // Check for aria-label if applicable
    const role = await this.component.getAttribute('role');
    const ariaLabel = await this.component.getAttribute('aria-label');
    const ariaLabelledBy = await this.component.getAttribute('aria-labelledby');

    // Interactive elements should have accessible name
    if (role && !['presentation', 'none'].includes(role)) {
      const hasAccessibleName = !!(ariaLabel || ariaLabelledBy || (await this.component.textContent()));
      expect(
        hasAccessibleName,
        `Component should have accessible name (aria-label, aria-labelledby, or text content)`
      ).toBe(true);
    }
  }

  /**
   * Test component interaction
   */
  protected async testComponentInteraction(): Promise<void> {
    // Component must be visible for interaction
    await this.assertComponentVisible();

    // Component must be enabled (if applicable)
    const tagName = await this.component.evaluate((el) => el.tagName.toLowerCase());
    if (['button', 'input', 'select', 'textarea'].includes(tagName)) {
      await this.assertComponentEnabled();
    }

    // Hover over component
    await this.hoverComponent();
    await this.wait(100);

    // Focus component (if applicable)
    if (['button', 'input', 'select', 'textarea', 'a'].includes(tagName)) {
      await this.focusComponent();
      await this.assertions.assertFocused(this.component);
    }
  }

  /**
   * Test component with different props
   */
  protected async testComponentWithProps(props: Record<string, any>): Promise<void> {
    // This would typically involve re-rendering component with different props
    // Implementation depends on how your app handles component props
    console.log('Testing component with props:', props);
  }

  /**
   * Screenshot component
   */
  protected async screenshotComponent(): Promise<void> {
    const name = this.config.name.replace(/\s+/g, '-').toLowerCase();
    await this.screenshotHelper.saveElementScreenshot(this.component, `${name}.png`);
  }

  /**
   * Test component in different states
   */
  protected async testComponentStates(
    states: Array<{ name: string; action: () => Promise<void> }>
  ): Promise<void> {
    for (const state of states) {
      await state.action();
      await this.wait(100); // Wait for state transition

      // Screenshot state
      const name = `${this.config.name.replace(/\s+/g, '-').toLowerCase()}-${state.name}`;
      await this.screenshotHelper.saveElementScreenshot(this.component, `${name}.png`);
    }
  }

  /**
   * Assert component has correct ARIA attributes
   */
  protected async assertARIA(attributes: Record<string, string>): Promise<void> {
    for (const [attr, value] of Object.entries(attributes)) {
      const actualValue = await this.component.getAttribute(attr);
      expect(
        actualValue,
        `Component should have ${attr}="${value}"`
      ).toBe(value);
    }
  }

  /**
   * Assert component matches snapshot
   */
  protected async assertMatchesSnapshot(): Promise<void> {
    const name = this.config.name.replace(/\s+/g, '-').toLowerCase();
    const screenshot = await this.screenshotHelper.screenshotElement(this.component);
    await expect(screenshot).toMatchSnapshot(`${name}.png`);
  }

  /**
   * Measure component render time
   */
  protected async measureComponentRenderTime(): Promise<number> {
    const startTime = Date.now();
    await this.assertComponentVisible();
    const endTime = Date.now();
    return endTime - startTime;
  }

  /**
   * Assert component performance
   */
  protected async assertComponentPerformance(maxRenderTime: number = 100): Promise<void> {
    const renderTime = await this.measureComponentRenderTime();
    expect(
      renderTime,
      `Component should render in under ${maxRenderTime}ms`
    ).toBeLessThanOrEqual(maxRenderTime);
  }

  /**
   * Get component bounding box
   */
  protected async getComponentBoundingBox(): Promise<{ x: number; y: number; width: number; height: number }> {
    return await this.component.boundingBox() || { x: 0, y: 0, width: 0, height: 0 };
  }

  /**
   * Assert component position
   */
  protected async assertComponentPosition(position: { x?: number; y?: number }): Promise<void> {
    const box = await this.getComponentBoundingBox();

    if (position.x !== undefined) {
      expect(box.x, `Component x position should be ${position.x}`).toBe(position.x);
    }

    if (position.y !== undefined) {
      expect(box.y, `Component y position should be ${position.y}`).toBe(position.y);
    }
  }

  /**
   * Assert component size
   */
  protected async assertComponentSize(size: { width?: number; height?: number }): Promise<void> {
    const box = await this.getComponentBoundingBox();

    if (size.width !== undefined) {
      expect(box.width, `Component width should be ${size.width}`).toBe(size.width);
    }

    if (size.height !== undefined) {
      expect(box.height, `Component height should be ${size.height}`).toBe(size.height);
    }
  }
}

/**
 * Component test fixture builder
 */
export function createBaseComponentTest(page: Page, config: ComponentTestConfig): BaseComponentTest {
  const TestClass = class extends BaseComponentTest {};
  return new TestClass(page, config);
}
