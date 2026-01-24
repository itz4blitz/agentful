#!/usr/bin/env node

/**
 * OAuth 2.1 Example Usage
 *
 * Demonstrates the OAuth 2.1 flows for MCP server authentication.
 *
 * @module mcp/auth/example
 */

import { OAuthServer } from './oauth-server.js';
import { startOAuthHTTPServer } from './http-server.js';
import crypto from 'crypto';

/**
 * Example 1: Client Credentials Grant (VPS-to-VPS)
 */
async function clientCredentialsExample() {
  console.log('\n=== Client Credentials Grant (VPS-to-VPS) ===\n');

  const server = new OAuthServer();

  // 1. Register client
  console.log('1. Registering client...');
  const client = await server.handleRegistrationRequest({
    client_name: 'Remote Worker VPS',
    redirect_uris: ['https://worker.example.com/callback'],
    grant_types: ['client_credentials']
  });
  console.log(`   Client ID: ${client.client_id}`);
  console.log(`   Client Secret: ${client.client_secret.substring(0, 20)}...`);

  // 2. Request access token
  console.log('\n2. Requesting access token...');
  const token = await server.handleTokenRequest({
    grant_type: 'client_credentials',
    scope: 'mcp:execute mcp:read'
  }, {
    username: client.client_id,
    password: client.client_secret
  });
  console.log(`   Access Token: ${token.access_token.substring(0, 50)}...`);
  console.log(`   Token Type: ${token.token_type}`);
  console.log(`   Expires In: ${token.expires_in}s`);
  console.log(`   Scope: ${token.scope}`);

  // 3. Validate token
  console.log('\n3. Validating token...');
  const introspection = await server.handleIntrospectionRequest({
    token: token.access_token
  }, {
    username: client.client_id,
    password: client.client_secret
  });
  console.log(`   Active: ${introspection.active}`);
  console.log(`   Client ID: ${introspection.client_id}`);
  console.log(`   Scope: ${introspection.scope}`);

  server.destroy();
}

/**
 * Example 2: Authorization Code Flow with PKCE (Human Orchestrator)
 */
async function authorizationCodeExample() {
  console.log('\n=== Authorization Code Flow with PKCE ===\n');

  const server = new OAuthServer();

  // 1. Register client
  console.log('1. Registering client...');
  const client = await server.handleRegistrationRequest({
    client_name: 'Human Orchestrator',
    redirect_uris: ['https://orchestrator.example.com/callback'],
    grant_types: ['authorization_code', 'refresh_token']
  });
  console.log(`   Client ID: ${client.client_id}`);

  // 2. Generate PKCE code verifier and challenge
  console.log('\n2. Generating PKCE code verifier and challenge...');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  console.log(`   Code Verifier: ${codeVerifier.substring(0, 20)}...`);
  console.log(`   Code Challenge: ${codeChallenge.substring(0, 20)}...`);

  // 3. Request authorization code
  console.log('\n3. Requesting authorization code...');
  const authResponse = await server.handleAuthorizationRequest({
    client_id: client.client_id,
    redirect_uri: 'https://orchestrator.example.com/callback',
    response_type: 'code',
    scope: 'mcp:execute mcp:read mcp:write',
    state: 'random-state-value',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  console.log(`   Authorization Code: ${authResponse.code.substring(0, 20)}...`);
  console.log(`   Redirect URI: ${authResponse.redirect_uri}`);

  // 4. Exchange code for tokens
  console.log('\n4. Exchanging code for tokens...');
  const tokenResponse = await server.handleTokenRequest({
    grant_type: 'authorization_code',
    code: authResponse.code,
    redirect_uri: 'https://orchestrator.example.com/callback',
    code_verifier: codeVerifier
  }, {
    username: client.client_id,
    password: client.client_secret
  });
  console.log(`   Access Token: ${tokenResponse.access_token.substring(0, 50)}...`);
  console.log(`   Refresh Token: ${tokenResponse.refresh_token.substring(0, 50)}...`);
  console.log(`   Expires In: ${tokenResponse.expires_in}s`);

  // 5. Refresh the token
  console.log('\n5. Refreshing token...');
  const refreshedTokens = await server.handleTokenRequest({
    grant_type: 'refresh_token',
    refresh_token: tokenResponse.refresh_token
  }, {
    username: client.client_id,
    password: client.client_secret
  });
  console.log(`   New Access Token: ${refreshedTokens.access_token.substring(0, 50)}...`);
  console.log(`   New Refresh Token: ${refreshedTokens.refresh_token.substring(0, 50)}...`);
  console.log(`   Old refresh token is now invalid (rotated)`);

  server.destroy();
}

/**
 * Example 3: HTTP Server with OAuth Protection
 */
async function httpServerExample() {
  console.log('\n=== HTTP Server with OAuth Protection ===\n');

  // Start OAuth HTTP server
  console.log('1. Starting OAuth HTTP server...');
  const { app, server, port } = await startOAuthHTTPServer({ port: 3000 });
  console.log(`   Server running on http://localhost:${port}`);

  // Example endpoints:
  console.log('\n2. Available endpoints:');
  console.log('   GET  /.well-known/oauth-authorization-server - Server metadata');
  console.log('   POST /oauth/register                         - Register client');
  console.log('   POST /oauth/token                            - Get access token');
  console.log('   POST /oauth/revoke                           - Revoke token');
  console.log('   POST /oauth/introspect                       - Introspect token');

  console.log('\n3. Example curl commands:');
  console.log('   # Register client:');
  console.log('   curl -X POST http://localhost:3000/oauth/register \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"client_name":"Worker","redirect_uris":["https://example.com/callback"]}\'');

  console.log('\n   # Get token:');
  console.log('   curl -X POST http://localhost:3000/oauth/token \\');
  console.log('     -u "client_id:client_secret" \\');
  console.log('     -d "grant_type=client_credentials&scope=mcp:execute"');

  console.log('\n   # Use token:');
  console.log('   curl http://localhost:3000/mcp/protected \\');
  console.log('     -H "Authorization: Bearer <token>"');

  console.log('\nPress Ctrl+C to stop server\n');

  // Keep server running
  await new Promise(resolve => {
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      server.close(() => {
        console.log('Server stopped');
        resolve();
      });
    });
  });
}

