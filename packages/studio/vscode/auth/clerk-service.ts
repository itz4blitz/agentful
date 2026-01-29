import * as vscode from 'vscode';

export interface ClerkAuthConfig {
  publishableKey: string;
  clerkApiUrl?: string;
}

export interface ClerkToken {
  token: string;
  userId: string;
  expiresAt: number;
}

export class ClerkAuthService {
  private static readonly TOKEN_KEY = 'agentful.clerk.token';
  private static readonly USER_ID_KEY = 'agentful.clerk.userId';

  constructor(
    private context: vscode.ExtensionContext,
    private config: ClerkAuthConfig
  ) {}

  /**
   * Get the current auth token if available
   */
  async getToken(): Promise<ClerkToken | null> {
    const token = this.context.globalState.get<string>(ClerkAuthService.TOKEN_KEY);
    const userId = this.context.globalState.get<string>(ClerkAuthService.USER_ID_KEY);
    const expiresAt = this.context.globalState.get<number>(`${ClerkAuthService.TOKEN_KEY}.expires`);

    if (!token || !userId || !expiresAt) {
      return null;
    }

    // Check if token is expired
    if (Date.now() > expiresAt) {
      await this.clearToken();
      return null;
    }

    return { token, userId, expiresAt };
  }

  /**
   * Save the auth token after successful authentication
   */
  async saveToken(token: string, userId: string, expiresIn: number = 3600): Promise<void> {
    const expiresAt = Date.now() + expiresIn * 1000;
    await this.context.globalState.update(ClerkAuthService.TOKEN_KEY, token);
    await this.context.globalState.update(ClerkAuthService.USER_ID_KEY, userId);
    await this.context.globalState.update(`${ClerkAuthService.TOKEN_KEY}.expires`, expiresAt);
  }

  /**
   * Clear the stored auth token (logout)
   */
  async clearToken(): Promise<void> {
    await this.context.globalState.update(ClerkAuthService.TOKEN_KEY, undefined);
    await this.context.globalState.update(ClerkAuthService.USER_ID_KEY, undefined);
    await this.context.globalState.update(`${ClerkAuthService.TOKEN_KEY}.expires`, undefined);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  /**
   * Get the publishable key for Clerk
   */
  getPublishableKey(): string {
    return this.config.publishableKey;
  }

  /**
   * Get the Clerk API URL (for custom domains)
   */
  getClerkApiUrl(): string | undefined {
    return this.config.clerkApiUrl;
  }
}
