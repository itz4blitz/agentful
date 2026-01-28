/**
 * Common Selectors and Locators
 *
 * Provides reusable selector strategies for common UI elements
 * Uses data-testid attributes when available, falls back to accessible selectors
 */

import { Page, Locator } from '@playwright/test';

/**
 * Common data-testid attribute names
 * Update these to match your application's test IDs
 */
export const testIds = {
  // Header
  header: 'app-header',
  headerTitle: 'app-title',
  themeToggle: 'theme-toggle',

  // Navigation
  nav: 'main-nav',
  navLink: (name: string) => `nav-link-${name}`,

  // Cards
  card: (title: string) => `card-${title}`,
  cardTitle: (title: string) => `card-title-${title}`,
  cardDescription: (title: string) => `card-description-${title}`,

  // Buttons
  button: (label: string) => `button-${label}`,
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',

  // Forms
  form: (name: string) => `form-${name}`,
  input: (name: string) => `input-${name}`,
  label: (name: string) => `label-${name}`,

  // Feedback
  toast: 'toast',
  errorMessage: 'error-message',
  successMessage: 'success-message',

  // Loading
  spinner: 'loading-spinner',
  skeleton: 'skeleton-loader',
};

/**
 * Selector Helper Class
 * Provides methods to locate common UI elements
 */
export class Selectors {
  constructor(private page: Page) {}

  /**
   * Get element by data-testid
   */
  byTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  /**
   * Get element by text content
   */
  byText(text: string, exact: boolean = true): Locator {
    return this.page.getByText(text, { exact });
  }

  /**
   * Get element by role
   */
  byRole(role: string, options?: { name?: string | RegExp; exact?: boolean }): Locator {
    return this.page.getByRole(role as any, options);
  }

  /**
   * Get element by label
   */
  byLabel(text: string, exact: boolean = true): Locator {
    return this.page.getByLabel(text, { exact });
  }

  /**
   * Get element by placeholder
   */
  byPlaceholder(text: string, exact: boolean = true): Locator {
    return this.page.getByPlaceholder(text, { exact });
  }

  /**
   * Get element by alt text (images)
   */
  byAlt(text: string, exact: boolean = true): Locator {
    return this.page.getByAltText(text, { exact });
  }

  /**
   * Get element by title attribute
   */
  byTitle(text: string, exact: boolean = true): Locator {
    return this.page.getByTitle(text, { exact });
  }

  /**
   * Get all elements matching selector
   */
  all(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Get first element matching selector
   */
  first(selector: string): Locator {
    return this.page.locator(selector).first();
  }

  /**
   * Get nth element matching selector
   */
  nth(selector: string, index: number): Locator {
    return this.page.locator(selector).nth(index);
  }

  // Specific element helpers

  /**
   * Get header element
   */
  get header(): Locator {
    return this.byTestId(testIds.header).or(this.page.locator('header'));
  }

  /**
   * Get header title
   */
  get headerTitle(): Locator {
    return this.byTestId(testIds.headerTitle).or(this.page.locator('h1'));
  }

  /**
   * Get theme toggle button
   */
  get themeToggle(): Locator {
    return this.byTestId(testIds.themeToggle).or(
      this.byRole('button', { name: /toggle theme|switch theme|dark mode|light mode/i })
    );
  }

  /**
   * Get all cards
   */
  get cards(): Locator {
    return this.page.locator('[class*="Card"]');
  }

  /**
   * Get card by title
   */
  cardByTitle(title: string): Locator {
    return this.byTestId(testIds.card(title)).or(
      this.page.locator('[class*="Card"]').filter({ hasText: title })
    );
  }

  /**
   * Get button by text
   */
  buttonByText(text: string): Locator {
    return this.byRole('button', { name: text, exact: true });
  }

  /**
   * Get all buttons
   */
  get buttons(): Locator {
    return this.byRole('button');
  }

  /**
   * Get all links
   */
  get links(): Locator {
    return this.byRole('link');
  }

  /**
   * Get link by text
   */
  linkByText(text: string): Locator {
    return this.byRole('link', { name: text, exact: true });
  }

  /**
   * Get input by label
   */
  inputByLabel(label: string): Locator {
    return this.byLabel(label);
  }

  /**
   * Get all inputs
   */
  get inputs(): Locator {
    return this.byRole('textbox');
  }

  /**
   * Get toast notifications
   */
  get toasts(): Locator {
    return this.byTestId(testIds.toast).or(
      this.page.locator('[class*="toast"], [class*="Toast"], [role="alert"]')
    );
  }

  /**
   * Get error messages
   */
  get errorMessages(): Locator {
    return this.byTestId(testIds.errorMessage).or(
      this.page.locator('[class*="error"], [role="alert"]').filter({ hasText: /error|warning|invalid/i })
    );
  }

  /**
   * Get success messages
   */
  get successMessages(): Locator {
    return this.byTestId(testIds.successMessage).or(
      this.page.locator('[class*="success"]').filter({ hasText: /success|complete|done/i })
    );
  }

  /**
   * Get loading spinners
   */
  get spinners(): Locator {
    return this.byTestId(testIds.spinner).or(
      this.page.locator('[class*="loading"], [class*="spinner"], [aria-busy="true"]')
    );
  }

  /**
   * Get skeleton loaders
   */
  get skeletons(): Locator {
    return this.byTestId(testIds.skeleton).or(
      this.page.locator('[class*="skeleton"]')
    );
  }
}

/**
 * Create selector helper for a page
 */
export function createSelectors(page: Page): Selectors {
  return new Selectors(page);
}
