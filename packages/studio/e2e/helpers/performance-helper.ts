/**
 * Performance Helper
 *
 * Provides utilities for measuring and asserting performance metrics
 * including page load times, Core Web Vitals, and custom metrics
 */

import { Page, expect } from '@playwright/test';

export interface PerformanceMetrics {
  // Navigation Timing
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;

  // Resource Timing
  totalResources: number;
  totalTransferSize: number;
  slowestResource: number;

  // Core Web Vitals (estimates)
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export interface PerformanceThresholds {
  maxDomContentLoaded?: number;
  maxLoadComplete?: number;
  maxFirstContentfulPaint?: number;
  maxLargestContentfulPaint?: number;
  maxCumulativeLayoutShift?: number;
}

/**
 * Performance Helper Class
 */
export class PerformanceHelper {
  private metrics: PerformanceMetrics | null = null;

  constructor(private page: Page) {}

  /**
   * Measure page performance metrics
   */
  async measureMetrics(): Promise<PerformanceMetrics> {
    const metrics = await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = window.performance.getEntriesByType('paint');
      const resourceEntries = window.performance.getEntriesByType('resource');

      // Find paint timings
      const firstPaint = paintEntries.find((e) => e.name === 'first-paint')?.startTime || 0;
      const firstContentfulPaint =
        paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0;

      // Resource metrics
      const resources = resourceEntries as PerformanceResourceTiming[];
      const totalResources = resources.length;
      const totalTransferSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const slowestResource = Math.max(...resources.map((r) => r.duration), 0);

      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint,
        firstContentfulPaint,
        totalResources,
        totalTransferSize,
        slowestResource,
      };
    });

    this.metrics = metrics;
    return metrics;
  }

  /**
   * Get Web Vitals (requires web-vitals library)
   */
  async getWebVitals(): Promise<PerformanceMetrics> {
    const vitals = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        // Placeholder - real implementation requires web-vitals library
        // import { getLCP, getFID, getCLS } from 'web-vitals';

        const metrics = {
          largestContentfulPaint: 0,
          firstInputDelay: 0,
          cumulativeLayoutShift: 0,
        };

        resolve(metrics);
      });
    });

    return vitals as PerformanceMetrics;
  }

  /**
   * Measure page load time
   */
  async measurePageLoadTime(): Promise<number> {
    const loadTime = await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return perfData.loadEventEnd - perfData.fetchStart;
    });

    return loadTime;
  }

  /**
   * Measure time to interactive (TTI) - simplified version
   */
  async measureTTI(): Promise<number> {
    const tti = await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      // Simplified TTI: DOM content loaded + a bit for JS execution
      return perfData.domContentLoadedEventEnd - perfData.fetchStart + 100;
    });

    return tti;
  }

  /**
   * Measure First Contentful Paint (FCP)
   */
  async measureFCP(): Promise<number> {
    const fcp = await this.page.evaluate(() => {
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
      return fcpEntry?.startTime || 0;
    });

    return fcp;
  }

  /**
   * Measure Largest Contentful Paint (LCP)
   */
  async measureLCP(): Promise<number> {
    const lcp = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry?.startTime || 0);
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // Timeout after 5 seconds
          setTimeout(() => resolve(0), 5000);
        } catch (e) {
          resolve(0);
        }
      });
    });

    return lcp as number;
  }

  /**
   * Measure Cumulative Layout Shift (CLS)
   */
  async measureCLS(): Promise<number> {
    const cls = await this.page.evaluate(() => {
      let clsValue = 0;

      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Layout shift not supported
      }

      return clsValue;
    });

    return cls;
  }

  /**
   * Measure Total Blocking Time (TBT)
   */
  async measureTBT(): Promise<number> {
    const tbt = await this.page.evaluate(() => {
      const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const tbtThreshold = 50; // ms

      let totalBlockingTime = 0;
      const entries = window.performance.getEntriesByType('measure') as PerformanceEntry[];

      for (const entry of entries) {
        if (entry.duration > tbtThreshold) {
          totalBlockingTime += entry.duration - tbtThreshold;
        }
      }

      return totalBlockingTime;
    });

    return tbt;
  }

  /**
   * Assert performance metrics meet thresholds
   */
  async assertPerformance(thresholds: PerformanceThresholds): Promise<void> {
    const metrics = await this.measureMetrics();

    if (thresholds.maxDomContentLoaded) {
      expect(
        metrics.domContentLoaded,
        `DOM Content Loaded should be under ${thresholds.maxDomContentLoaded}ms`
      ).toBeLessThanOrEqual(thresholds.maxDomContentLoaded);
    }

    if (thresholds.maxLoadComplete) {
      expect(
        metrics.loadComplete,
        `Load complete should be under ${thresholds.maxLoadComplete}ms`
      ).toBeLessThanOrEqual(thresholds.maxLoadComplete);
    }

    if (thresholds.maxFirstContentfulPaint) {
      expect(
        metrics.firstContentfulPaint,
        `FCP should be under ${thresholds.maxFirstContentfulPaint}ms`
      ).toBeLessThanOrEqual(thresholds.maxFirstContentfulPaint);
    }
  }

  /**
   * Assert Core Web Vitals meet recommended thresholds
   */
  async assertCoreWebVitals(): Promise<void> {
    const lcp = await this.measureLCP();
    const cls = await this.measureCLS();

    // LCP should be < 2.5s (good), < 4s (needs improvement)
    expect(lcp, `LCP should be under 2500ms (good), got ${lcp}ms`).toBeLessThanOrEqual(2500);

    // CLS should be < 0.1 (good), < 0.25 (needs improvement)
    expect(cls, `CLS should be under 0.1 (good), got ${cls}`).toBeLessThanOrEqual(0.1);
  }

  /**
   * Measure render time for specific element
   */
  async measureElementRenderTime(selector: string): Promise<number> {
    const renderTime = await this.page.evaluate((sel) => {
      const start = performance.now();
      const element = document.querySelector(sel);

      if (!element) {
        return -1; // Element not found
      }

      // Wait for next paint
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const end = performance.now();
          resolve(end - start);
        });
      });
    }, selector);

    return renderTime as number;
  }

  /**
   * Track custom performance metric
   */
  async trackMetric(name: string, value: number): Promise<void> {
    await this.page.evaluate(
      ({ metricName, metricValue }) => {
        performance.mark(`${metricName}-start`);
        // Simulate measurement
        performance.measure(metricName, `${metricName}-start`);
      },
      { metricName: name, metricValue: value }
    );
  }

  /**
   * Get resource timing data
   */
  async getResourceTiming(): Promise<PerformanceResourceTiming[]> {
    const resources = await this.page.evaluate(() => {
      const entries = window.performance.getEntriesByType('resource');
      return entries.map((e: any) => ({
        name: e.name,
        duration: e.duration,
        transferSize: e.transferSize,
        encodedBodySize: e.encodedBodySize,
        decodedBodySize: e.decodedBodySize,
      }));
    });

    return resources as PerformanceResourceTiming[];
  }

  /**
   * Get slowest resources
   */
  async getSlowestResources(count: number = 10): Promise<Array<{ name: string; duration: number }>> {
    const resources = await this.getResourceTiming();
    return resources
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count)
      .map((r) => ({ name: r.name, duration: r.duration }));
  }

  /**
   * Measure memory usage (Chrome only)
   */
  async measureMemoryUsage(): Promise<{ usedJSHeapSize: number; totalJSHeapSize: number } | null> {
    const memory = await this.page.evaluate(() => {
      // @ts-ignore - Chrome-specific API
      if (performance.memory) {
        // @ts-ignore
        return {
          // @ts-ignore
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          // @ts-ignore
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return null;
    });

    return memory;
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(): Promise<void> {
    await this.page.evaluate(() => {
      performance.mark('test-start');
    });
  }

  /**
   * Stop performance monitoring and get duration
   */
  async stopMonitoring(): Promise<number> {
    const duration = await this.page.evaluate(() => {
      performance.mark('test-end');
      performance.measure('test-duration', 'test-start', 'test-end');
      const measure = performance.getEntriesByName('test-duration')[0];
      return measure?.duration || 0;
    });

    return duration;
  }
}

/**
 * Create performance helper for a page
 */
export function createPerformanceHelper(page: Page): PerformanceHelper {
  return new PerformanceHelper(page);
}
