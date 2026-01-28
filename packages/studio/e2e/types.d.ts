/**
 * E2E Test Type Definitions
 *
 * Global type definitions for E2E testing
 * Extends Playwright types with custom fixtures and helpers
 */

import { Page, Locator, Expect, TestInfo } from '@playwright/test';
import { AppPage } from './fixtures/app.fixture';
import { Selectors } from './helpers/selectors';
import { Assertions } from './helpers/assertions';
import { ThemeHelper } from './helpers/theme-helper';
import { ScreenshotHelper } from './helpers/screenshot-helper';
import { PerformanceHelper } from './helpers/performance-helper';

/**
 * Extended test fixtures type
 * Merges all fixture types into a single type
 */
export interface TestFixtures {
  page: Page;
  app: AppPage;
  selectors: Selectors;
  assertions: Assertions;
  themeHelper: ThemeHelper;
  screenshotHelper: ScreenshotHelper;
  performanceHelper: PerformanceHelper;
}

/**
 * Test environment type
 */
export type TestEnvironment = 'development' | 'staging' | 'production' | 'test';

/**
 * Browser type
 */
export type BrowserType = 'chromium' | 'firefox' | 'webkit';

/**
 * Device type
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * Theme type
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Viewport configuration
 */
export interface ViewportConfig {
  width: number;
  height: number;
}

/**
 * Device configuration
 */
export interface DeviceConfig {
  name: string;
  viewport: ViewportConfig;
  userAgent?: string;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Test options
 */
export interface TestOptions {
  timeout?: number;
  retries?: number;
  screenshot?: 'off' | 'only-on-failure' | 'on';
  video?: 'off' | 'on' | 'retain-on-failure' | 'on-first-failure';
  trace?: 'off' | 'on' | 'retain-on-failure' | 'on-first-failure';
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  totalResources: number;
  totalTransferSize: number;
  slowestResource: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  path?: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  timeout?: number;
  animations?: 'allow' | 'disabled';
}

/**
 * Assertion options
 */
export interface AssertionOptions {
  timeout?: number;
  message?: string;
}

/**
 * Selector strategies
 */
export type SelectorStrategy =
  | 'testId'
  | 'text'
  | 'role'
  | 'label'
  | 'placeholder'
  | 'alt'
  | 'title'
  | 'css'
  | 'xpath';

/**
 * Mock response type
 */
export interface MockResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
  delay?: number;
}

/**
 * API endpoint configuration
 */
export interface APIEndpoint {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  response?: MockResponse;
}

/**
 * Test data generators
 */
export interface TestDataGenerators {
  user: <T = any>(overrides?: Partial<T>) => T;
  users: <T = any>(count: number, overrides?: Partial<T>) => T[];
  form: (schema: Record<string, string>) => Record<string, any>;
  text: (wordCount: number) => string;
  number: (min: number, max: number) => number;
  uuid: () => string;
}

/**
 * Accessibility tree node
 */
export interface AccessibilityNode {
  role: string;
  name?: string;
  description?: string;
  value?: string;
  children?: AccessibilityNode[];
}

/**
 * Console message
 */
export interface ConsoleMessage {
  type: 'log' | 'debug' | 'info' | 'warn' | 'error';
  text: string;
  args: any[];
}

/**
 * Network request
 */
export interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: number;
}

/**
 * Network response
 */
export interface NetworkResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
}

/**
 * Test result
 */
export interface TestResult {
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors: Error[];
  attachments: string[];
}

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  timeout?: number;
  retries?: number;
  testMatch?: string[];
  exclude?: string[];
}

/**
 * Page object interface
 */
export interface PageObject {
  goto: (path?: string) => Promise<void>;
  waitForStable: () => Promise<void>;
  isReady: () => Promise<boolean>;
}

/**
 * Component object interface
 */
export interface ComponentObject {
  selector: string;
  locator: Locator;
  isVisible: () => Promise<boolean>;
  click: () => Promise<void>;
  getText: () => Promise<string>;
}

/**
 * Custom matchers for assertions
 */
declare global {
  namespace PlaywrightTest {
    interface Matchers<R = void> {
      toBeAccessible(): R;
      toHaveValidContrast(): R;
      toHaveValidARIA(): R;
    }
  }
}

/**
 * Global test context
 */
export interface TestContext {
  page: Page;
  testInfo: TestInfo;
  fixtures: TestFixtures;
}

/**
 * BDD step definition
 */
export interface BDDStep {
  (pattern: RegExp, fn: (...args: any[]) => Promise<void>): void;
}

/**
 * BDD scenario
 */
export interface BDDScenario {
  title: string;
  steps: Array<{ keyword: string; text: string }>;
}

/**
 * BDD feature
 */
export interface BDDFeature {
  name: string;
  scenarios: BDDScenario[];
}

/**
 * Visual regression options
 */
export interface VisualRegressionOptions {
  threshold?: number;
  maxDiffPixels?: number;
  maxDiffRatio?: number;
  allowSizeMismatch?: boolean;
}

/**
 * Screenshot comparison result
 */
export interface ScreenshotComparison {
  pass: boolean;
  diff?: Buffer;
  diffPixels?: number;
  diffRatio?: number;
}

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  maxDomContentLoaded?: number;
  maxLoadComplete?: number;
  maxFirstContentfulPaint?: number;
  maxLargestContentfulPaint?: number;
  maxCumulativeLayoutShift?: number;
  maxTotalBlockingTime?: number;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  name: TestEnvironment;
  baseURL: string;
  apiURL: string;
  timeout: number;
  retries: number;
  screenshotOnFailure: boolean;
  videoOnFailure: boolean;
  traceOnFailure: boolean;
}

/**
 * Mock server configuration
 */
export interface MockServerConfig {
  port: number;
  routes: Record<string, MockResponse>;
  latency?: number;
  failureRate?: number;
}

/**
 * Test data fixture
 */
export interface TestDataFixture {
  users: {
    one: <T>(overrides?: Partial<T>) => T;
    many: <T>(count: number, overrides?: Partial<T>) => T[];
    admin: () => any;
    regular: () => any;
  };
  forms: {
    login: () => Record<string, string>;
    register: () => Record<string, string>;
    contact: () => Record<string, string>;
  };
  content: {
    blogPost: () => any;
    comment: () => any;
    product: () => any;
  };
}

/**
 * Device fixture
 */
export interface DeviceFixture {
  device: DeviceConfig;
  emulateDevice: (device: DeviceType | DeviceConfig) => Promise<void>;
}

/**
 * API fixture
 */
export interface APIFixture {
  mockAPI: {
    get: (url: string, response: MockResponse) => Promise<void>;
    post: (url: string, response: MockResponse) => Promise<void>;
    put: (url: string, response: MockResponse) => Promise<void>;
    delete: (url: string, response: MockResponse) => Promise<void>;
    clear: () => Promise<void>;
  };
  interceptRequests: () => Promise<any[]>;
  waitForRequest: (url: string | RegExp) => Promise<any>;
  waitForResponse: (url: string | RegExp) => Promise<any>;
}
