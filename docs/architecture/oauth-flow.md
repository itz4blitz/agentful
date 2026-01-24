# OAuth 2.1 Authentication Flow for MCP

## Overview

This document details the OAuth 2.1 implementation for secure authentication and authorization in the distributed MCP architecture, using the Client Credentials Grant for server-to-server communication.

## OAuth 2.1 Architecture

### Authentication Flow

```
┌─────────────┐                    ┌─────────────┐                    ┌─────────────┐
│ MCP Client  │                    │Auth Server  │                    │ MCP Server  │
└──────┬──────┘                    └──────┬──────┘                    └──────┬──────┘
       │                                   │                                  │
       │ 1. POST /oauth/token              │                                  │
       │    client_id=xxx                  │                                  │
       │    client_secret=yyy              │                                  │
       │    grant_type=client_credentials  │                                  │
       ├──────────────────────────────────►│                                  │
       │                                   │                                  │
       │ 2. Validate credentials           │                                  │
       │                                   ├──────────┐                       │
       │                                   │          │                       │
       │                                   │◄─────────┘                       │
       │                                   │                                  │
       │ 3. Access Token (JWT)             │                                  │
       │    {                              │                                  │
       │      "access_token": "...",       │                                  │
       │      "token_type": "Bearer",      │                                  │
       │      "expires_in": 3600           │                                  │
       │    }                              │                                  │
       │◄──────────────────────────────────┤                                  │
       │                                   │                                  │
       │ 4. MCP Request                    │                                  │
       │    Authorization: Bearer <token>  │                                  │
       ├──────────────────────────────────────────────────────────────────────►│
       │                                   │                                  │
       │                                   │ 5. Validate JWT                 │
       │                                   │◄──────────────────────────────────┤
       │                                   │                                  │
       │                                   │ 6. JWT validation result        │
       │                                   ├──────────────────────────────────►│
       │                                   │                                  │
       │ 7. MCP Response                   │                                  │
       │◄──────────────────────────────────────────────────────────────────────┤
```

## Implementation Components

### 1. Auth Server

