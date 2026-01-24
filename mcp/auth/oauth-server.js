/**
 * OAuth 2.1 Server
 *
 * Complete OAuth 2.1 authorization server implementation.
 * Supports Client Credentials Grant, Authorization Code Flow with PKCE.
 *
 * Features:
 * - Client Credentials Grant (VPS-to-VPS auth)
 * - Authorization Code Flow (human orchestrator)
 * - PKCE support (mandatory per OAuth 2.1)
 * - Token issuance (JWT)
 * - Token validation
 * - Token rotation/expiration
 * - Dynamic client registration
 *
 * @module mcp/auth/oauth-server
 */

import crypto from 'crypto';
import { TokenManager } from './tokens.js';
import { ClientRegistry } from './client-registry.js';
import { AuthorizationServerMetadata } from './metadata.js';

/**
 * OAuth 2.1 Server
 *
 * Complete authorization server implementation
 */
export class OAuthServer {
  constructor(options = {}) {
    // Initialize components
    this.tokenManager = options.tokenManager || new TokenManager(options.token);
    this.clientRegistry = options.clientRegistry || new ClientRegistry(options.client);
    this.metadata = options.metadata || new AuthorizationServerMetadata(options.metadata);

    // Configuration
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.requirePKCE = options.requirePKCE !== false; // PKCE mandatory in OAuth 2.1

    // Authorization code storage (use Redis in production)
    this.authorizationCodes = new Map(); // code -> { clientId, redirectUri, scope, codeChallenge, exp }

    // PKCE code verifier storage
    this.codeVerifiers = new Map(); // code -> codeVerifier

    // Start cleanup timer
    this._startCleanupTimer();
  }

  /**
   * Handle token request
   *
   * Supports:
   * - authorization_code grant
   * - client_credentials grant
   * - refresh_token grant
   *
   * @param {Object} params - Token request parameters
   * @param {Object} [auth] - Client authentication (Basic auth)
   * @returns {Object} Token response
   */
  async handleTokenRequest(params, auth = {}) {
    const grantType = params.grant_type;

    if (!grantType) {
      throw this._createError('invalid_request', 'grant_type is required');
    }

    // Authenticate client
    const client = await this._authenticateClient(params, auth);

    // Route to appropriate grant handler
    switch (grantType) {
      case 'authorization_code':
        return this._handleAuthorizationCodeGrant(params, client);

      case 'client_credentials':
        return this._handleClientCredentialsGrant(params, client);

      case 'refresh_token':
        return this._handleRefreshTokenGrant(params, client);

      default:
        throw this._createError('unsupported_grant_type', `Grant type not supported: ${grantType}`);
    }
  }

