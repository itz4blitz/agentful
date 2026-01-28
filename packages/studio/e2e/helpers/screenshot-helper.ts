/**
 * Screenshot Helper
 *
 * Provides utilities for taking and comparing screenshots
 * Supports visual regression testing
 */

import { Page, Locator, expect } from '@playwright/test';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  timeout?: number;
  animations?: 'allow' | 'disabled';
}

export interface VisualRegressionOptions {
  threshold?: number;
  maxDiffPixels?: number;
  maxDiffRatio?: number;
}

/**
 * Screenshot Helper Class
 */
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take a screenshot of the entire page
   */
  async screenshotPage(options?: ScreenshotOptions): Promise<Buffer> {
    return await this.page.screenshot({
      fullPage: true,
      animations: 'disabled',
      ...options,
    });
  }

  /**
   * Take a screenshot of a specific element
   */
  async screenshotElement(locator: Locator, options?: ScreenshotOptions): Promise<Buffer> {
    return await locator.screenshot({
      animations: 'disabled',
      ...options,
    });
  }

  /**
   * Take screenshot and save to file
   */
  async saveScreenshot(path: string, options?: ScreenshotOptions): Promise<void> {
    const screenshotDir = join(process.cwd(), 'test-results', 'screenshots');
    await mkdir(screenshotDir, { recursive: true });

    const fullPath = join(screenshotDir, path);
    const buffer = await this.screenshotPage(options);
    await writeFile(fullPath, buffer);
  }

  /**
   * Take screenshot of element and save to file
   */
  async saveElementScreenshot(
    locator: Locator,
    path: string,
    options?: ScreenshotOptions
  ): Promise<void> {
    const screenshotDir = join(process.cwd(), 'test-results', 'screenshots');
    await mkdir(screenshotDir, { recursive: true });

    const fullPath = join(screenshotDir, path);
    const buffer = await this.screenshotElement(locator, options);
    await writeFile(fullPath, buffer);
  }

  /**
   * Compare current screenshot with baseline
   */
  async compareWithBaseline(
    name: string,
    options?: VisualRegressionOptions & ScreenshotOptions
  ): Promise<void> {
    const baselineDir = join(process.cwd(), 'e2e', 'screenshots', 'baseline');
    const screenshot = await this.screenshotPage(options);

    // Playwright's built-in screenshot comparison
    await expect(screenshot).toMatchSnapshot(`${name}.png`, {
      maxDiffPixels: options?.maxDiffPixels,
      maxDiffRatio: options?.maxDiffRatio,
      threshold: options?.threshold,
    });
  }

  /**
   * Compare element screenshot with baseline
   */
  async compareElementWithBaseline(
    locator: Locator,
    name: string,
    options?: VisualRegressionOptions & ScreenshotOptions
  ): Promise<void> {
    const screenshot = await this.screenshotElement(locator, options);

    await expect(screenshot).toMatchSnapshot(`${name}.png`, {
      maxDiffPixels: options?.maxDiffPixels,
      maxDiffRatio: options?.maxDiffRatio,
      threshold: options?.threshold,
    });
  }

  /**
   * Take screenshot on test failure
   */
  async captureOnFailure(testName: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `failure-${testName}-${timestamp}.png`;
    await this.saveScreenshot(filename);
  }

  /**
   * Take screenshot with masked elements
   * (e.g., dynamic content, dates, user-specific data)
   */
  async screenshotWithMaskedElements(
    selectorsToMask: string[],
    options?: ScreenshotOptions
  ): Promise<Buffer> {
    // Mask elements
    for (const selector of selectorsToMask) {
      await this.page.locator(selector).evaluate((el) => {
        el.style.opacity = '0';
        el.style.background = '#000';
        el.style.color = '#000';
      });
    }

    const screenshot = await this.screenshotPage(options);

    // Restore elements
    for (const selector of selectorsToMask) {
      await this.page.locator(selector).evaluate((el) => {
        (el as HTMLElement).style.opacity = '';
        (el as HTMLElement).style.background = '';
        (el as HTMLElement).style.color = '';
      });
    }

    return screenshot;
  }

  /**
   * Take screenshot of viewport only
   */
  async screenshotViewport(options?: ScreenshotOptions): Promise<Buffer> {
    return await this.page.screenshot({
      fullPage: false,
      animations: 'disabled',
      ...options,
    });
  }

  /**
   * Take screenshot at specific viewport size
   */
  async screenshotAtViewport(
    width: number,
    height: number,
    options?: ScreenshotOptions
  ): Promise<Buffer> {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(100); // Wait for layout to settle
    return await this.screenshotPage(options);
  }

  /**
   * Take screenshots at multiple breakpoints
   */
  async screenshotAtBreakpoints(
    breakpoints: { width: number; height: number; name: string }[]
  ): Promise<void> {
    const screenshots: Array<{ name: string; buffer: Buffer }> = [];

    for (const breakpoint of breakpoints) {
      const buffer = await this.screenshotAtViewport(
        breakpoint.width,
        breakpoint.height
      );
      screenshots.push({ name: breakpoint.name, buffer });
    }

    // Save all screenshots
    const screenshotDir = join(process.cwd(), 'test-results', 'screenshots', 'breakpoints');
    await mkdir(screenshotDir, { recursive: true });

    for (const { name, buffer } of screenshots) {
      await writeFile(join(screenshotDir, `${name}.png`), buffer);
    }
  }

  /**
   * Take screenshot of element in different states
   */
  async screenshotElementStates(
    locator: Locator,
    states: Array<{ name: string; action: () => Promise<void> }>
  ): Promise<void> {
    const screenshotDir = join(process.cwd(), 'test-results', 'screenshots', 'states');
    await mkdir(screenshotDir, { recursive: true });

    for (const state of states) {
      await state.action();
      await this.page.waitForTimeout(100); // Wait for transition
      const buffer = await this.screenshotElement(locator);
      await writeFile(join(screenshotDir, `${state.name}.png`), buffer);
    }
  }

  /**
   * Create animated GIF from screenshots
   * Note: This requires additional setup and image processing library
   */
  async createAnimatedGif(
    screenshots: Buffer[],
    outputPath: string,
    duration: number = 500
  ): Promise<void> {
    // Placeholder for GIF creation
    // Would require library like 'gif-encoder' or 'gifwrap'
    throw new Error('GIF creation not implemented. Add gif-encoder package to enable.');
  }

  /**
   * Hide scrollbars for cleaner screenshots
   */
  async hideScrollbars(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        *::-webkit-scrollbar {
          display: none !important;
        }
      `,
    });
  }

  /**
   * Show scrollbars (restore default)
   */
  async showScrollbars(): Promise<void> {
    // Reload page to remove injected styles
    await this.page.reload();
  }
}

/**
 * Create screenshot helper for a page
 */
export function createScreenshotHelper(page: Page): ScreenshotHelper {
  return new ScreenshotHelper(page);
}