```javascript
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class OAuthServer {
  constructor(config) {
    this.app = express();
    this.config = {
      issuer: config.issuer || 'https://auth.agentful.dev',
      tokenExpiry: config.tokenExpiry || 3600,
      refreshExpiry: config.refreshExpiry || 86400,
      signingKey: config.signingKey || process.env.JWT_SIGNING_KEY,
      encryptionKey: config.encryptionKey || process.env.JWT_ENCRYPTION_KEY,
      ...config
    };

    // In-memory store (use Redis/DB in production)
    this.clients = new Map();
    this.tokens = new Map();
    this.refreshTokens = new Map();
    this.revocationList = new Set();

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });

    // Rate limiting
    this.app.use(this.rateLimiter());

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: Date.now() - start,
          ip: req.ip
        }));
      });
      next();
    });
  }

  setupRoutes() {
    // OAuth 2.1 token endpoint
    this.app.post('/oauth/token', this.handleTokenRequest.bind(this));

    // Token introspection endpoint (RFC 7662)
    this.app.post('/oauth/introspect', this.handleIntrospection.bind(this));

    // Token revocation endpoint (RFC 7009)
    this.app.post('/oauth/revoke', this.handleRevocation.bind(this));

    // JWKS endpoint for public key discovery
    this.app.get('/.well-known/jwks.json', this.handleJWKS.bind(this));

    // OAuth 2.1 metadata endpoint (RFC 8414)
    this.app.get('/.well-known/oauth-authorization-server', this.handleMetadata.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  }

  /**
   * Handle OAuth 2.1 token request
   */
  async handleTokenRequest(req, res) {
    const { grant_type, client_id, client_secret, refresh_token, scope } = req.body;

    // Validate grant type
    if (!['client_credentials', 'refresh_token'].includes(grant_type)) {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Grant type not supported'
      });
    }

    try {
      if (grant_type === 'client_credentials') {
        return await this.handleClientCredentials(req, res, {
          client_id,
          client_secret,
          scope
        });
      } else if (grant_type === 'refresh_token') {
        return await this.handleRefreshToken(req, res, {
          refresh_token,
          client_id,
          client_secret
        });
      }
    } catch (error) {
      console.error('Token request error:', error);
      return res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  /**
   * Handle Client Credentials Grant
   */
  async handleClientCredentials(req, res, params) {
    const { client_id, client_secret, scope } = params;

    // Validate client credentials
    const client = await this.validateClient(client_id, client_secret);
    if (!client) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication failed'
      });
    }

    // Validate requested scope
    const grantedScope = this.validateScope(scope, client.allowedScopes);

    // Generate tokens
    const tokenId = uuidv4();
    const accessToken = this.generateAccessToken({
      jti: tokenId,
      sub: client_id,
      client_id,
      scope: grantedScope,
      client_name: client.name,
      capabilities: client.capabilities
    });

    const refreshTokenValue = this.generateRefreshToken();

    // Store token metadata
    this.tokens.set(tokenId, {
      client_id,
      scope: grantedScope,
      issued_at: Date.now(),
      expires_at: Date.now() + (this.config.tokenExpiry * 1000)
    });

    this.refreshTokens.set(refreshTokenValue, {
      client_id,
      token_id: tokenId,
      scope: grantedScope,
      issued_at: Date.now(),
      expires_at: Date.now() + (this.config.refreshExpiry * 1000)
    });

    // Return token response
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.config.tokenExpiry,
      refresh_token: refreshTokenValue,
      scope: grantedScope
    });
  }

  /**
   * Handle Refresh Token Grant
   */
  async handleRefreshToken(req, res, params) {
    const { refresh_token, client_id, client_secret } = params;

    // Validate refresh token
    const tokenData = this.refreshTokens.get(refresh_token);
    if (!tokenData || tokenData.expires_at < Date.now()) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired refresh token'
      });
    }

    // Validate client (if provided)
    if (client_id && client_secret) {
      const client = await this.validateClient(client_id, client_secret);
      if (!client || client_id !== tokenData.client_id) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Client authentication failed'
        });
      }
    }

    // Revoke old tokens
    this.tokens.delete(tokenData.token_id);
    this.refreshTokens.delete(refresh_token);

    // Generate new tokens
    const newTokenId = uuidv4();
    const accessToken = this.generateAccessToken({
      jti: newTokenId,
      sub: tokenData.client_id,
      client_id: tokenData.client_id,
      scope: tokenData.scope
    });

    const newRefreshToken = this.generateRefreshToken();

    // Store new token metadata
    this.tokens.set(newTokenId, {
      client_id: tokenData.client_id,
      scope: tokenData.scope,
      issued_at: Date.now(),
      expires_at: Date.now() + (this.config.tokenExpiry * 1000)
    });

    this.refreshTokens.set(newRefreshToken, {
      client_id: tokenData.client_id,
      token_id: newTokenId,
      scope: tokenData.scope,
      issued_at: Date.now(),
      expires_at: Date.now() + (this.config.refreshExpiry * 1000)
    });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.config.tokenExpiry,
      refresh_token: newRefreshToken,
      scope: tokenData.scope
    });
  }

  /**
   * Handle token introspection
   */
  async handleIntrospection(req, res) {
    const { token, token_type_hint } = req.body;

    // Validate client authentication (required for introspection)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication required'
      });
    }

    try {
      // Decode and validate JWT
      const decoded = jwt.verify(token, this.config.signingKey, {
        algorithms: ['RS256', 'ES256'],
        issuer: this.config.issuer
      });

      // Check if token is revoked
      if (this.revocationList.has(decoded.jti)) {
        return res.json({ active: false });
      }

      // Check if token exists and is not expired
      const tokenData = this.tokens.get(decoded.jti);
      if (!tokenData || tokenData.expires_at < Date.now()) {
        return res.json({ active: false });
      }

      // Return token metadata
      res.json({
        active: true,
        scope: decoded.scope,
        client_id: decoded.client_id,
        username: decoded.sub,
        exp: Math.floor(tokenData.expires_at / 1000),
        iat: Math.floor(tokenData.issued_at / 1000),
        jti: decoded.jti,
        token_type: 'Bearer'
      });

    } catch (error) {
      res.json({ active: false });
    }
  }

  /**
   * Handle token revocation
   */
  async handleRevocation(req, res) {
    const { token, token_type_hint } = req.body;

    // Validate client authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client authentication required'
      });
    }

    try {
      // Handle refresh token revocation
      if (token_type_hint === 'refresh_token') {
        const tokenData = this.refreshTokens.get(token);
        if (tokenData) {
          this.refreshTokens.delete(token);
          this.tokens.delete(tokenData.token_id);
          this.revocationList.add(tokenData.token_id);
        }
      } else {
        // Handle access token revocation
        const decoded = jwt.decode(token);
        if (decoded && decoded.jti) {
          this.tokens.delete(decoded.jti);
          this.revocationList.add(decoded.jti);
        }
      }

      res.status(200).send();
    } catch (error) {
      // Always return 200 per spec
      res.status(200).send();
    }
  }

  /**
   * Handle JWKS endpoint
   */
  async handleJWKS(req, res) {
    // Return public keys for JWT verification
    const keys = [
      {
        kty: 'RSA',
        use: 'sig',
        kid: 'primary',
        alg: 'RS256',
        n: this.getPublicKeyModulus(),
        e: 'AQAB'
      }
    ];

    res.json({ keys });
  }

  /**
   * Handle OAuth metadata endpoint
   */
  async handleMetadata(req, res) {
    res.json({
      issuer: this.config.issuer,
      token_endpoint: `${this.config.issuer}/oauth/token`,
      introspection_endpoint: `${this.config.issuer}/oauth/introspect`,
      revocation_endpoint: `${this.config.issuer}/oauth/revoke`,
      jwks_uri: `${this.config.issuer}/.well-known/jwks.json`,
      response_types_supported: ['token'],
      grant_types_supported: ['client_credentials', 'refresh_token'],
      token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
      introspection_endpoint_auth_methods_supported: ['client_secret_basic'],
      revocation_endpoint_auth_methods_supported: ['client_secret_basic'],
      service_documentation: 'https://docs.agentful.dev/mcp/oauth'
    });
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(claims) {
    const payload = {
      iss: this.config.issuer,
      aud: 'mcp-server',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.tokenExpiry,
      nbf: Math.floor(Date.now() / 1000),
      ...claims
    };

    return jwt.sign(payload, this.config.signingKey, {
      algorithm: 'RS256',
      keyid: 'primary'
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken() {
    return Buffer.from(uuidv4() + ':' + Date.now()).toString('base64url');
  }

  /**
   * Validate client credentials
   */
  async validateClient(clientId, clientSecret) {
    const client = this.clients.get(clientId);
    if (!client) return null;

    const valid = await bcrypt.compare(clientSecret, client.hashedSecret);
    return valid ? client : null;
  }

  /**
   * Validate and filter requested scope
   */
  validateScope(requested, allowed) {
    if (!requested) return allowed.join(' ');

    const requestedScopes = requested.split(' ');
    const grantedScopes = requestedScopes.filter(s => allowed.includes(s));

    return grantedScopes.join(' ');
  }

  /**
   * Rate limiting middleware
   */
  rateLimiter() {
    const attempts = new Map();

    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxAttempts = 10;

      if (!attempts.has(key)) {
        attempts.set(key, []);
      }

      const userAttempts = attempts.get(key).filter(t => now - t < windowMs);

      if (userAttempts.length >= maxAttempts) {
        return res.status(429).json({
          error: 'too_many_requests',
          error_description: 'Rate limit exceeded'
        });
      }

      userAttempts.push(now);
      attempts.set(key, userAttempts);
      next();
    };
  }

  /**
   * Register a client
   */
  async registerClient(name, scopes = ['mcp:read', 'mcp:write']) {
    const clientId = `client_${uuidv4()}`;
    const clientSecret = uuidv4();
    const hashedSecret = await bcrypt.hash(clientSecret, 10);

    this.clients.set(clientId, {
      id: clientId,
      name,
      hashedSecret,
      allowedScopes: scopes,
      capabilities: {
        tools: true,
        resources: true,
        notifications: true
      },
      created: Date.now()
    });

    return { clientId, clientSecret };
  }

  /**
   * Start OAuth server
   */
  async start(port = 3001) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`OAuth server listening on port ${port}`);
        resolve();
      });
    });
  }

  /**
   * Stop OAuth server
   */
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }
}
```