  /**
   * Handle authorization request (Authorization Code Flow)
   *
   * @param {Object} params - Authorization request parameters
   * @returns {Object} Authorization response with redirect URI
   */
  async handleAuthorizationRequest(params) {
    // Validate required parameters
    if (!params.client_id) {
      throw this._createError('invalid_request', 'client_id is required');
    }
    if (!params.redirect_uri) {
      throw this._createError('invalid_request', 'redirect_uri is required');
    }
    if (!params.response_type) {
      throw this._createError('invalid_request', 'response_type is required');
    }
    if (params.response_type !== 'code') {
      throw this._createError('unsupported_response_type', 'Only "code" response type is supported');
    }

    // PKCE validation (mandatory in OAuth 2.1)
    if (this.requirePKCE && !params.code_challenge) {
      throw this._createError('invalid_request', 'code_challenge is required (PKCE)');
    }
    if (params.code_challenge && !params.code_challenge_method) {
      throw this._createError('invalid_request', 'code_challenge_method is required when using PKCE');
    }
    if (params.code_challenge_method && params.code_challenge_method !== 'S256') {
      throw this._createError('invalid_request', 'Only S256 code_challenge_method is supported');
    }

    // Get client
    const client = this.clientRegistry.getClient(params.client_id);
    if (!client) {
      throw this._createError('invalid_client', 'Client not found');
    }

    // Validate redirect URI
    if (!client.redirect_uris.includes(params.redirect_uri)) {
      throw this._createError('invalid_request', 'Invalid redirect_uri');
    }

    // Generate authorization code
    const code = this._generateAuthorizationCode();
    const scope = params.scope ? params.scope.split(' ') : [];

    // Store authorization code
    this.authorizationCodes.set(code, {
      clientId: params.client_id,
      redirectUri: params.redirect_uri,
      scope,
      codeChallenge: params.code_challenge,
      codeChallengeMethod: params.code_challenge_method,
      exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      used: false
    });

    // Build redirect URI with code
    const redirectUrl = new URL(params.redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (params.state) {
      redirectUrl.searchParams.set('state', params.state);
    }

    return {
      redirect_uri: redirectUrl.toString(),
      code,
      state: params.state
    };
  }

  /**
   * Handle client registration request
   *
   * @param {Object} metadata - Client metadata
   * @returns {Object} Client registration response
   */
  async handleRegistrationRequest(metadata) {
    return this.clientRegistry.registerClient(metadata);
  }

  /**
   * Handle token revocation request
   *
   * @param {Object} params - Revocation request parameters
   * @param {Object} [auth] - Client authentication
   * @returns {Object} Revocation response
   */
  async handleRevocationRequest(params, auth = {}) {
    // Authenticate client
    const client = await this._authenticateClient(params, auth);

    if (!params.token) {
      throw this._createError('invalid_request', 'token is required');
    }

    // Revoke token
    const revoked = this.tokenManager.revokeToken(params.token);

    // Per RFC7009, always return 200 even if token doesn't exist
    return {
      revoked
    };
  }

  /**
   * Handle token introspection request
   *
   * @param {Object} params - Introspection request parameters
   * @param {Object} [auth] - Client authentication
   * @returns {Object} Introspection response
   */
  async handleIntrospectionRequest(params, auth = {}) {
    // Authenticate client
    const client = await this._authenticateClient(params, auth);

    if (!params.token) {
      throw this._createError('invalid_request', 'token is required');
    }

    // Validate token
    const payload = this.tokenManager.validateAccessToken(params.token);

    if (!payload) {
      return { active: false };
    }

    return {
      active: true,
      scope: payload.scope,
      client_id: payload.sub,
      token_type: 'Bearer',
      exp: payload.exp,
      iat: payload.iat,
      sub: payload.sub,
      iss: payload.iss,
      jti: payload.jti
    };
  }

  /**
   * Handle Authorization Code grant
   *
   * @private
   * @param {Object} params - Token request parameters
   * @param {Object} client - Client data
   * @returns {Object} Token response
   */
  _handleAuthorizationCodeGrant(params, client) {
    if (!params.code) {
      throw this._createError('invalid_request', 'code is required');
    }
    if (!params.redirect_uri) {
      throw this._createError('invalid_request', 'redirect_uri is required');
    }

    // Get authorization code
    const authCode = this.authorizationCodes.get(params.code);
    if (!authCode) {
      throw this._createError('invalid_grant', 'Authorization code not found or expired');
    }

    // Check if already used
    if (authCode.used) {
      // Code reuse detected - revoke all tokens issued to this code
      this.authorizationCodes.delete(params.code);
      throw this._createError('invalid_grant', 'Authorization code already used');
    }

    // Validate client
    if (authCode.clientId !== client.client_id) {
      throw this._createError('invalid_grant', 'Client mismatch');
    }

    // Validate redirect URI
    if (authCode.redirectUri !== params.redirect_uri) {
      throw this._createError('invalid_grant', 'Redirect URI mismatch');
    }

    // Validate expiration
    const now = Math.floor(Date.now() / 1000);
    if (authCode.exp < now) {
      this.authorizationCodes.delete(params.code);
      throw this._createError('invalid_grant', 'Authorization code expired');
    }

    // PKCE validation
    if (authCode.codeChallenge) {
      if (!params.code_verifier) {
        throw this._createError('invalid_request', 'code_verifier is required');
      }

      const challenge = this._generateCodeChallenge(params.code_verifier);
      if (challenge !== authCode.codeChallenge) {
        throw this._createError('invalid_grant', 'Invalid code_verifier');
      }
    }

    // Mark code as used (keep it in storage to detect reuse)
    authCode.used = true;

    // Generate tokens
    const accessTokenData = this.tokenManager.generateAccessToken(
      client.client_id,
      authCode.scope
    );

    const refreshToken = this.tokenManager.generateRefreshToken(
      client.client_id,
      authCode.scope,
      this.tokenManager._extractTokenId(accessTokenData.access_token)
    );

    // Note: Authorization code is kept in storage to detect reuse attempts
    // It will be cleaned up by the periodic cleanup timer

    return {
      ...accessTokenData,
      refresh_token: refreshToken
    };
  }

  /**
   * Handle Client Credentials grant
   *
   * @private
   * @param {Object} params - Token request parameters
   * @param {Object} client - Client data
   * @returns {Object} Token response
   */
  _handleClientCredentialsGrant(params, client) {
    // Parse scope
    const scope = params.scope ? params.scope.split(' ') : client.scope;

    // Generate access token (no refresh token for client_credentials)
    const tokenData = this.tokenManager.generateAccessToken(client.client_id, scope);

    return tokenData;
  }

  /**
   * Handle Refresh Token grant
   *
   * @private
   * @param {Object} params - Token request parameters
   * @param {Object} client - Client data
   * @returns {Object} Token response
   */
  _handleRefreshTokenGrant(params, client) {
    if (!params.refresh_token) {
      throw this._createError('invalid_request', 'refresh_token is required');
    }

    // Validate refresh token
    const payload = this.tokenManager.validateRefreshToken(params.refresh_token);
    if (!payload) {
      throw this._createError('invalid_grant', 'Invalid or expired refresh token');
    }

    // Validate client
    if (payload.sub !== client.client_id) {
      throw this._createError('invalid_grant', 'Client mismatch');
    }

    // Rotate refresh token (OAuth 2.1 best practice)
    const tokens = this.tokenManager.rotateRefreshToken(params.refresh_token);
    if (!tokens) {
      throw this._createError('invalid_grant', 'Failed to rotate refresh token');
    }

    return tokens;
  }

  /**
   * Authenticate client
   *
   * @private
   * @param {Object} params - Request parameters
   * @param {Object} auth - Authentication data
   * @returns {Object} Client data
   */
  async _authenticateClient(params, auth) {
    let clientId, clientSecret;

    // Try Basic authentication first
    if (auth.username && auth.password) {
      clientId = auth.username;
      clientSecret = auth.password;
    }
    // Try POST parameters
    else if (params.client_id && params.client_secret) {
      clientId = params.client_id;
      clientSecret = params.client_secret;
    }
    // Public client (no secret)
    else if (params.client_id) {
      clientId = params.client_id;
    } else {
      throw this._createError('invalid_client', 'Client authentication failed');
    }

    // Get client
    const client = this.clientRegistry.getClient(clientId);
    if (!client) {
      throw this._createError('invalid_client', 'Client not found');
    }

    // Verify credentials if secret provided
    if (clientSecret) {
      const valid = this.clientRegistry.verifyCredentials(clientId, clientSecret);
      if (!valid) {
        throw this._createError('invalid_client', 'Invalid client credentials');
      }
    }

    return client;
  }

  /**
   * Generate authorization code
   *
   * @private
   * @returns {string} Authorization code
   */
  _generateAuthorizationCode() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate PKCE code challenge
   *
   * @private
   * @param {string} verifier - Code verifier
   * @returns {string} Code challenge
   */
  _generateCodeChallenge(verifier) {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Create OAuth error
   *
   * @private
   * @param {string} error - Error code
   * @param {string} description - Error description
   * @returns {Error} Error object
   */
  _createError(error, description) {
    const err = new Error(description);
    err.error = error;
    err.error_description = description;
    return err;
  }

  /**
   * Start cleanup timer
   *
   * @private
   */
  _startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredCodes();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup expired authorization codes
   *
   * @private
   */
  _cleanupExpiredCodes() {
    const now = Math.floor(Date.now() / 1000);
    for (const [code, data] of this.authorizationCodes.entries()) {
      if (data.exp < now || data.used) {
        this.authorizationCodes.delete(code);
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
    this.tokenManager.destroy();
  }
}

export default OAuthServer;
