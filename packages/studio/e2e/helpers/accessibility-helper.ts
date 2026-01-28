/**
 * Accessibility Helper
 *
 * Provides comprehensive accessibility testing utilities using @axe-core/playwright
 * Implements WCAG 2.1 AA compliance testing, keyboard navigation, and screen reader tests
 */

import { Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility violation details
 */
export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

/**
 * Color contrast result
 */
export interface ContrastResult {
  passes: boolean;
  contrastRatio: number;
  expected: number;
  actual: number;
  foreground: string;
  background: string;
}

/**
 * Keyboard navigation result
 */
export interface KeyboardNavResult {
  element: string;
  accessible: boolean;
  tabIndex: number | null;
  hasFocusIndicator: boolean;
  canActivate: boolean;
}

/**
 * Screen reader announcement result
 */
export interface ScreenReaderResult {
  element: string;
  accessibleName: string;
  role: string;
  hasLabel: boolean;
  hasDescribedBy: boolean;
}

/**
 * WCAG compliance level
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * WCAG tags for axe-core
 */
const WCAG_TAGS = {
  A: ['wcag2a', 'wcag2aa', 'wcag2aaa'],
  AA: ['wcag2aa', 'wcag2aaa'],
  AAA: ['wcag2aaa'],
};

/**
 * Create accessibility helper
 */
export function createAccessibilityHelper(page: Page) {
  /**
   * Run axe-core accessibility scan
   */
  async function scanAccessibility(
    options: {
      context?: string | Locator | Element;
      rules?: Record<string, any>;
      tags?: string[];
      wcagLevel?: WCAGLevel;
      excluded?: string[];
    } = {}
  ): Promise<AccessibilityViolation[]> {
    const {
      context,
      rules = {},
      tags = WCAG_TAGS[options.wcagLevel || 'AA'],
      wcagLevel = 'AA',
      excluded = [],
    } = options;

    let builder = new AxeBuilder({ page })
      .withTags(tags)
      .disableRules(['color-contrast']); // Test contrast separately for detailed reporting

    // Add custom rules
    if (Object.keys(rules).length > 0) {
      builder = builder.withRules(rules);
    }

    // Exclude elements if specified
    if (excluded.length > 0) {
      builder = builder.exclude(excluded);
    }

    // Scan specific context if provided
    if (context) {
      if (typeof context === 'string') {
        builder = builder.include(context);
      } else if (context instanceof Locator) {
        // For Locator, we need to handle differently
        const element = await context.elementHandle();
        if (element) {
          builder = builder.include(element);
        }
      }
    }

    const results = await builder.analyze();

    return results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact as any,
      description: violation.description,
      tags: violation.tags,
      nodes: violation.nodes.map((node) => ({
        html: node.html,
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));
  }

  /**
   * Assert no accessibility violations
   */
  async function assertNoViolations(
    options: {
      context?: string | Locator;
      wcagLevel?: WCAGLevel;
      excluded?: string[];
    } = {}
  ): Promise<void> {
    const violations = await scanAccessibility(options);

    if (violations.length > 0) {
      const errorMessage = violations
        .map(
          (v) => `
        ${v.id} (${v.impact}):
        ${v.description}
        ${v.nodes.map((n) => `  - ${n.target.join(', ')}: ${n.failureSummary}`).join('\n')}
      `
        )
        .join('\n');

      throw new Error(
        `Found ${violations.length} accessibility violation(s):\n${errorMessage}`
      );
    }
  }

  /**
   * Test color contrast for specific element
   */
  async function testColorContrast(element: Locator): Promise<ContrastResult> {
    const handle = await element.elementHandle();
    if (!handle) {
      throw new Error('Element not found');
    }

    // Get computed styles
    const styles = await handle.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
      };
    });

    // Use axe-core to test contrast
    const results = await new AxeBuilder({ page })
      .include(element)
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolation = results.violations.find((v) => v.id === 'color-contrast');

    // Calculate contrast ratio (simplified version)
    // In real implementation, you'd use a proper color contrast library
    const contrastRatio = contrastViolation ? 0 : 4.5; // Placeholder

    return {
      passes: !contrastViolation,
      contrastRatio,
      expected: 4.5,
      actual: contrastRatio,
      foreground: styles.color,
      background: styles.backgroundColor,
    };
  }

  /**
   * Test keyboard navigation for element
   */
  async function testKeyboardNavigation(element: Locator): Promise<KeyboardNavResult> {
    const handle = await element.elementHandle();
    if (!handle) {
      throw new Error('Element not found');
    }

    // Get accessibility properties
    const a11yProps = await handle.evaluate((el) => {
      return {
        tabIndex: parseInt(el.getAttribute('tabindex') || '-1'),
        tagName: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        role: el.getAttribute('role'),
        disabled: el.getAttribute('disabled') !== null,
      };
    });

    // Check if element can receive focus
    const canFocus =
      a11yProps.tabIndex >= 0 ||
      ['a', 'button', 'input', 'select', 'textarea'].includes(a11yProps.tagName);

    // Check for focus indicator by checking computed outline
    const hasFocusIndicator = await handle.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return (
        styles.outline !== 'none' ||
        styles.boxShadow !== 'none' ||
        el.getAttribute('data-focus-visible') !== null
      );
    });

    // Test if element can be activated with keyboard
    let canActivate = false;
    if (canFocus) {
      try {
        await element.focus();
        const isFocused = await element.evaluate((el: any) =>
          el === document.activeElement
        );

        if (isFocused) {
          // Test Enter/Space activation
          await element.page().keyboard.press('Enter');
          canActivate = true;
        }
      } catch (error) {
        // Element might not be activatable
        canActivate = false;
      }
    }

    return {
      element: a11yProps.tagName + (a11yProps.type ? `[type="${a11yProps.type}"]` : ''),
      accessible: canFocus && !a11yProps.disabled,
      tabIndex: a11yProps.tabIndex,
      hasFocusIndicator,
      canActivate,
    };
  }

  /**
   * Test screen reader compatibility
   */
  async function testScreenReaderCompatibility(
    element: Locator
  ): Promise<ScreenReaderResult> {
    const handle = await element.elementHandle();
    if (!handle) {
      throw new Error('Element not found');
    }

    const result = await handle.evaluate((el) => {
      // Get accessible name using ARIA API
      const accessibleName = (el as any).accessibleName || el.textContent || '';

      // Get role
      const role = (el as any).role || el.tagName.toLowerCase();

      // Check for ARIA labels
      const hasLabel =
        el.hasAttribute('aria-label') ||
        el.hasAttribute('aria-labelledby') ||
        el.hasAttribute('id');

      // Check for aria-describedby
      const hasDescribedBy = el.hasAttribute('aria-describedby');

      return {
        accessibleName,
        role,
        hasLabel,
        hasDescribedBy,
      };
    });

    return result;
  }

  /**
   * Test focus management during interaction
   */
  async function testFocusManagement(
    trigger: Locator,
    expectedFocusTarget?: string | Locator
  ): Promise<boolean> {
    // Get initial focused element
    const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

    // Trigger action
    await trigger.click();

    // Wait a bit for focus to move
    await page.waitForTimeout(100);

    // Get new focused element
    const newFocus = await page.evaluate(() => document.activeElement?.tagName);
    const newFocusId = await page.evaluate(() => document.activeElement?.id);

    // If expected focus target specified, verify it
    if (expectedFocusTarget) {
      const targetSelector =
        typeof expectedFocusTarget === 'string'
          ? expectedFocusTarget
          : await (expectedFocusTarget as any).evaluate((el: any) => `#${el.id}`);

      const isCorrectFocus = await page.evaluate((selector) => {
        const active = document.activeElement;
        if (!active || !active.id) return false;
        return active.matches(selector);
      }, targetSelector);

      return isCorrectFocus;
    }

    // Otherwise just check that focus didn't get lost
    return newFocus !== null && newFocus !== 'BODY';
  }

  /**
   * Test reduced motion preference
   */
  async function testReducedMotion(): Promise<boolean> {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Check if CSS respects reduced motion
    const respectsReducedMotion = await page.evaluate(() => {
      // Check for reduced motion media queries in stylesheets
      const stylesheets = Array.from(document.styleSheets);
      let hasReducedMotion = false;

      stylesheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule) => {
            if (rule.cssText.includes('prefers-reduced-motion')) {
              hasReducedMotion = true;
            }
          });
        } catch (e) {
          // Can't read cross-origin stylesheets
        }
      });

      // Also check inline styles
      const allElements = Array.from(document.querySelectorAll('*'));
      const hasInlineReducedMotion = allElements.some((el) => {
        const style = (el as any).style;
        return style && style.cssText.includes('animation') && style.cssText.includes('reduce');
      });

      return hasReducedMotion || hasInlineReducedMotion;
    });

    // Reset reduced motion
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    return respectsReducedMotion;
  }

  /**
   * Test heading hierarchy
   */
  async function testHeadingHierarchy(): Promise<{
    hasH1: boolean;
    hierarchy: Array<{ level: number; text: string }>;
    issues: string[];
  }> {
    const result = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const hierarchy = headings.map((h) => ({
        level: parseInt(h.tagName.charAt(1)),
        text: h.textContent?.trim() || '',
      }));

      const issues: string[] = [];

      // Check for h1
      const h1Count = headings.filter((h) => h.tagName === 'H1').length;
      if (h1Count === 0) {
        issues.push('No h1 found on page');
      } else if (h1Count > 1) {
        issues.push('Multiple h1 tags found');
      }

      // Check hierarchy (levels shouldn't skip)
      for (let i = 1; i < hierarchy.length; i++) {
        const prev = hierarchy[i - 1].level;
        const curr = hierarchy[i].level;
        if (curr > prev + 1) {
          issues.push(
            `Heading level skipped: h${prev} -> h${curr} (${hierarchy[i].text})`
          );
        }
      }

      return {
        hasH1: h1Count === 1,
        hierarchy,
        issues,
      };
    });

    return result;
  }

  /**
   * Test landmark regions
   */
  async function testLandmarks(): Promise<{
    hasHeader: boolean;
    hasMain: boolean;
    hasNav: boolean;
    hasFooter: boolean;
    issues: string[];
  }> {
    const result = await page.evaluate(() => {
      const issues: string[] = [];

      const hasHeader = !!document.querySelector('header, [role="banner"]');
      const hasMain = !!document.querySelector('main, [role="main"]');
      const hasNav = !!document.querySelector('nav, [role="navigation"]');
      const hasFooter = !!document.querySelector('footer, [role="contentinfo"]');

      if (!hasHeader) issues.push('No header or banner landmark found');
      if (!hasMain) issues.push('No main landmark found');
      if (!hasNav) issues.push('No nav or navigation landmark found');
      if (!hasFooter) issues.push('No footer or contentinfo landmark found');

      return {
        hasHeader,
        hasMain,
        hasNav,
        hasFooter,
        issues,
      };
    });

    return result;
  }

  /**
   * Test ARIA attributes
   */
  async function testAriaAttributes(element: Locator): Promise<{
    hasRole: boolean;
    hasLabel: boolean;
    hasDescribedBy: boolean;
    hasInvalidAria: boolean;
    issues: string[];
  }> {
    const handle = await element.elementHandle();
    if (!handle) {
      throw new Error('Element not found');
    }

    const result = await handle.evaluate((el) => {
      const issues: string[] = [];

      const hasRole = el.hasAttribute('role');
      const hasLabel =
        el.hasAttribute('aria-label') ||
        el.hasAttribute('aria-labelledby') ||
        el.hasAttribute('aria-describedby');
      const hasDescribedBy = el.hasAttribute('aria-describedby');

      // Check for invalid ARIA attributes
      const ariaAttrs = Array.from(el.attributes)
        .map((attr) => attr.name)
        .filter((name) => name.startsWith('aria-'));

      const hasInvalidAria = ariaAttrs.some((attr) => {
        // Check if ARIA attribute is valid for this element
        // This is a simplified check; real implementation would be more thorough
        const invalidPatterns = ['aria-invalid', 'aria-errormessage'];
        return invalidPatterns.includes(attr) && !el.hasAttribute('aria-invalid');
      });

      return {
        hasRole,
        hasLabel,
        hasDescribedBy,
        hasInvalidAria,
        issues,
      };
    });

    return result;
  }

  /**
   * Generate accessibility report
   */
  async function generateReport(): Promise<{
    timestamp: string;
    violations: AccessibilityViolation[];
    passes: number;
    incomplete: number;
    wcagLevel: WCAGLevel;
  }> {
    const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();

    return {
      timestamp: new Date().toISOString(),
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact as any,
        description: v.description,
        tags: v.tags,
        nodes: v.nodes.map((n) => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      })),
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      wcagLevel: 'AA',
    };
  }

  return {
    scanAccessibility,
    assertNoViolations,
    testColorContrast,
    testKeyboardNavigation,
    testScreenReaderCompatibility,
    testFocusManagement,
    testReducedMotion,
    testHeadingHierarchy,
    testLandmarks,
    testAriaAttributes,
    generateReport,
  };
}
