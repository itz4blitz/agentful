/**
 * OAuth Middleware Tests
 *
 * @module mcp/test/auth/middleware.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OAuthMiddleware } from '../../auth/middleware.js';
import { TokenManager } from '../../auth/tokens.js';

describe('OAuthMiddleware', () => {
  let middleware;
  let tokenManager;
  let mockReq;
  let mockRes;
  let nextSpy;

  beforeEach(() => {
    tokenManager = new TokenManager({
      secret: 'test-secret'
    });

    middleware = new OAuthMiddleware({
      tokenManager,
      rateLimit: {
        enabled: true,
        maxRequests: 10,
        windowMs: 60000
      }
    });

    mockReq = {
      headers: {},
      oauth: null
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn()
    };

    nextSpy = vi.fn();
  });

  afterEach(() => {
    middleware.destroy();
    tokenManager.destroy();
  });

  describe('authenticate', () => {
    it('should authenticate valid Bearer token', () => {
      const token = tokenManager.generateAccessToken('client123', ['read', 'write']);

      mockReq.headers.authorization = `Bearer ${token.access_token}`;

      const authMiddleware = middleware.authenticate();
      authMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
      expect(mockReq.oauth).toBeTruthy();
      expect(mockReq.oauth.clientId).toBe('client123');
      expect(mockReq.oauth.scope).toEqual(['read', 'write']);
    });

    it('should reject missing Authorization header', () => {
      const authMiddleware = middleware.authenticate();
      authMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'invalid_token'
        })
      );
    });

    it('should reject invalid Bearer token format', () => {
      mockReq.headers.authorization = 'InvalidFormat';

      const authMiddleware = middleware.authenticate();
      authMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject expired token', () => {
      const expiredManager = new TokenManager({
        secret: 'test-secret',
        accessTokenTTL: -1
      });

      const token = expiredManager.generateAccessToken('client123', ['read']);
      mockReq.headers.authorization = `Bearer ${token.access_token}`;

      const authMiddleware = middleware.authenticate();
      authMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);

      expiredManager.destroy();
    });

    it('should reject revoked token', () => {
      const token = tokenManager.generateAccessToken('client123', ['read']);
      tokenManager.revokeToken(token.access_token);

      mockReq.headers.authorization = `Bearer ${token.access_token}`;

      const authMiddleware = middleware.authenticate();
      authMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireScopes', () => {
    it('should allow request with required scopes', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read', 'write', 'admin']
      };

      const scopeMiddleware = middleware.requireScopes(['read', 'write']);
      scopeMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
    });

    it('should reject request without required scopes', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read']
      };

      const scopeMiddleware = middleware.requireScopes(['read', 'write']);
      scopeMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'insufficient_scope'
        })
      );
    });

    it('should reject unauthenticated request', () => {
      const scopeMiddleware = middleware.requireScopes(['read']);
      scopeMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should support single scope string', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read', 'write']
      };

      const scopeMiddleware = middleware.requireScopes('read');
      scopeMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
    });
  });

  describe('rateLimit', () => {
    it('should allow requests under limit', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read']
      };

      const rateLimitMiddleware = middleware.rateLimit();

      // Make 5 requests (under limit of 10)
      for (let i = 0; i < 5; i++) {
        nextSpy.mockClear();
        rateLimitMiddleware(mockReq, mockRes, nextSpy);
        expect(nextSpy).toHaveBeenCalled();
      }
    });

    it('should reject requests over limit', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read']
      };

      const rateLimitMiddleware = middleware.rateLimit();

      // Make requests up to limit
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(mockReq, mockRes, nextSpy);
      }

      // Next request should be rate limited
      nextSpy.mockClear();
      mockRes.status.mockClear();
      rateLimitMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'rate_limit_exceeded'
        })
      );
    });

    it('should set rate limit headers', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read']
      };

      const rateLimitMiddleware = middleware.rateLimit();
      rateLimitMiddleware(mockReq, mockRes, nextSpy);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('should track limits per client', () => {
      const rateLimitMiddleware = middleware.rateLimit();

      // Client 1 makes requests
      mockReq.oauth = { clientId: 'client1', scope: ['read'] };
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(mockReq, mockRes, nextSpy);
      }

      // Client 2 should still have full quota
      mockReq.oauth = { clientId: 'client2', scope: ['read'] };
      nextSpy.mockClear();
      rateLimitMiddleware(mockReq, mockRes, nextSpy);

      expect(nextSpy).toHaveBeenCalled();
    });

    it('should skip rate limiting when disabled', () => {
      const noLimitMiddleware = new OAuthMiddleware({
        tokenManager,
        rateLimit: {
          enabled: false
        }
      });

      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read']
      };

      const rateLimitMiddleware = noLimitMiddleware.rateLimit();

      // Make many requests - should all succeed
      for (let i = 0; i < 100; i++) {
        nextSpy.mockClear();
        rateLimitMiddleware(mockReq, mockRes, nextSpy);
        expect(nextSpy).toHaveBeenCalled();
      }

      noLimitMiddleware.destroy();
    });
  });

  describe('error responses', () => {
    it('should return proper OAuth error format', () => {
      const authMiddleware = middleware.authenticate();
      authMiddleware(mockReq, mockRes, nextSpy);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'invalid_token',
        error_description: expect.any(String)
      });
    });

    it('should include extra data when provided', () => {
      mockReq.oauth = {
        clientId: 'client123',
        scope: ['read']
      };

      const scopeMiddleware = middleware.requireScopes(['admin']);
      scopeMiddleware(mockReq, mockRes, nextSpy);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'insufficient_scope',
        error_description: expect.any(String),
        scope: 'admin'
      });
    });
  });
});
