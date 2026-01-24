/**
 * OAuth 2.1 Middleware
 *
 * Express/HTTP middleware for OAuth 2.1 authentication and authorization.
 *
 * Features:
 * - Bearer token validation
 * - Scope enforcement
 * - Rate limiting per client
 * - Request authentication
 *
 * @module mcp/auth/middleware
 */

import { TokenManager } from './tokens.js';

/**
 * OAuth Middleware
 *
 * Provides request authentication and authorization
 */
export class OAuthMiddleware {
  constructor(options = {}) {
    this.tokenManager = options.tokenManager || new TokenManager();
    this.requiredScopes = options.requiredScopes || [];

    // Rate limiting
    this.rateLimit = options.rateLimit || {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    };

    // Rate limit tracking (use Redis in production)
    this.rateLimitCounters = new Map(); // clientId -> { count, resetAt }

    // Start rate limit cleanup
    this._startRateLimitCleanup();
  }

  /**
   * Authentication middleware
   *
   * Validates Bearer token and attaches client info to request
   *
   * @returns {Function} Express middleware function
   */
  authenticate() {
    return (req, res, next) => {
      try {
        // Extract Bearer token
        const token = this._extractBearerToken(req);
        if (!token) {
          return this._sendError(res, 401, 'invalid_token', 'Missing or invalid Authorization header');
        }

        // Validate token
        const payload = this.tokenManager.validateAccessToken(token);
        if (!payload) {
          return this._sendError(res, 401, 'invalid_token', 'Token is invalid or expired');
        }

        // Attach token info to request
        req.oauth = {
          clientId: payload.sub,
          scope: payload.scope.split(' '),
          tokenId: payload.jti,
          token: payload
        };

        next();
      } catch (error) {
        return this._sendError(res, 500, 'server_error', 'Internal server error');
      }
    };
  }

  /**
   * Authorization middleware
   *
   * Checks if token has required scopes
   *
   * @param {string|string[]} requiredScopes - Required scopes
   * @returns {Function} Express middleware function
   */
  requireScopes(requiredScopes) {
    const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];

    return (req, res, next) => {
      if (!req.oauth) {
        return this._sendError(res, 401, 'unauthorized', 'Authentication required');
      }

      // Check if token has all required scopes
      const hasScopes = scopes.every(scope => req.oauth.scope.includes(scope));

      if (!hasScopes) {
        return this._sendError(
          res,
          403,
          'insufficient_scope',
          `Required scopes: ${scopes.join(', ')}`,
          { scope: scopes.join(' ') }
        );
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   *
   * Limits requests per client based on configuration
   *
   * @returns {Function} Express middleware function
   */
  rateLimit() {
    if (!this.rateLimit.enabled) {
      return (req, res, next) => next();
    }

    return (req, res, next) => {
      if (!req.oauth) {
        return this._sendError(res, 401, 'unauthorized', 'Authentication required');
      }

      const clientId = req.oauth.clientId;
      const now = Date.now();

      // Get or create rate limit counter
      let counter = this.rateLimitCounters.get(clientId);
      if (!counter || counter.resetAt < now) {
        counter = {
          count: 0,
          resetAt: now + this.rateLimit.windowMs
        };
        this.rateLimitCounters.set(clientId, counter);
      }

      // Increment counter
      counter.count++;

      // Check if over limit
      if (counter.count > this.rateLimit.maxRequests) {
        const retryAfter = Math.ceil((counter.resetAt - now) / 1000);

        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Limit', this.rateLimit.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.floor(counter.resetAt / 1000));

        return this._sendError(res, 429, 'rate_limit_exceeded', 'Too many requests');
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', this.rateLimit.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.rateLimit.maxRequests - counter.count);
      res.setHeader('X-RateLimit-Reset', Math.floor(counter.resetAt / 1000));

      next();
    };
  }

  /**
   * Extract Bearer token from request
   *
   * @private
   * @param {Object} req - HTTP request
   * @returns {string|null} Token or null
   */
  _extractBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Send error response
   *
   * @private
   * @param {Object} res - HTTP response
   * @param {number} statusCode - HTTP status code
   * @param {string} error - Error code
   * @param {string} description - Error description
   * @param {Object} [extra] - Extra error data
   */
  _sendError(res, statusCode, error, description, extra = {}) {
    res.status(statusCode).json({
      error,
      error_description: description,
      ...extra
    });
  }

  /**
   * Start rate limit cleanup timer
   *
   * @private
   */
  _startRateLimitCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [clientId, counter] of this.rateLimitCounters.entries()) {
        if (counter.resetAt < now) {
          this.rateLimitCounters.delete(clientId);
        }
      }
    }, 60000); // Cleanup every minute
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

export default OAuthMiddleware;
