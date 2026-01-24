# OAuth 2.1 Authentication for MCP Server

Complete OAuth 2.1 implementation for secure remote access to distributed MCP workers.

## Features

- **OAuth 2.1 Compliant** - Follows latest OAuth 2.1 specification
- **Multiple Grant Types** - Client Credentials, Authorization Code, Refresh Token
- **PKCE Required** - Mandatory PKCE for Authorization Code flow
- **JWT Tokens** - Self-contained access tokens with HS256 signing
- **Dynamic Client Registration** - RFC7591 compliant
- **Token Introspection** - RFC7662 compliant
- **Token Revocation** - RFC7009 compliant
- **Authorization Server Metadata** - RFC8414 compliant
- **Rate Limiting** - Per-client rate limiting
- **Scope Enforcement** - Fine-grained authorization

## Architecture

```
mcp/auth/
├── oauth-server.js      - Core OAuth 2.1 server
├── tokens.js            - JWT token manager
├── client-registry.js   - Dynamic client registration
├── metadata.js          - Authorization server metadata
├── middleware.js        - Express middleware
├── http-server.js       - HTTP server wrapper
└── index.js             - Public API
```

## Quick Start

### 1. Start OAuth Server

```javascript
import { startOAuthHTTPServer } from './mcp/auth/http-server.js';

const { app, server, port } = await startOAuthHTTPServer({
  port: 3000
});

console.log(`OAuth server running on http://localhost:${port}`);
```

### 2. Register Client

```bash
curl -X POST http://localhost:3000/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "My MCP Client",
    "redirect_uris": ["https://example.com/callback"],
    "grant_types": ["authorization_code", "client_credentials", "refresh_token"]
  }'
```

Response:
```json
{
  "client_id": "client_abc123...",
  "client_secret": "secret_xyz789...",
  "client_id_issued_at": 1234567890,
  "client_secret_expires_at": 0
}
```

### 3. Get Access Token (Client Credentials)

```bash
curl -X POST http://localhost:3000/oauth/token \
  -u 'client_abc123:secret_xyz789' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=client_credentials&scope=mcp:execute mcp:read'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "mcp:execute mcp:read"
}
```

### 4. Use Access Token

```bash
curl http://localhost:3000/mcp/protected \
  -H 'Authorization: Bearer eyJhbGc...'
```

## Grant Types

### Client Credentials Grant (VPS-to-VPS)

**Use case**: Server-to-server authentication

```javascript
// 1. Register client
const client = await oauthServer.handleRegistrationRequest({
  redirect_uris: ['https://worker.example.com/callback'],
  grant_types: ['client_credentials']
});

// 2. Request token
const token = await oauthServer.handleTokenRequest({
  grant_type: 'client_credentials',
  scope: 'mcp:execute'
}, {
  username: client.client_id,
  password: client.client_secret
});

// 3. Use token
// Authorization: Bearer {token.access_token}
```

### Authorization Code Flow (Human Orchestrator)

**Use case**: User authorization with PKCE

```javascript
import crypto from 'crypto';

// 1. Generate PKCE code verifier and challenge
const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// 2. Request authorization code
const authResponse = await oauthServer.handleAuthorizationRequest({
  client_id: client.client_id,
  redirect_uri: 'https://example.com/callback',
  response_type: 'code',
  scope: 'mcp:execute mcp:read',
  state: 'random-state',
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
});

// 3. User is redirected to: {redirect_uri}?code=xyz&state=random-state

// 4. Exchange code for tokens
const token = await oauthServer.handleTokenRequest({
  grant_type: 'authorization_code',
  code: 'xyz',
  redirect_uri: 'https://example.com/callback',
  code_verifier: codeVerifier
}, {
  username: client.client_id,
  password: client.client_secret
});
```

### Refresh Token Grant

**Use case**: Get new access token without re-authentication

```javascript
const newToken = await oauthServer.handleTokenRequest({
  grant_type: 'refresh_token',
  refresh_token: token.refresh_token
}, {
  username: client.client_id,
  password: client.client_secret
});

// Old refresh token is automatically revoked (token rotation)
```

## Scopes

Available scopes for MCP server:

- `mcp:execute` - Execute tools and commands
- `mcp:read` - Read resources and state
- `mcp:write` - Modify resources and state
- `mcp:admin` - Administrative access

## Security Best Practices

### 1. HTTPS Enforcement

Always use HTTPS in production:

```javascript
const app = createOAuthHTTPServer({
  baseUrl: 'https://oauth.example.com'
});
```

### 2. Environment Variables

Store secrets in environment variables:

```bash
export OAUTH_TOKEN_SECRET=your-256-bit-secret
export OAUTH_CLIENT_ID=client_id
export OAUTH_CLIENT_SECRET=client_secret
```

```javascript
const tokenManager = new TokenManager({
  secret: process.env.OAUTH_TOKEN_SECRET
});
```

### 3. Token Expiration

Configure appropriate token lifetimes:

```javascript
const tokenManager = new TokenManager({
  accessTokenTTL: 3600,     // 1 hour
  refreshTokenTTL: 604800   // 7 days
});
```

### 4. Rate Limiting

Protect against abuse:

```javascript
const middleware = new OAuthMiddleware({
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000  // 1 minute
  }
});
```

### 5. Scope Minimization

Request only required scopes:

```javascript
// Bad: Request all scopes
scope: 'mcp:execute mcp:read mcp:write mcp:admin'

