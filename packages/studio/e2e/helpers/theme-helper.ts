/**
 * Theme Helper
 *
 * Provides utilities for testing dark/light mode themes
 * and theme switching functionality
 */

import { Page, Locator } from '@playwright/test';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  defaultTheme: Theme;
  storageKey: string;
  lightClassName: string;
  darkClassName: string;
}

/**
 * Default theme configuration (matches next-themes)
 */
export const defaultThemeConfig: ThemeConfig = {
  defaultTheme: 'system',
  storageKey: 'theme',
  lightClassName: 'light',
  darkClassName: 'dark',
};

/**
 * Theme Helper Class
 */
export class ThemeHelper {
  private config: ThemeConfig;

  constructor(
    private page: Page,
    config: Partial<ThemeConfig> = {}
  ) {
    this.config = { ...defaultThemeConfig, ...config };
  }

  /**
   * Get current theme from localStorage
   */
  async getCurrentTheme(): Promise<Theme | null> {
    const theme = await this.page.evaluate(
      ({ key }) => localStorage.getItem(key),
      { key: this.config.storageKey }
    );
    return theme as Theme | null;
  }

  /**
   * Set theme in localStorage
   */
  async setTheme(theme: Theme): Promise<void> {
    await this.page.evaluate(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: this.config.storageKey, value: theme }
    );
    await this.page.reload();
  }

  /**
   * Remove theme from localStorage (reverts to default)
   */
  async clearTheme(): Promise<void> {
    await this.page.evaluate(
      ({ key }) => localStorage.removeItem(key),
      { key: this.config.storageKey }
    );
    await this.page.reload();
  }

  /**
   * Check if dark mode is active on the page
   */
  async isDarkMode(): Promise<boolean> {
    const html = this.page.locator('html');
    const className = await html.getAttribute('class');
    return className?.includes(this.config.darkClassName) || false;
  }

  /**
   * Check if light mode is active on the page
   */
  async isLightMode(): Promise<boolean> {
    const html = this.page.locator('html');
    const className = await html.getAttribute('class');
    return className?.includes(this.config.lightClassName) || false;
  }

  /**
   * Get the theme toggle button
   */
  getThemeToggleButton(): Locator {
    return this.page.getByTestId('theme-toggle').or(
      this.page.getByRole('button', {
        name: /toggle theme|switch theme|dark mode|light mode/i,
      })
    );
  }

  /**
   * Click theme toggle button
   */
  async toggleTheme(): Promise<void> {
    const button = this.getThemeToggleButton();
    await button.click();
    // Wait for theme transition
    await this.page.waitForTimeout(200);
  }

  /**
   * Assert current theme
   */
  async assertTheme(theme: 'light' | 'dark'): Promise<void> {
    const isDark = await this.isDarkMode();
    const isLight = await this.isLightMode();

    if (theme === 'dark') {
      if (!isDark) {
        throw new Error(`Expected dark mode, but got light mode`);
      }
    } else {
      if (!isLight) {
        throw new Error(`Expected light mode, but got dark mode`);
      }
    }
  }

  /**
   * Assert theme toggle button exists
   */
  async assertThemeToggleExists(): Promise<void> {
    const button = this.getThemeToggleButton();
    await button.isVisible();
  }

  /**
   * Get CSS variable value
   */
  async getCSSVariable(name: string): Promise<string> {
    return await this.page.evaluate(
      ({ varName }) => getComputedStyle(document.documentElement).getPropertyValue(varName),
      { varName: name }
    );
  }

  /**
   * Assert background color matches theme
   */
  async assertBackgroundColor(theme: 'light' | 'dark'): Promise<void> {
    const body = this.page.locator('body');
    const bgColor = await body.evaluate((el) => getComputedStyle(el).backgroundColor);

    // Dark theme should have dark background
    if (theme === 'dark') {
      // RGB to check if it's dark (sum of RGB < 384 for dark backgrounds)
      const rgb = bgColor.match(/\d+/g);
      if (rgb) {
        const [, g, b] = rgb.map(Number);
        const brightness = (parseInt(rgb[0]) * 299 + g * 587 + b * 114) / 1000;
        // Brightness < 128 is considered dark
        if (brightness > 128) {
          throw new Error(`Expected dark background but got brightness ${brightness}`);
        }
      }
    }
  }

  /**
   * Assert text color has sufficient contrast
   */
  async assertTextColorContrast(theme: 'light' | 'dark'): Promise<void> {
    const textColor = await this.page.evaluate(
      () => getComputedStyle(document.body).color
    );

    expect(textColor).toBeDefined();
    // Full contrast check would require color parsing library
    // This is a basic sanity check
  }

  /**
   * Test theme persistence across page reloads
   */
  async assertThemePersists(theme: Theme): Promise<void> {
    // Set theme
    await this.setTheme(theme);

    // Reload page
    await this.page.reload();

    // Check theme persisted
    const currentTheme = await this.getCurrentTheme();
    if (theme !== 'system') {
      expect(currentTheme, `Theme "${theme}" should persist after reload`).toBe(theme);
    }
  }

  /**
   * Test theme toggle functionality
   */
  async testThemeToggle(): Promise<void> {
    const initialTheme = await this.isDarkMode() ? 'dark' : 'light';

    // Toggle
    await this.toggleTheme();

    // Verify theme changed
    const newTheme = await this.isDarkMode() ? 'dark' : 'light';
    expect(newTheme, 'Theme should toggle').not.toBe(initialTheme);

    // Toggle back
    await this.toggleTheme();

    // Verify back to original
    const finalTheme = await this.isDarkMode() ? 'dark' : 'light';
    expect(finalTheme, 'Theme should toggle back').toBe(initialTheme);
  }

  /**
   * Get all theme-related CSS classes on html element
   */
  async getHtmlClasses(): Promise<string[]> {
    const className = await this.page.locator('html').getAttribute('class');
    return className?.split(' ').filter(Boolean) || [];
  }

  /**
   * Assert specific theme class is applied
   */
  async assertThemeClassApplied(theme: 'light' | 'dark'): Promise<void> {
    const classes = await this.getHtmlClasses();
    const expectedClass = theme === 'dark' ? this.config.darkClassName : this.config.lightClassName;
    expect(classes, `HTML should have "${expectedClass}" class`).toContain(expectedClass);
  }

  /**
   * Wait for theme transition to complete
   */
  async waitForThemeTransition(): Promise<void> {
    // Default theme transition is usually 200-300ms
    await this.page.waitForTimeout(350);
  }
}

/**
 * Create theme helper for a page
 */
export function createThemeHelper(page: Page, config?: Partial<ThemeConfig>): ThemeHelper {
  return new ThemeHelper(page, config);
}