### 2. MCP Server JWT Validation

```javascript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

export class JWTValidator {
  constructor(config) {
    this.config = {
      issuer: config.issuer || 'https://auth.agentful.dev',
      audience: config.audience || 'mcp-server',
      jwksUri: config.jwksUri || `${config.issuer}/.well-known/jwks.json`,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 600000, // 10 minutes
      ...config
    };

    // JWKS client for key retrieval
    this.jwksClient = jwksClient({
      jwksUri: this.config.jwksUri,
      cache: this.config.cacheEnabled,
      cacheMaxAge: this.config.cacheTTL,
      rateLimit: true,
      jwksRequestsPerMinute: 10
    });

    // Token cache
    this.validatedTokens = new Map();
    this.blacklist = new Set();
  }

  /**
   * Validate JWT token
   */
  async validate(token) {
    // Check blacklist
    if (this.isBlacklisted(token)) {
      throw new Error('Token has been revoked');
    }

    // Check cache
    const cached = this.getCachedValidation(token);
    if (cached) {
      return cached;
    }

    try {
      // Decode token header to get key ID
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded) {
        throw new Error('Invalid token format');
      }

      // Get signing key from JWKS
      const key = await this.getSigningKey(decoded.header.kid);

      // Verify token
      const payload = jwt.verify(token, key, {
        algorithms: ['RS256', 'ES256'],
        issuer: this.config.issuer,
        audience: this.config.audience,
        clockTolerance: 30 // 30 seconds clock skew tolerance
      });

      // Additional validation
      this.validateClaims(payload);

      // Cache validation result
      this.cacheValidation(token, payload);

      return payload;

    } catch (error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  /**
   * Get signing key from JWKS
   */
  async getSigningKey(kid) {
    return new Promise((resolve, reject) => {
      this.jwksClient.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          const signingKey = key.getPublicKey();
          resolve(signingKey);
        }
      });
    });
  }

  /**
   * Validate token claims
   */
  validateClaims(payload) {
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    // Check not before
    if (payload.nbf && payload.nbf > Math.floor(Date.now() / 1000)) {
      throw new Error('Token not yet valid');
    }

    // Check required claims
    if (!payload.sub) {
      throw new Error('Missing subject claim');
    }

    if (!payload.jti) {
      throw new Error('Missing token ID claim');
    }

    // Validate scope
    if (payload.scope) {
      const scopes = payload.scope.split(' ');
      if (!scopes.includes('mcp:read')) {
        throw new Error('Insufficient scope');
      }
    }
  }

  /**
   * Check if token is blacklisted
   */
  isBlacklisted(token) {
    const decoded = jwt.decode(token);
    return decoded && this.blacklist.has(decoded.jti);
  }

  /**
   * Add token to blacklist
   */
  revoke(token) {
    const decoded = jwt.decode(token);
    if (decoded && decoded.jti) {
      this.blacklist.add(decoded.jti);
      this.validatedTokens.delete(token);
    }
  }

  /**
   * Get cached validation result
   */
  getCachedValidation(token) {
    const cached = this.validatedTokens.get(token);
    if (!cached) return null;

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.validatedTokens.delete(token);
      return null;
    }

    return cached.payload;
  }

  /**
   * Cache validation result
   */
  cacheValidation(token, payload) {
    this.validatedTokens.set(token, {
      payload,
      timestamp: Date.now()
    });

    // Clean old cache entries
    this.cleanCache();
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [token, entry] of this.validatedTokens) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.validatedTokens.delete(token);
      }
    }
  }
}
```