// Good: Request minimum scopes
scope: 'mcp:read'
```

## API Reference

### OAuthServer

```javascript
import { OAuthServer } from './mcp/auth/oauth-server.js';

const server = new OAuthServer({
  baseUrl: 'http://localhost:3000',
  requirePKCE: true,
  token: {
    secret: 'your-secret',
    accessTokenTTL: 3600,
    refreshTokenTTL: 604800
  }
});

// Handle token request
const token = await server.handleTokenRequest(params, auth);

// Handle authorization request
const authResponse = await server.handleAuthorizationRequest(params);

// Handle client registration
const client = await server.handleRegistrationRequest(metadata);

// Handle token revocation
await server.handleRevocationRequest(params, auth);

// Handle token introspection
const introspection = await server.handleIntrospectionRequest(params, auth);
```

### TokenManager

```javascript
import { TokenManager } from './mcp/auth/tokens.js';

const manager = new TokenManager({
  secret: 'your-secret',
  accessTokenTTL: 3600,
  refreshTokenTTL: 604800
});

// Generate access token
const token = manager.generateAccessToken('client_id', ['read', 'write']);

// Generate refresh token
const refreshToken = manager.generateRefreshToken('client_id', ['read'], 'access_token_id');

// Validate token
const payload = manager.validateAccessToken(token.access_token);

// Revoke token
manager.revokeToken(token.access_token);

// Rotate refresh token
const newTokens = manager.rotateRefreshToken(refreshToken);
```

### ClientRegistry

```javascript
import { ClientRegistry } from './mcp/auth/client-registry.js';

const registry = new ClientRegistry();

// Register client
const client = registry.registerClient({
  client_name: 'My Client',
  redirect_uris: ['https://example.com/callback'],
  grant_types: ['authorization_code'],
  scope: ['read', 'write']
});

// Get client
const client = registry.getClient(clientId);

// Verify credentials
const valid = registry.verifyCredentials(clientId, clientSecret);

// Update client
registry.updateClient(clientId, { client_name: 'New Name' });

// Delete client
registry.deleteClient(clientId);
```

### OAuthMiddleware

```javascript
import { OAuthMiddleware } from './mcp/auth/middleware.js';
import express from 'express';

const app = express();
const middleware = new OAuthMiddleware({ tokenManager });

// Authenticate all requests
app.use(middleware.authenticate());

// Require specific scopes
app.get('/admin',
  middleware.requireScopes(['mcp:admin']),
  (req, res) => { /* ... */ }
);

// Apply rate limiting
app.use(middleware.rateLimit());
```

## Testing

Run tests:

```bash
cd mcp
npm test -- auth
```

Run specific test:

```bash
npm test -- auth/oauth-server.test.js
```

## Production Deployment

### 1. Use Redis for Token Storage

```javascript
import Redis from 'ioredis';

class RedisTokenManager extends TokenManager {
  constructor(options) {
    super(options);
    this.redis = new Redis(options.redis);
  }

  async validateAccessToken(token) {
    const jti = this._extractTokenId(token);
    const exists = await this.redis.exists(`token:${jti}`);
    if (!exists) return null;

    return super.validateAccessToken(token);
  }
}
```

### 2. Use Database for Client Storage

```javascript
class DatabaseClientRegistry extends ClientRegistry {
  async registerClient(metadata) {
    const client = super.registerClient(metadata);
    await db.clients.insert(client);
    return client;
  }

  async getClient(clientId) {
    return await db.clients.findOne({ client_id: clientId });
  }
}
```

### 3. Enable HTTPS

```javascript
import https from 'https';
import fs from 'fs';

const httpsServer = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

httpsServer.listen(443);
```

## Troubleshooting

### "Invalid PKCE code_verifier"

Ensure code verifier is URL-safe base64:

```javascript
const verifier = crypto.randomBytes(32).toString('base64url');
```

### "Redirect URI mismatch"

Ensure redirect_uri in token request matches authorization request exactly.

### "Token expired"

Check system clock synchronization between servers.

### "Rate limit exceeded"

Implement exponential backoff in client:

```javascript
async function requestWithBackoff(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.headers['retry-after'] || Math.pow(2, i);
        await sleep(retryAfter * 1000);
      } else {
        throw error;
      }
    }
  }
}
```

## License

MIT
