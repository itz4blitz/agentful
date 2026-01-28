/**
 * API Mocking Fixture
 *
 * Provides utilities for mocking API responses and intercepting requests
 * Useful for testing edge cases and error scenarios
 */

import { test as base, Page, Route, Request } from '@playwright/test';

export interface MockResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
  delay?: number;
}

export type MockHandler = (route: Route, request: Request) => Promise<void> | void;

/**
 * API fixture type
 */
export type APIFixtures = {
  mockAPI: {
    get: (url: string, response: MockResponse) => Promise<void>;
    post: (url: string, response: MockResponse) => Promise<void>;
    put: (url: string, response: MockResponse) => Promise<void>;
    delete: (url: string, response: MockResponse) => Promise<void>;
    patch: (url: string, response: MockResponse) => Promise<void>;
    custom: (matcher: string | RegExp | ((request: Request) => boolean), handler: MockHandler) => Promise<void>;
    clear: () => Promise<void>;
  };
  interceptRequests: () => Promise<Request[]>;
  waitForRequest: (url: string | RegExp) => Promise<Request>;
  waitForResponse: (url: string | RegExp) => Promise<any>;
};

/**
 * Extend test with API fixture
 */
export const test = base.extend<APIFixtures>({
  // Mock API helper
  mockAPI: async ({ page }, use) => {
    const routes: Array<{ matcher: string | RegExp; handler: MockHandler }> = [];

    const helpers = {
      /**
       * Mock GET request
       */
      get: async (url: string, response: MockResponse) => {
        await page.route(url, async (route) => {
          await applyMock(route, response);
        });
        routes.push({ matcher: url, handler: async (route) => applyMock(route, response) });
      },

      /**
       * Mock POST request
       */
      post: async (url: string, response: MockResponse) => {
        await page.route(url, async (route, request) => {
          if (request.method() === 'POST') {
            await applyMock(route, response);
          } else {
            await route.continue();
          }
        });
      },

      /**
       * Mock PUT request
       */
      put: async (url: string, response: MockResponse) => {
        await page.route(url, async (route, request) => {
          if (request.method() === 'PUT') {
            await applyMock(route, response);
          } else {
            await route.continue();
          }
        });
      },

      /**
       * Mock DELETE request
       */
      delete: async (url: string, response: MockResponse) => {
        await page.route(url, async (route, request) => {
          if (request.method() === 'DELETE') {
            await applyMock(route, response);
          } else {
            await route.continue();
          }
        });
      },

      /**
       * Mock PATCH request
       */
      patch: async (url: string, response: MockResponse) => {
        await page.route(url, async (route, request) => {
          if (request.method() === 'PATCH') {
            await applyMock(route, response);
          } else {
            await route.continue();
          }
        });
      },

      /**
       * Custom mock with matcher function
       */
      custom: async (matcher: string | RegExp | ((request: Request) => boolean), handler: MockHandler) => {
        await page.route(matcher, handler);
        routes.push({ matcher, handler });
      },

      /**
       * Clear all mocks
       */
      clear: async () => {
        routes.length = 0;
        await page.unrouteAll();
      },
    };

    await use(helpers);

    // Cleanup after test
    await page.unrouteAll();
  },

  /**
   * Intercept and collect requests
   */
  interceptRequests: async ({ page }, use) => {
    const requests: Request[] = [];

    page.on('request', (request) => {
      requests.push(request);
    });

    await use(() => requests);

    // Cleanup
    page.removeAllListeners('request');
  },

  /**
   * Wait for specific request
   */
  waitForRequest: async ({ page }, use) => {
    await use((url: string | RegExp) => page.waitForRequest(url));
  },

  /**
   * Wait for specific response
   */
  waitForResponse: async ({ page }, use) => {
    await use(async (url: string | RegExp) => {
      const response = await page.waitForResponse(url);
      return await response.json();
    });
  },
});

/**
 * Apply mock response to route
 */
async function applyMock(route: Route, response: MockResponse): Promise<void> {
  // Apply delay if specified
  if (response.delay) {
    await new Promise((resolve) => setTimeout(resolve, response.delay));
  }

  // Fulfill route with mock response
  await route.fulfill({
    status: response.status,
    contentType: 'application/json',
    body: JSON.stringify(response.body),
    headers: response.headers,
  });
}

/**
 * Common mock responses
 */
export const mockResponses = {
  success: (data: any): MockResponse => ({
    status: 200,
    body: { success: true, data },
  }),

  error: (message: string, status: number = 400): MockResponse => ({
    status,
    body: { success: false, error: message },
  }),

  unauthorized: (): MockResponse => ({
    status: 401,
    body: { success: false, error: 'Unauthorized' },
  }),

  forbidden: (): MockResponse => ({
    status: 403,
    body: { success: false, error: 'Forbidden' },
  }),

  notFound: (): MockResponse => ({
    status: 404,
    body: { success: false, error: 'Not found' },
  }),

  serverError: (message: string = 'Internal server error'): MockResponse => ({
    status: 500,
    body: { success: false, error: message },
  }),

  networkError: (): MockResponse => ({
    status: 0,
    body: {},
  }),

  slow: (data: any, delay: number = 3000): MockResponse => ({
    status: 200,
    body: { success: true, data },
    delay,
  }),

  empty: (): MockResponse => ({
    status: 200,
    body: { success: true, data: [] },
  }),
};

/**
 * Mock GraphQL API
 */
export async function mockGraphQL(
  page: Page,
  url: string,
  mocks: Record<string, (variables?: any) => any>
): Promise<void> {
  await page.route(url, async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    const operationName = postData.operationName;
    const query = postData.query;
    const variables = postData.variables;

    // Find matching mock
    for (const [key, handler] of Object.entries(mocks)) {
      if (query.includes(key) || operationName === key) {
        const data = handler(variables);
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data }),
        });
        return;
      }
    }

    // No mock found, continue with original request
    await route.continue();
  });
}

/**
 * Mock REST API with multiple endpoints
 */
export async function mockRESTAPI(
  page: Page,
  baseUrl: string,
  endpoints: Record<string, MockResponse>
): Promise<void> {
  for (const [endpoint, response] of Object.entries(endpoints)) {
    const url = `${baseUrl}${endpoint}`;
    await page.route(url, async (route) => {
      await applyMock(route, response);
    });
  }
}

/**
 * Setup common API mocks
 */
export async function setupCommonMocks(page: Page): Promise<void> {
  // Mock user API
  await page.route('**/api/user**', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      }),
    });
  });

  // Mock authentication
  await page.route('**/api/auth**', async (route, request) => {
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { token: 'mock-token-123' },
        }),
      });
    }
  });
}
