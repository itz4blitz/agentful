/**
 * OAuth Server Tests
 *
 * @module mcp/test/auth/oauth-server.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OAuthServer } from '../../auth/oauth-server.js';
import crypto from 'crypto';

describe('OAuthServer', () => {
  let server;
  let client;

  beforeEach(() => {
    server = new OAuthServer({
      baseUrl: 'http://localhost:3000'
    });

    // Register test client
    client = server.clientRegistry.registerClient({
      client_name: 'Test Client',
      redirect_uris: ['https://example.com/callback'],
      grant_types: ['authorization_code', 'client_credentials', 'refresh_token']
    });
  });

  afterEach(() => {
    server.destroy();
  });

  describe('Client Credentials Grant', () => {
    it('should issue token for valid client credentials', async () => {
      const response = await server.handleTokenRequest({
        grant_type: 'client_credentials',
        scope: 'read write'
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(response).toHaveProperty('access_token');
      expect(response).toHaveProperty('token_type', 'Bearer');
      expect(response).toHaveProperty('expires_in');
      expect(response).toHaveProperty('scope', 'read write');
      expect(response).not.toHaveProperty('refresh_token'); // No refresh token for client_credentials
    });

    it('should reject invalid client credentials', async () => {
      await expect(
        server.handleTokenRequest({
          grant_type: 'client_credentials'
        }, {
          username: client.client_id,
          password: 'wrong-secret'
        })
      ).rejects.toThrow('Invalid client credentials');
    });

    it('should support POST parameter authentication', async () => {
      const response = await server.handleTokenRequest({
        grant_type: 'client_credentials',
        client_id: client.client_id,
        client_secret: client.client_secret,
        scope: 'read'
      });

      expect(response.access_token).toBeTruthy();
    });
  });

  describe('Authorization Code Flow', () => {
    it('should generate authorization code', async () => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const authResponse = await server.handleAuthorizationRequest({
        client_id: client.client_id,
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        scope: 'read write',
        state: 'test-state',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      expect(authResponse).toHaveProperty('code');
      expect(authResponse).toHaveProperty('state', 'test-state');
      expect(authResponse.redirect_uri).toContain('code=');
      expect(authResponse.redirect_uri).toContain('state=test-state');
    });

    it('should reject authorization without PKCE', async () => {
      await expect(
        server.handleAuthorizationRequest({
          client_id: client.client_id,
          redirect_uri: 'https://example.com/callback',
          response_type: 'code',
          scope: 'read write'
          // No code_challenge
        })
      ).rejects.toThrow('code_challenge is required');
    });

    it('should exchange code for tokens with valid PKCE', async () => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Get authorization code
      const authResponse = await server.handleAuthorizationRequest({
        client_id: client.client_id,
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      // Exchange code for tokens
      const tokenResponse = await server.handleTokenRequest({
        grant_type: 'authorization_code',
        code: authResponse.code,
        redirect_uri: 'https://example.com/callback',
        code_verifier: codeVerifier
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(tokenResponse).toHaveProperty('access_token');
      expect(tokenResponse).toHaveProperty('refresh_token');
      expect(tokenResponse).toHaveProperty('token_type', 'Bearer');
    });

    it('should reject code exchange with invalid PKCE verifier', async () => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const authResponse = await server.handleAuthorizationRequest({
        client_id: client.client_id,
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      await expect(
        server.handleTokenRequest({
          grant_type: 'authorization_code',
          code: authResponse.code,
          redirect_uri: 'https://example.com/callback',
          code_verifier: 'wrong-verifier'
        }, {
          username: client.client_id,
          password: client.client_secret
        })
      ).rejects.toThrow('Invalid code_verifier');
    });

    it('should reject code reuse', async () => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const authResponse = await server.handleAuthorizationRequest({
        client_id: client.client_id,
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      // First use - should succeed
      await server.handleTokenRequest({
        grant_type: 'authorization_code',
        code: authResponse.code,
        redirect_uri: 'https://example.com/callback',
        code_verifier: codeVerifier
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      // Second use - should fail
      await expect(
        server.handleTokenRequest({
          grant_type: 'authorization_code',
          code: authResponse.code,
          redirect_uri: 'https://example.com/callback',
          code_verifier: codeVerifier
        }, {
          username: client.client_id,
          password: client.client_secret
        })
      ).rejects.toThrow('already used');
    });

    it('should validate redirect_uri match', async () => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const authResponse = await server.handleAuthorizationRequest({
        client_id: client.client_id,
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      await expect(
        server.handleTokenRequest({
          grant_type: 'authorization_code',
          code: authResponse.code,
          redirect_uri: 'https://different.com/callback', // Different URI
          code_verifier: codeVerifier
        }, {
          username: client.client_id,
          password: client.client_secret
        })
      ).rejects.toThrow('Redirect URI mismatch');
    });
  });

  describe('Refresh Token Grant', () => {
    it('should refresh tokens', async () => {
      // Get initial tokens via client_credentials
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      const authResponse = await server.handleAuthorizationRequest({
        client_id: client.client_id,
        redirect_uri: 'https://example.com/callback',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      const initialTokens = await server.handleTokenRequest({
        grant_type: 'authorization_code',
        code: authResponse.code,
        redirect_uri: 'https://example.com/callback',
        code_verifier: codeVerifier
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      // Refresh tokens
      const refreshedTokens = await server.handleTokenRequest({
        grant_type: 'refresh_token',
        refresh_token: initialTokens.refresh_token
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(refreshedTokens).toHaveProperty('access_token');
      expect(refreshedTokens).toHaveProperty('refresh_token');
      expect(refreshedTokens.access_token).not.toBe(initialTokens.access_token);
      expect(refreshedTokens.refresh_token).not.toBe(initialTokens.refresh_token);

      // Old refresh token should be invalid
      const oldPayload = server.tokenManager.validateRefreshToken(initialTokens.refresh_token);
      expect(oldPayload).toBeNull();
    });

    it('should reject invalid refresh token', async () => {
      await expect(
        server.handleTokenRequest({
          grant_type: 'refresh_token',
          refresh_token: 'invalid.token.here'
        }, {
          username: client.client_id,
          password: client.client_secret
        })
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('Token Revocation', () => {
    it('should revoke access token', async () => {
      const tokenResponse = await server.handleTokenRequest({
        grant_type: 'client_credentials'
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      const result = await server.handleRevocationRequest({
        token: tokenResponse.access_token
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(result.revoked).toBe(true);

      // Token should be invalid
      const payload = server.tokenManager.validateAccessToken(tokenResponse.access_token);
      expect(payload).toBeNull();
    });

    it('should always return success even for invalid tokens', async () => {
      const result = await server.handleRevocationRequest({
        token: 'invalid.token.here'
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(result).toBeDefined();
    });
  });

  describe('Token Introspection', () => {
    it('should introspect active token', async () => {
      const tokenResponse = await server.handleTokenRequest({
        grant_type: 'client_credentials',
        scope: 'read write'
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      const introspection = await server.handleIntrospectionRequest({
        token: tokenResponse.access_token
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(introspection.active).toBe(true);
      expect(introspection.client_id).toBe(client.client_id);
      expect(introspection.scope).toBe('read write');
      expect(introspection.token_type).toBe('Bearer');
    });

    it('should return inactive for invalid token', async () => {
      const introspection = await server.handleIntrospectionRequest({
        token: 'invalid.token.here'
      }, {
        username: client.client_id,
        password: client.client_secret
      });

      expect(introspection.active).toBe(false);
    });
  });

  describe('Client Registration', () => {
    it('should register new client dynamically', async () => {
      const newClient = await server.handleRegistrationRequest({
        client_name: 'Dynamic Client',
        redirect_uris: ['https://newclient.com/callback'],
        grant_types: ['authorization_code']
      });

      expect(newClient).toHaveProperty('client_id');
      expect(newClient).toHaveProperty('client_secret');
      expect(newClient.client_name).toBe('Dynamic Client');
    });
  });

  describe('Error Handling', () => {
    it('should reject missing grant_type', async () => {
      await expect(
        server.handleTokenRequest({})
      ).rejects.toThrow('grant_type is required');
    });

    it('should reject unsupported grant_type', async () => {
      await expect(
        server.handleTokenRequest({
          grant_type: 'implicit'
        }, {
          username: client.client_id,
          password: client.client_secret
        })
      ).rejects.toThrow('Grant type not supported');
    });
  });
});

// Helper functions for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}
