/**
 * Test Data Fixture
 *
 * Provides ready-to-use test data for common scenarios
 * Reduces duplication across test files
 */

import { test as base } from '@playwright/test';
import {
  generateTestUser,
  generateTestUsers,
  generateFormData,
  generateText,
  generateNumber,
  generateUUID,
  componentTestData,
  type UserTestData,
} from '../helpers/test-data-generator';

/**
 * Test data fixture type
 */
export type DataFixtures = {
  testData: TestDataHelpers;
};

/**
 * Test Data Helpers
 * Provides organized access to generated test data
 */
export class TestDataHelpers {
  /**
   * User data generators
   */
  readonly users = {
    /**
     * Generate a single test user
     */
    one: (overrides?: Partial<UserTestData>): UserTestData => {
      return generateTestUser(overrides);
    },

    /**
     * Generate multiple test users
     */
    many: (count: number, overrides?: Partial<UserTestData>): UserTestData[] => {
      return generateTestUsers(count, overrides);
    },

    /**
     * Get admin user
     */
    admin: (): UserTestData => {
      return generateTestUser({
        role: 'admin',
        email: 'admin@example.com',
        username: 'admin',
      });
    },

    /**
     * Get regular user
     */
    regular: (): UserTestData => {
      return generateTestUser({
        role: 'user',
        email: 'user@example.com',
        username: 'user',
      });
    },

    /**
     * Get moderator user
     */
    moderator: (): UserTestData => {
      return generateTestUser({
        role: 'moderator',
        email: 'moderator@example.com',
        username: 'moderator',
      });
    },
  };

  /**
   * Form data generators
   */
  readonly forms = {
    /**
     * Login form data
     */
    login: (): Record<string, string> => {
      return {
        email: 'test@example.com',
        password: 'TestPassword123!',
      };
    },

    /**
     * Registration form data
     */
    register: (): Record<string, string> => {
      return generateFormData({
        email: 'email',
        password: 'password',
      });
    },

    /**
     * Contact form data
     */
    contact: (): Record<string, string> => {
      return {
        name: 'John Doe',
        email: 'john.doe@example.com',
        subject: 'Test Inquiry',
        message: generateText(20),
      };
    },

    /**
     * Search form data
     */
    search: (query: string = 'test search'): Record<string, string> => {
      return {
        query,
        category: 'all',
        sortBy: 'relevance',
      };
    },

    /**
     * Custom form data
     */
    custom: (schema: Record<string, 'email' | 'name' | 'password' | 'text' | 'number' | 'url' | 'phone'>) => {
      return generateFormData(schema);
    },
  };

  /**
   * Content generators
   */
  readonly content = {
    /**
     * Generate blog post
     */
    blogPost: () => ({
      title: generateText(8),
      content: generateText(100),
      excerpt: generateText(20),
      author: generateTestUser().fullName,
      tags: ['test', 'automation', 'playwright'],
    }),

    /**
     * Generate comment
     */
    comment: () => ({
      text: generateText(30),
      author: generateTestUser().fullName,
      createdAt: new Date().toISOString(),
    }),

    /**
     * Generate product
     */
    product: () => ({
      id: generateUUID(),
      name: `Product ${generateNumber(1, 1000)}`,
      description: generateText(40),
      price: generateNumber(10, 500),
      inStock: true,
    }),

    /**
     * Generate article
     */
    article: () => ({
      title: generateText(10),
      body: generateText(200),
      summary: generateText(30),
    }),
  };

  /**
   * Component test data
   */
  readonly components = componentTestData;

  /**
   * Utility generators
   */
  readonly utils = {
    /**
     * Generate random text
     */
    text: (wordCount: number) => generateText(wordCount),

    /**
     * Generate random number
     */
    number: (min: number, max: number) => generateNumber(min, max),

    /**
     * Generate UUID
     */
    uuid: () => generateUUID(),

    /**
     * Generate email
     */
    email: () => `test-${generateNumber(1000, 9999)}@example.com`,

    /**
     * Generate URL
     */
    url: () => `https://example.com/${generateNumber(1000, 9999)}`,

    /**
     * Generate phone number
     */
    phone: () => `+1-${generateNumber(100, 999)}-${generateNumber(100, 999)}-${generateNumber(1000, 9999)}`,
  };

  /**
   * Scenario data sets
   */
  readonly scenarios = {
    /**
     * E-commerce scenario data
     */
    ecommerce: {
      products: Array.from({ length: 10 }, () => componentTestData.product()),
      cart: {
        items: [
          componentTestData.product(),
          componentTestData.product(),
        ],
        subtotal: 99.99,
        tax: 8.99,
        total: 108.98,
      },
      checkout: {
        shipping: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'USA',
        },
        payment: {
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
        },
      },
    },

    /**
     * Social media scenario data
     */
    social: {
      posts: Array.from({ length: 5 }, () => ({
        id: generateUUID(),
        author: generateTestUser(),
        content: generateText(50),
        likes: generateNumber(0, 100),
        comments: Array.from({ length: generateNumber(0, 10) }, () => componentTestData.comment()),
        createdAt: new Date().toISOString(),
      })),
      profile: {
        user: generateTestUser(),
        bio: generateText(30),
        followers: generateNumber(100, 10000),
        following: generateNumber(50, 500),
        posts: generateNumber(10, 100),
      },
    },

    /**
     * Dashboard scenario data
     */
    dashboard: {
      stats: {
        totalUsers: generateNumber(1000, 10000),
        activeUsers: generateNumber(500, 5000),
        revenue: generateNumber(10000, 100000),
        growth: generateNumber(-10, 50),
      },
      chartData: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
        value: generateNumber(1000, 5000),
      })),
      recentActivity: Array.from({ length: 10 }, () => ({
        id: generateUUID(),
        user: generateTestUser(),
        action: ['login', 'logout', 'purchase', 'update'][generateNumber(0, 3)],
        timestamp: new Date().toISOString(),
      })),
    },
  };
}

/**
 * Extend test with data fixture
 */
export const test = base.extend<DataFixtures>({
  // Create test data helpers
  testData: async ({}, use) => {
    const helpers = new TestDataHelpers();
    await use(helpers);
  },
});
