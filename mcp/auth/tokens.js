/**
 * OAuth 2.1 Token Manager
 *
 * Handles JWT token generation, validation, and lifecycle management.
 * Implements secure token practices per OAuth 2.1 specification.
 *
 * Features:
 * - JWT signing/verification
 * - Access token generation
 * - Refresh token management
 * - Token revocation
 * - Expiration handling
 *
 * @module mcp/auth/tokens
 */

import crypto from 'crypto';

/**
 * Token Manager
 *
 * Manages OAuth 2.1 tokens with JWT format
 */
export class TokenManager {
  constructor(options = {}) {
    // Secret for signing tokens (should be loaded from env in production)
    this.secret = options.secret || process.env.OAUTH_TOKEN_SECRET || this._generateSecret();

    // Token expiration times (configurable)
    this.accessTokenTTL = options.accessTokenTTL || 3600; // 1 hour
    this.refreshTokenTTL = options.refreshTokenTTL || 604800; // 7 days

    // In-memory token storage (use Redis in production)
    this.accessTokens = new Map(); // token -> { clientId, scope, exp }
    this.refreshTokens = new Map(); // token -> { clientId, scope, exp, accessTokenId }
    this.revokedTokens = new Set(); // Set of revoked token IDs

    // Cleanup expired tokens periodically
    this._startCleanupTimer();
  }

  /**
   * Generate access token
   *
   * @param {string} clientId - Client identifier
   * @param {string[]} scope - Token scopes
   * @param {Object} [extra] - Additional claims
   * @returns {Object} Token object with access_token, token_type, expires_in
   */
  generateAccessToken(clientId, scope = [], extra = {}) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.accessTokenTTL;
    const jti = this._generateTokenId();

    // Build JWT payload
    const payload = {
      jti,
      iss: 'agentful-mcp-oauth',
      sub: clientId,
      iat: now,
      exp,
      scope: Array.isArray(scope) ? scope.join(' ') : scope,
      ...extra
    };

    // Sign token
    const token = this._signJWT(payload);

