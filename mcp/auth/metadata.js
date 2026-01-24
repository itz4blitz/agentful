/**
 * OAuth 2.1 Authorization Server Metadata
 *
 * Implements RFC8414 compliant authorization server metadata.
 * Exposes /.well-known/oauth-authorization-server endpoint.
 *
 * Features:
 * - Server capability advertisement
 * - Endpoint discovery
 * - Supported grant types, response types, scopes
 *
 * @module mcp/auth/metadata
 */

/**
 * Authorization Server Metadata
 *
 * Provides OAuth 2.1 server metadata per RFC8414
 */
export class AuthorizationServerMetadata {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.issuer = options.issuer || this.baseUrl;

    // Build metadata
    this.metadata = this._buildMetadata(options);
  }

  /**
   * Get server metadata
   *
   * @returns {Object} RFC8414 compliant metadata
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * Build server metadata
   *
   * @private
   * @param {Object} options - Configuration options
   * @returns {Object} Server metadata
   */
  _buildMetadata(options) {
    return {
      // REQUIRED: The authorization server's issuer identifier
      issuer: this.issuer,

      // REQUIRED: URL of the authorization endpoint
      authorization_endpoint: `${this.baseUrl}/oauth/authorize`,

      // REQUIRED: URL of the token endpoint
      token_endpoint: `${this.baseUrl}/oauth/token`,

      // RECOMMENDED: URL of the registration endpoint
      registration_endpoint: `${this.baseUrl}/oauth/register`,

      // OPTIONAL: URL of the revocation endpoint
      revocation_endpoint: `${this.baseUrl}/oauth/revoke`,

      // OPTIONAL: URL of the introspection endpoint
      introspection_endpoint: `${this.baseUrl}/oauth/introspect`,

      // OPTIONAL: URL of the JWKS endpoint (for public key verification)
      jwks_uri: `${this.baseUrl}/oauth/jwks`,

      // OPTIONAL: List of scopes supported
      scopes_supported: options.scopes || [
        'mcp:execute',
        'mcp:read',
        'mcp:write',
        'mcp:admin'
      ],

      // REQUIRED: List of response types supported
      response_types_supported: options.responseTypes || [
        'code'
      ],

      // OPTIONAL: List of response modes supported
      response_modes_supported: ['query', 'fragment'],

      // OPTIONAL: List of grant types supported
      grant_types_supported: options.grantTypes || [
        'authorization_code',
        'client_credentials',
        'refresh_token'
      ],

      // OPTIONAL: List of token endpoint auth methods
      token_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post'
      ],

      // OPTIONAL: List of token endpoint auth signing algorithms
      token_endpoint_auth_signing_alg_values_supported: [
        'HS256'
      ],

      // OPTIONAL: Service documentation URL
      service_documentation: `${this.baseUrl}/docs`,

      // OPTIONAL: UI locales supported
      ui_locales_supported: ['en-US'],

      // OPTIONAL: OAuth 2.1 specific features
      code_challenge_methods_supported: ['S256'], // PKCE required

      // OPTIONAL: Revocation endpoint auth methods
      revocation_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post'
      ],

      // OPTIONAL: Introspection endpoint auth methods
      introspection_endpoint_auth_methods_supported: [
        'client_secret_basic',
        'client_secret_post'
      ],

      // OPTIONAL: Claims supported
      claims_supported: [
        'sub',
        'iss',
        'aud',
        'exp',
        'iat',
        'jti',
        'scope'
      ],

      // OPTIONAL: Request parameter supported
      request_parameter_supported: false,
      request_uri_parameter_supported: false,

      // OPTIONAL: Require request object
      require_request_uri_registration: false,

      // OPTIONAL: Other metadata
      op_policy_uri: `${this.baseUrl}/policy`,
      op_tos_uri: `${this.baseUrl}/terms`
    };
  }

  /**
   * Update metadata
   *
   * @param {Object} updates - Metadata updates
   */
  updateMetadata(updates) {
    Object.assign(this.metadata, updates);
  }
}

/**
 * Create metadata response
 *
 * @param {Object} options - Configuration options
 * @returns {Object} Metadata object
 */
export function createMetadata(options = {}) {
  const metadata = new AuthorizationServerMetadata(options);
  return metadata.getMetadata();
}

export default AuthorizationServerMetadata;