### 3. MCP Client OAuth Integration

```javascript
export class OAuthClient {
  constructor(config) {
    this.config = {
      tokenEndpoint: config.tokenEndpoint,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scope: config.scope || 'mcp:read mcp:write',
      tokenBuffer: config.tokenBuffer || 60, // Refresh 60s before expiry
      ...config
    };

    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
  }

  /**
   * Get valid access token
   */
  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry) {
      const now = Date.now();
      const expiryWithBuffer = this.tokenExpiry - (this.tokenBuffer * 1000);

      if (now < expiryWithBuffer) {
        return this.accessToken;
      }
    }

    // Refresh or request new token
    if (this.refreshToken) {
      return await this.refreshAccessToken();
    } else {
      return await this.requestAccessToken();
    }
  }

  /**
   * Request new access token
   */
  async requestAccessToken() {
    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scope
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OAuth error: ${error.error_description || error.error}`);
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    // Setup automatic refresh
    this.setupAutoRefresh();

    return this.accessToken;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    });

    if (!response.ok) {
      // Refresh failed, get new token
      this.refreshToken = null;
      return await this.requestAccessToken();
    }

    const data = await response.json();

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token || this.refreshToken;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    // Reset auto-refresh
    this.setupAutoRefresh();

    return this.accessToken;
  }

  /**
   * Setup automatic token refresh
   */
  setupAutoRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenExpiry) return;

    // Refresh before expiry
    const refreshIn = this.tokenExpiry - Date.now() - (this.tokenBuffer * 1000);

    if (refreshIn > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshAccessToken().catch(err => {
          console.error('Auto-refresh failed:', err);
        });
      }, refreshIn);
    }
  }

  /**
   * Revoke tokens
   */
  async revoke() {
    if (!this.accessToken && !this.refreshToken) return;

    const token = this.refreshToken || this.accessToken;

    await fetch(`${this.config.tokenEndpoint.replace('/token', '/revoke')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        token,
        token_type_hint: this.refreshToken ? 'refresh_token' : 'access_token'
      })
    });

    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
```

## Security Considerations

### 1. Token Security

- **Short-lived tokens**: Access tokens expire in 1 hour
- **Refresh tokens**: Longer-lived but single-use
- **Token rotation**: New tokens on each refresh
- **JTI tracking**: Unique identifier for revocation

### 2. Transport Security

- **TLS Required**: All OAuth endpoints require HTTPS
- **Certificate validation**: Strict certificate checking
- **HSTS headers**: Force HTTPS usage

### 3. Client Security

- **Strong secrets**: 32+ character random strings
- **Secret rotation**: Rotate every 30-90 days
- **Secure storage**: Use environment variables or vaults
- **Rate limiting**: Prevent brute force attacks

### 4. Scope Management

```javascript
const SCOPES = {
  'mcp:read': 'Read MCP resources and tool definitions',
  'mcp:write': 'Execute MCP tools',
  'mcp:admin': 'Administrative operations',
  'tools:launch': 'Launch specialist agents',
  'tools:status': 'Check agent status',
  'resources:state': 'Access state information',
  'resources:product': 'Access product specifications'
};
```

## Testing OAuth Flow

```javascript
import { describe, it, expect } from '@jest/globals';

describe('OAuth Flow', () => {
  let authServer;
  let oauthClient;
  let credentials;

  beforeAll(async () => {
    // Start auth server
    authServer = new OAuthServer({
      signingKey: 'test-key',
      tokenExpiry: 60
    });
    await authServer.start(0);

    // Register client
    credentials = await authServer.registerClient('test-client');

    // Create OAuth client
    oauthClient = new OAuthClient({
      tokenEndpoint: `http://localhost:${authServer.server.address().port}/oauth/token`,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret
    });
  });

  afterAll(async () => {
    await authServer.stop();
  });

  it('should obtain access token', async () => {
    const token = await oauthClient.getAccessToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should refresh token', async () => {
    // Get initial token
    const token1 = await oauthClient.getAccessToken();

    // Force refresh
    oauthClient.tokenExpiry = Date.now();
    const token2 = await oauthClient.getAccessToken();

    expect(token2).toBeDefined();
    expect(token2).not.toBe(token1);
  });

  it('should validate JWT', async () => {
    const token = await oauthClient.getAccessToken();

    const validator = new JWTValidator({
      issuer: authServer.config.issuer,
      jwksUri: `http://localhost:${authServer.server.address().port}/.well-known/jwks.json`
    });

    const payload = await validator.validate(token);
    expect(payload.client_id).toBe(credentials.clientId);
  });

  it('should handle revocation', async () => {
    const token = await oauthClient.getAccessToken();
    await oauthClient.revoke();

    expect(oauthClient.accessToken).toBeNull();
    expect(oauthClient.refreshToken).toBeNull();
  });
});
```

## Configuration Examples

### Environment Variables

```bash
# OAuth Server
OAUTH_ISSUER=https://auth.agentful.dev
JWT_SIGNING_KEY=/path/to/private-key.pem
JWT_ENCRYPTION_KEY=your-encryption-key
TOKEN_EXPIRY=3600
REFRESH_EXPIRY=86400