/**
 * Example 4: Security Best Practices
 */
async function securityExample() {
  console.log('\n=== Security Best Practices ===\n');

  const server = new OAuthServer({
    baseUrl: 'https://oauth.example.com', // Always HTTPS in production
    requirePKCE: true, // Mandatory PKCE (OAuth 2.1)
    token: {
      secret: process.env.OAUTH_TOKEN_SECRET || crypto.randomBytes(32).toString('hex'),
      accessTokenTTL: 3600,    // 1 hour
      refreshTokenTTL: 604800  // 7 days
    }
  });

  console.log('1. Security features enabled:');
  console.log('   ✓ PKCE required for Authorization Code flow');
  console.log('   ✓ HTTPS enforcement for redirect URIs');
  console.log('   ✓ JWT token signing with HS256');
  console.log('   ✓ Refresh token rotation on use');
  console.log('   ✓ Constant-time comparison for secrets');
  console.log('   ✓ Token expiration enforcement');
  console.log('   ✓ Code reuse detection');

  console.log('\n2. Production recommendations:');
  console.log('   - Use environment variables for secrets');
  console.log('   - Enable Redis for token storage');
  console.log('   - Use PostgreSQL for client storage');
  console.log('   - Enable HTTPS with proper certificates');
  console.log('   - Set appropriate token TTLs');
  console.log('   - Implement rate limiting per client');
  console.log('   - Log all authentication events');
  console.log('   - Monitor for suspicious activity');

  console.log('\n3. Example production configuration:');
  console.log('   export OAUTH_TOKEN_SECRET=$(openssl rand -hex 32)');
  console.log('   export REDIS_URL=redis://redis.example.com:6379');
  console.log('   export DATABASE_URL=postgresql://user:pass@db.example.com/oauth');

  server.destroy();
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         OAuth 2.1 for MCP Server Examples             ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const examples = [
    { name: 'Client Credentials', fn: clientCredentialsExample },
    { name: 'Authorization Code + PKCE', fn: authorizationCodeExample },
    { name: 'HTTP Server', fn: httpServerExample },
    { name: 'Security Best Practices', fn: securityExample }
  ];

  // Parse command line arguments
  const exampleArg = process.argv[2];

  if (exampleArg === '--server' || exampleArg === '-s') {
    await httpServerExample();
    return;
  }

  if (exampleArg === '--all' || !exampleArg) {
    // Run all examples except HTTP server
    for (let i = 0; i < examples.length - 1; i++) {
      await examples[i].fn();
    }
    console.log('\n✓ All examples completed successfully!\n');
  } else {
    const index = parseInt(exampleArg, 10) - 1;
    if (index >= 0 && index < examples.length) {
      await examples[index].fn();
    } else {
      console.log('\nUsage:');
      console.log('  node example.js          - Run all examples');
      console.log('  node example.js 1        - Run example 1 (Client Credentials)');
      console.log('  node example.js 2        - Run example 2 (Authorization Code)');
      console.log('  node example.js 3        - Run example 3 (HTTP Server)');
      console.log('  node example.js 4        - Run example 4 (Security)');
      console.log('  node example.js --server - Start HTTP server\n');
    }
  }
}

// Run if executed directly
if (process.argv[1] === import.meta.url.replace('file://', '')) {
  main().catch(error => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
}

export { clientCredentialsExample, authorizationCodeExample, httpServerExample, securityExample };
