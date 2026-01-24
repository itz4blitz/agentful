/**
 * OAuth 2.1 Authentication Module
 *
 * Complete OAuth 2.1 implementation for MCP remote server access.
 * Exports all authentication components.
 *
 * @module mcp/auth
 */

export { OAuthServer } from './oauth-server.js';
export { TokenManager } from './tokens.js';
export { ClientRegistry } from './client-registry.js';
export { AuthorizationServerMetadata, createMetadata } from './metadata.js';
export { OAuthMiddleware } from './middleware.js';

/**
 * Create a complete OAuth server with all components
 *
 * @param {Object} options - Configuration options
 * @returns {Object} OAuth server instance and components
 */
export function createOAuthServer(options = {}) {
  const { OAuthServer } = await import('./oauth-server.js');
  const server = new OAuthServer(options);

  return {
    server,
    tokenManager: server.tokenManager,
    clientRegistry: server.clientRegistry,
    metadata: server.metadata
  };
}

export default {
  OAuthServer,
  TokenManager,
  ClientRegistry,
  AuthorizationServerMetadata,
  OAuthMiddleware,
  createOAuthServer
};
