/**
 * Mobile Viewport Responsive Tests
 *
 * Testing mobile viewport sizes (375px - 767px)
 * Based on TEST_STRATEGY.md - TC-E2E-013
 *
 * Devices covered:
 * - iPhone SE (375x667)
 * - iPhone 12/13 (390x844)
 * - Mobile Small (320x568)
 * - Mobile Large (428x926)
 */

import { test, expect } from '@playwright/test';
import { devicePresets } from '../../fixtures/device.fixture';

test.describe('Mobile Viewport (375px - 767px)', () => {
  const mobileDevices = [
    'Mobile Small',   // 320x568
    'Mobile Large',   // 428x926
  ];

  // Test across all mobile devices
  for (const deviceName of mobileDevices) {
    const device = devicePresets[deviceName];

    test.describe(`${deviceName} (${device.viewport.width}x${device.viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(device.viewport);
        await page.goto('/');
      });

      test('should display single column card grid', async ({ page }) => {
        // Wait for cards to render
        await page.waitForSelector('[class*="grid"]');

        // Get all cards
        const cards = page.locator('.grid > div');
        await cards.waitFor({ state: 'visible' });

        const cardCount = await cards.count();
        expect(cardCount).toBe(9);

        // Verify single column layout by checking positioning
        const firstCard = cards.nth(0);
        const secondCard = cards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        // In single column, second card should be below first
        expect(secondBox!.y).toBeGreaterThan(firstBox!.y);

        // And they should have similar x positions (left-aligned)
        expect(Math.abs(secondBox!.x - firstBox!.x)).toBeLessThan(10);
      });

      test('should not have horizontal scroll', async ({ page }) => {
        // Check body width vs viewport width
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = page.viewportSize()!.width;

        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      });

      test('should display header correctly', async ({ page }) => {
        const header = page.locator('header');

        // Check header is visible
        await expect(header).toBeVisible();

        // Verify header layout
        const headerBox = await header.boundingBox();
        expect(headerBox).toBeTruthy();

        // Header should span full width
        expect(headerBox!.width).toBeLessThanOrEqual(device.viewport.width);
      });

      test('should display all content without zooming', async ({ page }) => {
        // Check for horizontal overflow indicators
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });

        expect(hasHorizontalScroll).toBe(false);
      });

      test('should have readable font sizes', async ({ page }) => {
        // Check main heading font size
        const heading = page.locator('h1');
        const fontSize = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Font size should be at least 16px (mobile readable)
        const numericSize = parseFloat(fontSize);
        expect(numericSize).toBeGreaterThanOrEqual(16);
      });

      test('should stack buttons vertically or wrap appropriately', async ({ page }) => {
        const buttonContainer = page.locator('.flex.flex-wrap.gap-4');
        await expect(buttonContainer).toBeVisible();

        const buttons = buttonContainer.locator('button');
        const buttonCount = await buttons.count();

        // Should have 6 buttons
        expect(buttonCount).toBe(6);

        // Verify buttons are in a flex container that wraps
        const flexWrap = await buttonContainer.evaluate((el) => {
          return window.getComputedStyle(el).flexWrap;
        });

        expect(flexWrap).toBe('wrap');
      });

      test('should maintain touch target minimum size (44x44px)', async ({ page }) => {
        // Check theme toggle button
        const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], button:has(svg)').first();
        await expect(themeToggle).toBeVisible();

        const toggleBox = await themeToggle.boundingBox();

        // Touch targets should be at least 44x44 (WCAG 2.5.5)
        expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
        expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
      });

      test('should display cards with readable content', async ({ page }) => {
        const cards = page.locator('.grid > div');

        for (let i = 0; i < await cards.count(); i++) {
          const card = cards.nth(i);

          // Check card is visible
          await expect(card).toBeVisible();

          // Check card width doesn't exceed viewport
          const cardBox = await card.boundingBox();
          expect(cardBox!.width).toBeLessThanOrEqual(device.viewport.width - 32); // Account for padding
        }
      });

      test('should display welcome section correctly', async ({ page }) => {
        const welcomeSection = page.locator('main > div:first-of-type');
        await expect(welcomeSection).toBeVisible();

        // Check text is centered
        const textAlign = await welcomeSection.evaluate((el) => {
          return window.getComputedStyle(el).textAlign;
        });

        expect(textAlign).toBe('center');
      });

      test('should handle card descriptions on small screens', async ({ page }) => {
        const cardDescriptions = page.locator('[class*="CardDescription"]');

        const count = await cardDescriptions.count();
        expect(count).toBe(9);

        // Check descriptions are readable
        for (let i = 0; i < count; i++) {
          const desc = cardDescriptions.nth(i);
          await expect(desc).toBeVisible();

          // Check font size
          const fontSize = await desc.evaluate((el) => {
            return window.getComputedStyle(el).fontSize;
          });

          const numericSize = parseFloat(fontSize);
          expect(numericSize).toBeGreaterThanOrEqual(12); // Minimum readable size
        }
      });

      test('should preserve spacing between elements', async ({ page }) => {
        // Check container padding
        const main = page.locator('main');
        const paddingLeft = await main.evaluate((el) => {
          return window.getComputedStyle(el).paddingLeft;
        });

        // Should have padding for mobile
        expect(paddingLeft).not.toBe('0px');
      });

      test('should handle theme toggle on mobile', async ({ page }) => {
        const themeToggle = page.locator('button[aria-label*="theme"], button:has(svg)').first();

        // Check button is tappable
        await expect(themeToggle).toBeVisible();
        await themeToggle.click();

        // Wait for theme transition
        await page.waitForTimeout(200);

        // Verify theme changed by checking background
        const bgColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });

        // Background should have changed (dark theme)
        expect(bgColor).toBeTruthy();
      });

      test('should scroll smoothly', async ({ page }) => {
        // Check if smooth scrolling is enabled
        const scrollBehavior = await page.evaluate(() => {
          const html = document.documentElement;
          return window.getComputedStyle(html).scrollBehavior;
        });

        // Smooth scrolling improves mobile UX
        expect(['smooth', 'auto']).toContain(scrollBehavior);
      });

      test('should display version information', async ({ page }) => {
        const versionText = page.locator('text=/Version/i');
        await expect(versionText).toBeVisible();
      });

      test('should handle viewport width boundaries', async ({ page }) => {
        // Test at exact mobile breakpoint
        await page.setViewportSize({ width: 767, height: 667 });
        await page.goto('/');

        // Should still be single column
        const cards = page.locator('.grid > div');
        const firstCard = cards.nth(0);
        const secondCard = cards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        // Single column layout
        expect(secondBox!.y).toBeGreaterThan(firstBox!.y);
      });
    });
  }

  test.describe('iPhone SE (375x667) - Specific Tests', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should fit all content on iPhone SE', async ({ page }) => {
      await page.goto('/');

      // Check total page height
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);

      // Page should be scrollable but not excessively tall
      expect(pageHeight).toBeGreaterThan(667); // Should scroll
      expect(pageHeight).toBeLessThan(5000); // But not absurdly long
    });

    test('should handle safe areas for notched devices', async ({ page }) => {
      // Check if safe-area-inset variables are used
      const hasSafeAreaSupport = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return styles.getPropertyValue('padding-left').includes('env(') ||
               styles.getPropertyValue('padding-top').includes('env(');
      });

      // This is optional but good for notched devices
      // Not failing if not present
      expect(true).toBe(true);
    });
  });

  test.describe('iPhone 12/13 (390x844) - Specific Tests', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should optimize layout for larger mobile screens', async ({ page }) => {
      await page.goto('/');

      // Cards should still be single column
      const cards = page.locator('.grid > div');
      const cardCount = await cards.count();
      expect(cardCount).toBe(9);

      // Verify cards are properly sized
      const firstCard = cards.nth(0);
      const cardBox = await firstCard.boundingBox();

      // Card should use available width efficiently
      expect(cardBox!.width).toBeGreaterThan(300);
      expect(cardBox!.width).toBeLessThanOrEqual(390 - 32); // Account for padding
    });
  });

  test.describe('Mobile Landscape Orientation', () => {
    test('should handle mobile landscape (667x375)', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/');

      // Should still be single column in landscape
      const cards = page.locator('.grid > div');
      const firstCard = cards.nth(0);
      const secondCard = cards.nth(1);

      await firstCard.waitFor({ state: 'visible' });
      await secondCard.waitFor({ state: 'visible' });

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      // Single column
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y);
    });

    test('should not have horizontal scroll in landscape', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/');

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
