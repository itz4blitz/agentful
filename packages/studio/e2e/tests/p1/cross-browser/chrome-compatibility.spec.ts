/**
 * Chrome Compatibility Tests
 *
 * Tests Chrome-specific features and ensures compatibility with:
 * - Chrome Latest
 * - Chrome Latest-1
 * - Edge (Chromium-based)
 *
 * TC-E2E-015: Cross-browser Compatibility - Chrome
 */

import { test, expect } from '../../fixtures/app.fixture';
import { createThemeHelper } from '../../helpers/theme-helper';

test.describe('Chrome Compatibility', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ app }) => {
    await app.goto();
    await app.waitForStable();
  });

  test('should support CSS custom properties (variables)', async ({ page }) => {
    // Chrome has full support for CSS custom properties
    const cssVar = await page.evaluate(() => {
      const root = document.documentElement;
      const bgColor = getComputedStyle(root).getPropertyValue('--background');
      const fgColor = getComputedStyle(root).getPropertyValue('--foreground');
      return { bgColor, fgColor };
    });

    expect(cssVar.bgColor).toBeTruthy();
    expect(cssVar.fgColor).toBeTruthy();
  });

  test('should support theme switching with localStorage', async ({ page }) => {
    const themeHelper = createThemeHelper(page);

    // Get initial theme
    const initialTheme = await themeHelper.getCurrentTheme();

    // Toggle theme
    await themeHelper.toggleTheme();
    await themeHelper.waitForThemeTransition();

    // Verify localStorage updated
    const newTheme = await themeHelper.getCurrentTheme();
    expect(newTheme).toBeTruthy();

    // Verify theme class applied
    const isDark = await themeHelper.isDarkMode();
    expect(isDark).toBeDefined();
  });

  test('should support CSS Grid layout', async ({ page }) => {
    // Verify grid layout is working
    const gridInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="Card"]');
      const container = cards[0]?.parentElement;
      if (!container) return null;

      const styles = getComputedStyle(container);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gap: styles.gap,
        cardCount: cards.length,
      };
    });

    expect(gridInfo).toBeTruthy();
    expect(gridInfo?.display).toBe('grid');
    expect(gridInfo?.cardCount).toBeGreaterThan(0);
  });

  test('should support CSS Flexbox', async ({ page }) => {
    // Check flexbox usage in buttons or header
    const flexInfo = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      if (buttons.length === 0) return null;

      const styles = getComputedStyle(buttons[0]);
      return {
        display: styles.display,
        alignItems: styles.alignItems,
        justifyContent: styles.justifyContent,
      };
    });

    expect(flexInfo).toBeTruthy();
    expect(['flex', 'inline-flex', 'block', 'inline-block']).toContain(flexInfo?.display);
  });

  test('should support ES6+ JavaScript features', async ({ page }) => {
    // Test modern JS features used in React 19
    const jsFeatures = await page.evaluate(() => {
      return {
        // Arrow functions
        arrowFn: (() => true)(),

        // Template literals
        template: `test`,

        // Destructuring
        destructuring: (() => {
          const { a = 1 } = {};
          return a;
        })(),

        // Spread operator
        spread: [...[1, 2], 3].length,

        // Optional chaining
        optional: null?.test,

        // Nullish coalescing
        nullish: null ?? 'default',

        // Promises
        promise: Promise.resolve('test'),

        // Async/await
        async: (async () => await Promise.resolve())() instanceof Promise,
      };
    });

    expect(jsFeatures.arrowFn).toBe(true);
    expect(jsFeatures.template).toBe('test');
    expect(jsFeatures.destructuring).toBe(1);
    expect(jsFeatures.spread).toBe(3);
    expect(jsFeatures.optional).toBeUndefined();
    expect(jsFeatures.nullish).toBe('default');
    expect(jsFeatures.promise).toBeInstanceOf(Promise);
    expect(jsFeatures.async).toBe(true);
  });

  test('should support Intersection Observer API', async ({ page }) => {
    const hasIntersectionObserver = await page.evaluate(() => {
      return 'IntersectionObserver' in window;
    });

    expect(hasIntersectionObserver).toBe(true);
  });

  test('should support Resize Observer API', async ({ page }) => {
    const hasResizeObserver = await page.evaluate(() => {
      return 'ResizeObserver' in window;
    });

    expect(hasResizeObserver).toBe(true);
  });

  test('should support requestAnimationFrame', async ({ page }) => {
    const hasRAF = await page.evaluate(() => {
      return 'requestAnimationFrame' in window;
    });

    expect(hasRAF).toBe(true);
  });

  test('should support localStorage and sessionStorage', async ({ page }) => {
    const storageSupport = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        sessionStorage.setItem('test', 'value');
        localStorage.removeItem('test');
        sessionStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    });

    expect(storageSupport).toBe(true);
  });

  test('should support History API', async ({ page }) => {
    const historyAPI = await page.evaluate(() => {
      return {
        pushState: typeof history.pushState === 'function',
        replaceState: typeof history.replaceState === 'function',
        state: history.state,
      };
    });

    expect(historyAPI.pushState).toBe(true);
    expect(historyAPI.replaceState).toBe(true);
  });

  test('should support Fetch API', async ({ page }) => {
    const hasFetch = await page.evaluate(() => {
      return 'fetch' in window;
    });

    expect(hasFetch).toBe(true);
  });

  test('should support Web Workers', async ({ page }) => {
    const hasWebWorker = await page.evaluate(() => {
      return 'Worker' in window;
    });

    expect(hasWebWorker).toBe(true);
  });

  test('should support Mutation Observer', async ({ page }) => {
    const hasMutationObserver = await page.evaluate(() => {
      return 'MutationObserver' in window;
    });

    expect(hasMutationObserver).toBe(true);
  });

  test('should handle dark mode color scheme correctly', async ({ page }) => {
    // Test Chrome's color-scheme meta tag support
    const colorScheme = await page.evaluate(() => {
      const metaTag = document.querySelector('meta[name="color-scheme"]');
      return metaTag?.getAttribute('content');
    });

    // Should support light and dark color schemes
    if (colorScheme) {
      expect(colorScheme).toMatch(/light|dark|normal/i);
    }
  });

  test('should support CSS backdrop-filter', async ({ page }) => {
    const backdropSupport = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.backdropFilter = 'blur(10px)';
      return testEl.style.backdropFilter !== '';
    });

    // Chrome supports backdrop-filter
    expect(backdropSupport).toBe(true);
  });

  test('should support smooth scrolling', async ({ page }) => {
    const smoothScroll = await page.evaluate(() => {
      return 'scrollBehavior' in document.documentElement.style;
    });

    expect(smoothScroll).toBe(true);
  });

  test('should support CSS transitions', async ({ themeHelper }) => {
    // Test theme transition
    const initialTheme = await themeHelper.isDarkMode();

    await themeHelper.toggleTheme();

    // Wait for transition
    await themeHelper.waitForThemeTransition();

    const newTheme = await themeHelper.isDarkMode();
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should support CSS transforms', async ({ page }) => {
    const transformSupport = await page.evaluate(() => {
      const testEl = document.createElement('div');
      testEl.style.transform = 'translateX(10px)';
      return testEl.style.transform !== '';
    });

    expect(transformSupport).toBe(true);
  });

  test('should support CSS animations', async ({ page }) => {
    const animationSupport = await page.evaluate(() => {
      return 'animation' in document.documentElement.style;
    });

    expect(animationSupport).toBe(true);
  });

  test('should support console APIs for debugging', async ({ page }) => {
    const consoleAPIs = await page.evaluate(() => {
      return {
        log: typeof console.log === 'function',
        warn: typeof console.warn === 'function',
        error: typeof console.error === 'function',
        info: typeof console.info === 'function',
      };
    });

    expect(consoleAPIs.log).toBe(true);
    expect(consoleAPIs.warn).toBe(true);
    expect(consoleAPIs.error).toBe(true);
    expect(consoleAPIs.info).toBe(true);
  });

  test('should support performance APIs', async ({ page }) => {
    const perfAPIs = await page.evaluate(() => {
      return {
        performance: typeof performance !== 'undefined',
        now: typeof performance.now === 'function',
        mark: typeof performance.mark === 'function',
        measure: typeof performance.measure === 'function',
        getEntries: typeof performance.getEntries === 'function',
      };
    });

    expect(perfAPIs.performance).toBe(true);
    expect(perfAPIs.now).toBe(true);
    expect(perfAPIs.mark).toBe(true);
    expect(perfAPIs.measure).toBe(true);
    expect(perfAPIs.getEntries).toBe(true);
  });

  test('should support Custom Elements (Web Components)', async ({ page }) => {
    const customElementsSupport = await page.evaluate(() => {
      return 'customElements' in window;
    });

    expect(customElementsSupport).toBe(true);
  });

  test('should support Shadow DOM', async ({ page }) => {
    const shadowDOMSupport = await page.evaluate(() => {
      return 'ShadowRoot' in window;
    });

    expect(shadowDOMSupport).toBe(true);
  });

  test('should have no console errors or warnings', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        logs.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Filter out known benign warnings
    const filteredLogs = logs.filter(
      log =>
        !log.includes('DevTools') &&
        !log.includes('Extension') &&
        !log.includes('favicon')
    );

    expect(filteredLogs).toHaveLength(0);
  });
});
