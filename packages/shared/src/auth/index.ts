/**
 * Agentful Cloud Authentication Client
 * Shared authentication utilities for all agentful tools
 * (VSCode extension, Visual Builder, Chrome Extension)
 */

export interface CloudAuthConfig {
  cloudApiUrl: string;
  clerkPublishableKey: string;
}

export interface AuthTokens {
  token: string;
  userId: string;
  email: string;
}

export interface CloudUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  picture_url?: string;
  created_at: string;
}

/**
 * Authentication client for agentful-cloud backend
 */
export class CloudAuthClient {
  private config: CloudAuthConfig;
  private cachedToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(config: CloudAuthConfig) {
    this.config = config;
  }

  /**
   * Verify auth token with cloud backend
   */
  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string; email?: string }> {
    try {
      const response = await fetch(`${this.config.cloudApiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();
      return {
        valid: true,
        userId: data.userId,
        email: data.email,
      };
    } catch (error) {
      console.error('Token verification failed:', error);
      return { valid: false };
    }
  }

  /**
   * Get current user from cloud backend
   */
  async getCurrentUser(token: string): Promise<CloudUser | null> {
    try {
      const response = await fetch(`${this.config.cloudApiUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Cache token locally (for web/React apps)
   */
  setCachedToken(token: string, expiresIn: number = 3600): void {
    this.cachedToken = token;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }

  /**
   * Get cached token if not expired
   */
  getCachedToken(): string | null {
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }
    return null;
  }

  /**
   * Clear cached token
   */
  clearCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Make authenticated API call to cloud backend
   */
  async authenticatedFetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getCachedToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.config.cloudApiUrl}${endpoint}`;

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

/**
 * VSCode extension specific auth utilities
 */
export class VSCodeAuthClient extends CloudAuthClient {
  private context: globalThis.ExtensionContext;

  constructor(config: CloudAuthConfig, context: globalThis.ExtensionContext) {
    super(config);
    this.context = context;
  }

  /**
   * Store token in VSCode secrets storage
   */
  async storeToken(token: string): Promise<void> {
    await this.context.secrets.store('agentful.authToken', token);
    this.setCachedToken(token);
  }

  /**
   * Get token from VSCode secrets storage
   */
  async getToken(): Promise<string | null> {
    // Try cache first
    const cached = this.getCachedToken();
    if (cached) return cached;

    // Try secrets storage
    const token = await this.context.secrets.get('agentful.authToken');
    if (token) {
      this.setCachedToken(token);
      return token;
    }

    return null;
  }

  /**
   * Clear token from VSCode secrets storage
   */
  async clearToken(): Promise<void> {
    await this.context.secrets.delete('agentful.authToken');
    this.clearCache();
  }
}

/**
 * Browser/React specific auth utilities
 */
export class BrowserAuthClient extends CloudAuthClient {
  private readonly STORAGE_KEY = 'agentful.authToken';

  constructor(config: CloudAuthConfig) {
    super(config);
    this.loadFromStorage();
  }

  /**
   * Store token in localStorage
   */
  storeToken(token: string, expiresIn: number = 3600): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, token);
      this.setCachedToken(token, expiresIn);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    const cached = this.getCachedToken();
    if (cached) return cached;

    try {
      const token = localStorage.getItem(this.STORAGE_KEY);
      if (token) {
        this.setCachedToken(token);
        return token;
      }
    } catch (error) {
      console.error('Failed to get token:', error);
    }

    return null;
  }

  /**
   * Clear token from localStorage
   */
  clearToken(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.clearCache();
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  /**
   * Load token from storage on init
   */
  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem(this.STORAGE_KEY);
      if (token) {
        this.cachedToken = token;
      }
    } catch (error) {
      // Storage might not be available
    }
  }
}

/**
 * React hook for cloud authentication
 */
export function useCloudAuth(config: CloudAuthConfig) {
  const client = new BrowserAuthClient(config);

  return {
    getToken: () => client.getToken(),
    storeToken: (token: string, expiresIn?: number) => client.storeToken(token, expiresIn),
    clearToken: () => client.clearToken(),
    verifyToken: (token: string) => client.verifyToken(token),
    getCurrentUser: (token: string) => client.getCurrentUser(token),
    authenticatedFetch: (endpoint: string, options?: RequestInit) =>
      client.authenticatedFetch(endpoint, options),
  };
}
