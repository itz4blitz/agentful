/**
 * Token Manager Tests
 *
 * @module mcp/test/auth/tokens.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenManager } from '../../auth/tokens.js';

describe('TokenManager', () => {
  let tokenManager;

  beforeEach(() => {
    tokenManager = new TokenManager({
      secret: 'test-secret-key-for-testing-only',
      accessTokenTTL: 3600,
      refreshTokenTTL: 7200
    });
  });

  afterEach(() => {
    tokenManager.destroy();
  });

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const result = tokenManager.generateAccessToken('client123', ['read', 'write']);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('token_type', 'Bearer');
      expect(result).toHaveProperty('expires_in', 3600);
      expect(result).toHaveProperty('scope', 'read write');
      expect(result.access_token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/); // JWT format
    });

    it('should generate unique tokens', () => {
      const token1 = tokenManager.generateAccessToken('client123', ['read']);
      const token2 = tokenManager.generateAccessToken('client123', ['read']);

      expect(token1.access_token).not.toBe(token2.access_token);
    });

    it('should include custom claims', () => {
      const result = tokenManager.generateAccessToken('client123', ['read'], { custom: 'value' });
      const payload = tokenManager.validateAccessToken(result.access_token);

      expect(payload.custom).toBe('value');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const accessToken = tokenManager.generateAccessToken('client123', ['read']);
      const accessTokenId = tokenManager._extractTokenId(accessToken.access_token);
      const refreshToken = tokenManager.generateRefreshToken('client123', ['read'], accessTokenId);

      expect(refreshToken).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it('should store refresh token metadata', () => {
      const accessToken = tokenManager.generateAccessToken('client123', ['read']);
      const accessTokenId = tokenManager._extractTokenId(accessToken.access_token);
      const refreshToken = tokenManager.generateRefreshToken('client123', ['read'], accessTokenId);

      const payload = tokenManager.validateRefreshToken(refreshToken);
      expect(payload).toBeTruthy();
      expect(payload.type).toBe('refresh');
      expect(payload.ati).toBe(accessTokenId);
    });
  });

  describe('validateAccessToken', () => {
    it('should validate valid access token', () => {
      const token = tokenManager.generateAccessToken('client123', ['read', 'write']);
      const payload = tokenManager.validateAccessToken(token.access_token);

      expect(payload).toBeTruthy();
      expect(payload.sub).toBe('client123');
      expect(payload.scope).toBe('read write');
    });

    it('should reject invalid token', () => {
      const payload = tokenManager.validateAccessToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should reject expired token', () => {
      const manager = new TokenManager({
        secret: 'test-secret',
        accessTokenTTL: -1 // Already expired
      });

      const token = manager.generateAccessToken('client123', ['read']);
      const payload = manager.validateAccessToken(token.access_token);

      expect(payload).toBeNull();
      manager.destroy();
    });

    it('should reject revoked token', () => {
      const token = tokenManager.generateAccessToken('client123', ['read']);
      tokenManager.revokeToken(token.access_token);

      const payload = tokenManager.validateAccessToken(token.access_token);
      expect(payload).toBeNull();
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate valid refresh token', () => {
      const accessToken = tokenManager.generateAccessToken('client123', ['read']);
      const accessTokenId = tokenManager._extractTokenId(accessToken.access_token);
      const refreshToken = tokenManager.generateRefreshToken('client123', ['read'], accessTokenId);

      const payload = tokenManager.validateRefreshToken(refreshToken);
      expect(payload).toBeTruthy();
      expect(payload.type).toBe('refresh');
      expect(payload.sub).toBe('client123');
    });

    it('should reject access token as refresh token', () => {
      const token = tokenManager.generateAccessToken('client123', ['read']);
      const payload = tokenManager.validateRefreshToken(token.access_token);

      expect(payload).toBeNull();
    });
  });

  describe('revokeToken', () => {
    it('should revoke access token', () => {
      const token = tokenManager.generateAccessToken('client123', ['read']);
      const revoked = tokenManager.revokeToken(token.access_token);

      expect(revoked).toBe(true);

      const payload = tokenManager.validateAccessToken(token.access_token);
      expect(payload).toBeNull();
    });

    it('should revoke refresh token and associated access token', () => {
      const accessToken = tokenManager.generateAccessToken('client123', ['read']);
      const accessTokenId = tokenManager._extractTokenId(accessToken.access_token);
      const refreshToken = tokenManager.generateRefreshToken('client123', ['read'], accessTokenId);

      tokenManager.revokeToken(refreshToken);

      expect(tokenManager.validateRefreshToken(refreshToken)).toBeNull();
      expect(tokenManager.validateAccessToken(accessToken.access_token)).toBeNull();
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate refresh token successfully', () => {
      const accessToken = tokenManager.generateAccessToken('client123', ['read']);
      const accessTokenId = tokenManager._extractTokenId(accessToken.access_token);
      const oldRefreshToken = tokenManager.generateRefreshToken('client123', ['read'], accessTokenId);

      const newTokens = tokenManager.rotateRefreshToken(oldRefreshToken);

      expect(newTokens).toBeTruthy();
      expect(newTokens.access_token).toBeTruthy();
      expect(newTokens.refresh_token).toBeTruthy();
      expect(newTokens.refresh_token).not.toBe(oldRefreshToken);

      // Old token should be invalid
      expect(tokenManager.validateRefreshToken(oldRefreshToken)).toBeNull();

      // New tokens should be valid
      expect(tokenManager.validateAccessToken(newTokens.access_token)).toBeTruthy();
      expect(tokenManager.validateRefreshToken(newTokens.refresh_token)).toBeTruthy();
    });

    it('should reject invalid refresh token rotation', () => {
      const newTokens = tokenManager.rotateRefreshToken('invalid.token.here');
      expect(newTokens).toBeNull();
    });
  });

  describe('JWT operations', () => {
    it('should sign and verify JWT correctly', () => {
      const payload = { test: 'data', exp: Math.floor(Date.now() / 1000) + 3600 };
      const jwt = tokenManager._signJWT(payload);
      const verified = tokenManager._verifyJWT(jwt);

      expect(verified.test).toBe('data');
    });

    it('should reject tampered JWT', () => {
      const payload = { test: 'data', exp: Math.floor(Date.now() / 1000) + 3600 };
      const jwt = tokenManager._signJWT(payload);

      // Tamper with the payload
      const parts = jwt.split('.');
      const tamperedJWT = `${parts[0]}.${parts[1]}tampered.${parts[2]}`;

      expect(() => tokenManager._verifyJWT(tamperedJWT)).toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup expired tokens', async () => {
      const manager = new TokenManager({
        secret: 'test-secret',
        accessTokenTTL: 1 // 1 second
      });

      const token = manager.generateAccessToken('client123', ['read']);
      const tokenId = manager._extractTokenId(token.access_token);

      expect(manager.accessTokens.has(tokenId)).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Run cleanup
      manager._cleanupExpiredTokens();

      expect(manager.accessTokens.has(tokenId)).toBe(false);

      manager.destroy();
    });
  });
});