    // Store token metadata
    this.accessTokens.set(jti, {
      clientId,
      scope,
      exp,
      token
    });

    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: this.accessTokenTTL,
      scope: payload.scope
    };
  }

  /**
   * Generate refresh token
   *
   * @param {string} clientId - Client identifier
   * @param {string[]} scope - Token scopes
   * @param {string} accessTokenId - Associated access token ID
   * @returns {string} Refresh token
   */
  generateRefreshToken(clientId, scope = [], accessTokenId) {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.refreshTokenTTL;
    const jti = this._generateTokenId();

    // Build JWT payload
    const payload = {
      jti,
      iss: 'agentful-mcp-oauth',
      sub: clientId,
      iat: now,
      exp,
      scope: Array.isArray(scope) ? scope.join(' ') : scope,
      type: 'refresh',
      ati: accessTokenId // Access token ID reference
    };

    // Sign token
    const token = this._signJWT(payload);

    // Store token metadata
    this.refreshTokens.set(jti, {
      clientId,
      scope,
      exp,
      accessTokenId,
      token
    });

    return token;
  }

  /**
   * Validate access token
   *
   * @param {string} token - Access token
   * @returns {Object|null} Token payload if valid, null otherwise
   */
  validateAccessToken(token) {
    try {
      // Verify JWT signature and decode
      const payload = this._verifyJWT(token);

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      // Check if revoked
      if (this.revokedTokens.has(payload.jti)) {
        return null;
      }

      // Check if token exists in store
      const storedToken = this.accessTokens.get(payload.jti);
      if (!storedToken) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate refresh token
   *
   * @param {string} token - Refresh token
   * @returns {Object|null} Token payload if valid, null otherwise
   */
  validateRefreshToken(token) {
    try {
      // Verify JWT signature and decode
      const payload = this._verifyJWT(token);

      // Check token type
      if (payload.type !== 'refresh') {
        return null;
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return null;
      }

      // Check if revoked
      if (this.revokedTokens.has(payload.jti)) {
        return null;
      }

      // Check if token exists in store
      const storedToken = this.refreshTokens.get(payload.jti);
      if (!storedToken) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Revoke token
   *
   * @param {string} token - Token to revoke
   * @returns {boolean} True if token was revoked, false otherwise
   */
  revokeToken(token) {
    try {
      const payload = this._verifyJWT(token);

      // Add to revoked set
      this.revokedTokens.add(payload.jti);

      // Remove from active tokens
      this.accessTokens.delete(payload.jti);
      this.refreshTokens.delete(payload.jti);

      // If revoking refresh token, also revoke associated access token
      if (payload.type === 'refresh' && payload.ati) {
        this.revokedTokens.add(payload.ati);
        this.accessTokens.delete(payload.ati);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rotate refresh token
   *
   * Used when refreshing access token - generates new refresh token
   * and revokes the old one (per OAuth 2.1 security best practices)
   *
   * @param {string} oldRefreshToken - Old refresh token
   * @returns {Object|null} New tokens or null if invalid
   */
  rotateRefreshToken(oldRefreshToken) {
    // Validate old refresh token
    const payload = this.validateRefreshToken(oldRefreshToken);
    if (!payload) {
      return null;
    }

    // Revoke old refresh token
    this.revokeToken(oldRefreshToken);

    // Generate new tokens
    const scope = payload.scope.split(' ');
    const accessTokenData = this.generateAccessToken(payload.sub, scope);
    const refreshToken = this.generateRefreshToken(
      payload.sub,
      scope,
      this._extractTokenId(accessTokenData.access_token)
    );

    return {
      ...accessTokenData,
      refresh_token: refreshToken
    };
  }

  /**
   * Sign JWT
   *
   * @private
   * @param {Object} payload - JWT payload
   * @returns {string} Signed JWT
   */
  _signJWT(payload) {
    // Header
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    // Encode
    const encodedHeader = this._base64urlEncode(JSON.stringify(header));
    const encodedPayload = this._base64urlEncode(JSON.stringify(payload));

    // Sign
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify JWT
   *
   * @private
   * @param {string} token - JWT token
   * @returns {Object} Decoded payload
   * @throws {Error} If token is invalid
   */
  _verifyJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid JWT signature');
    }

    // Decode payload
    const payload = JSON.parse(this._base64urlDecode(encodedPayload));

    return payload;
  }

  /**
   * Extract token ID from JWT
   *
   * @private
   * @param {string} token - JWT token
   * @returns {string|null} Token ID (jti)
   */
  _extractTokenId(token) {
    try {
      const parts = token.split('.');
      const payload = JSON.parse(this._base64urlDecode(parts[1]));
      return payload.jti;
    } catch {
      return null;
    }
  }

  /**
   * Generate token ID
   *
   * @private
   * @returns {string} Unique token ID
   */
  _generateTokenId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate secret key
   *
   * @private
   * @returns {string} Secret key
   */
  _generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Base64url encode
   *
   * @private
   * @param {string} str - String to encode
   * @returns {string} Encoded string
   */
  _base64urlEncode(str) {
    return Buffer.from(str)
      .toString('base64url');
  }

  /**
   * Base64url decode
   *
   * @private
   * @param {string} str - String to decode
   * @returns {string} Decoded string
   */
  _base64urlDecode(str) {
    return Buffer.from(str, 'base64url').toString('utf8');
  }

  /**
   * Start cleanup timer for expired tokens
   *
   * @private
   */
  _startCleanupTimer() {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredTokens();
    }, 300000);
  }

  /**
   * Cleanup expired tokens
   *
   * @private
   */
  _cleanupExpiredTokens() {
    const now = Math.floor(Date.now() / 1000);

    // Clean access tokens
    for (const [jti, data] of this.accessTokens.entries()) {
      if (data.exp < now) {
        this.accessTokens.delete(jti);
      }
    }

    // Clean refresh tokens
    for (const [jti, data] of this.refreshTokens.entries()) {
      if (data.exp < now) {
        this.refreshTokens.delete(jti);
      }
    }
  }

  /**
   * Stop cleanup timer
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export default TokenManager;
