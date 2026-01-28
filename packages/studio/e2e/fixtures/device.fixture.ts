/**
 * Device Fixture
 *
 * Provides device emulation for testing responsive design
 * Supports desktop, tablet, and mobile devices
 */

import { test as base, Page, devices } from '@playwright/test';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
  userAgent?: string;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Common device configurations
 */
export const deviceConfigs: Record<DeviceType, DeviceConfig> = {
  desktop: {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  tablet: {
    name: 'iPad',
    viewport: { width: 768, height: 1024 },
    userAgent: devices['iPad Mini'].userAgent,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  mobile: {
    name: 'iPhone',
    viewport: { width: 375, height: 667 },
    userAgent: devices['iPhone 12'].userAgent,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

/**
 * Additional device presets
 */
export const devicePresets: Record<string, DeviceConfig> = {
  'Desktop Large': {
    name: 'Desktop Large',
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  'Desktop Small': {
    name: 'Desktop Small',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  'Tablet Landscape': {
    name: 'Tablet Landscape',
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  'Mobile Large': {
    name: 'Mobile Large',
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  'Mobile Small': {
    name: 'Mobile Small',
    viewport: { width: 320, height: 568 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

/**
 * Device fixture type
 */
export type DeviceFixtures = {
  device: DeviceConfig;
  emulateDevice: (device: DeviceType | DeviceConfig) => Promise<void>;
};

/**
 * Extend test with device fixture
 */
export const test = base.extend<DeviceFixtures>({
  // Current device config
  device: async ({ page }, use) => {
    const config = deviceConfigs.desktop; // Default to desktop

    // Set device
    await setupDevice(page, config);

    await use(config);
  },

  // Emulate device method
  emulateDevice: async ({ page }, use) => {
    const emulate = async (device: DeviceType | DeviceConfig) => {
      const config = typeof device === 'string' ? deviceConfigs[device] : device;
      await setupDevice(page, config);
    };

    await use(emulate);
  },
});

/**
 * Setup device emulation
 */
async function setupDevice(page: Page, config: DeviceConfig): Promise<void> {
  // Set viewport
  await page.setViewportSize(config.viewport);

  // Set user agent
  if (config.userAgent) {
    await page.setExtraHTTPHeaders({
      'User-Agent': config.userAgent,
    });
  }

  // Emulate media features
  await page.emulateMedia({
    viewport: config.viewport,
    userAgent: config.userAgent,
    deviceScaleFactor: config.deviceScaleFactor,
    hasTouch: config.hasTouch,
  });

  // Wait for layout to settle
  await page.waitForTimeout(100);
}

/**
 * Test across all breakpoints
 */
export function testAcrossBreakpoints(
  testFn: (page: Page, device: DeviceConfig) => Promise<void>
): Array<{ name: string; fn: (arg: any) => Promise<void> }> {
  return Object.values(deviceConfigs).map((config) => ({
    name: config.name,
    fn: async ({ page }: any) => {
      await setupDevice(page, config);
      await testFn(page, config);
    },
  }));
}

/**
 * Test across specific devices
 */
export function testAcrossDevices(
  deviceNames: string[],
  testFn: (page: Page, device: DeviceConfig) => Promise<void>
): Array<{ name: string; fn: (arg: any) => Promise<void> }> {
  return deviceNames.map((name) => {
    const config = devicePresets[name] || deviceConfigs.desktop;
    return {
      name,
      fn: async ({ page }: any) => {
        await setupDevice(page, config);
        await testFn(page, config);
      },
    };
  });
}

/**
 * Check if current viewport is mobile
 */
export async function isMobileViewport(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return (viewport?.width || 0) < 768;
}

/**
 * Check if current viewport is tablet
 */
export async function isTabletViewport(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  const width = viewport?.width || 0;
  return width >= 768 && width < 1024;
}

/**
 * Check if current viewport is desktop
 */
export async function isDesktopViewport(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return (viewport?.width || 0) >= 1024;
}

/**
 * Get current breakpoint
 */
export async function getCurrentBreakpoint(page: Page): Promise<'mobile' | 'tablet' | 'desktop'> {
  if (await isMobileViewport(page)) return 'mobile';
  if (await isTabletViewport(page)) return 'tablet';
  return 'desktop';
}