# MCP Server
MCP_AUTH_ENABLED=true
MCP_AUTH_TYPE=oauth2
MCP_AUTH_ISSUER=https://auth.agentful.dev
MCP_AUTH_AUDIENCE=mcp-server

# MCP Client
MCP_CLIENT_ID=client_abc123
MCP_CLIENT_SECRET=secret_xyz789
MCP_TOKEN_ENDPOINT=https://auth.agentful.dev/oauth/token
MCP_SCOPE=mcp:read mcp:write
```

### Docker Compose

```yaml
version: '3.8'

services:
  auth-server:
    image: agentful/oauth-server:latest
    environment:
      - OAUTH_ISSUER=https://auth.agentful.dev
      - JWT_SIGNING_KEY_FILE=/run/secrets/jwt_key
      - TOKEN_EXPIRY=3600
    secrets:
      - jwt_key
    ports:
      - "3001:3001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  mcp-server:
    image: agentful/mcp-server:latest
    environment:
      - MCP_AUTH_ENABLED=true
      - MCP_AUTH_ISSUER=https://auth.agentful.dev
    depends_on:
      - auth-server

secrets:
  jwt_key:
    file: ./secrets/jwt-private-key.pem
```

## Migration Path

### Phase 1: Add OAuth Support
1. Deploy auth server
2. Update MCP server to validate JWTs
3. Test with single client

### Phase 2: Migrate Clients
1. Issue credentials to existing clients
2. Update clients to use OAuth
3. Monitor token usage

### Phase 3: Enforce Authentication
1. Disable unauthenticated access
2. Implement token revocation
3. Add audit logging

### Phase 4: Advanced Features
1. Add role-based access control
2. Implement dynamic client registration
3. Add token exchange flows

## Monitoring & Metrics

```javascript
const metrics = {
  // Token metrics
  'oauth_tokens_issued_total': new Counter(),
  'oauth_tokens_refreshed_total': new Counter(),
  'oauth_tokens_revoked_total': new Counter(),
  'oauth_token_validation_duration_seconds': new Histogram(),

  // Error metrics
  'oauth_authentication_failures_total': new Counter(),
  'oauth_invalid_tokens_total': new Counter(),
  'oauth_expired_tokens_total': new Counter(),

  // Client metrics
  'oauth_active_clients': new Gauge(),
  'oauth_client_requests_total': new Counter()
};
```

## Conclusion

This OAuth 2.1 implementation provides secure, scalable authentication for the distributed MCP architecture. It follows industry best practices and standards while remaining simple to deploy and maintain.