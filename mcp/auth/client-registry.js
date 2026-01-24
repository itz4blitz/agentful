/**
 * OAuth 2.1 Dynamic Client Registration
 *
 * Implements RFC7591 compliant dynamic client registration.
 * Allows clients to register themselves with the authorization server.
 *
 * Features:
 * - Client registration
 * - Client ID/secret generation
 * - Client management
 * - Metadata validation
 *
 * @module mcp/auth/client-registry
 */

import crypto from 'crypto';

/**
 * Client Registry
 *
 * Manages OAuth 2.1 client registration and metadata
 */
export class ClientRegistry {
  constructor(options = {}) {
    // Client storage (use database in production)
    this.clients = new Map(); // clientId -> clientData

    // Configuration
    this.requireClientAuthentication = options.requireClientAuthentication !== false;
    this.allowedGrantTypes = options.allowedGrantTypes || [
      'authorization_code',
      'client_credentials',
      'refresh_token'
    ];
    this.allowedResponseTypes = options.allowedResponseTypes || ['code'];
    this.defaultTokenTTL = options.defaultTokenTTL || 3600;
  }

  /**
   * Register a new client
   *
   * @param {Object} metadata - Client metadata
   * @param {string[]} metadata.redirect_uris - Redirect URIs
   * @param {string} [metadata.client_name] - Client name
   * @param {string[]} [metadata.grant_types] - Grant types
   * @param {string[]} [metadata.response_types] - Response types
   * @param {string[]} [metadata.scope] - Requested scopes
   * @param {string} [metadata.token_endpoint_auth_method] - Auth method
   * @returns {Object} Client registration response
   * @throws {Error} If validation fails
   */
  registerClient(metadata) {
    // Validate required fields
    this._validateClientMetadata(metadata);

    // Generate client credentials
    const clientId = this._generateClientId();
    const clientSecret = this._generateClientSecret();

    // Determine auth method
    const authMethod = metadata.token_endpoint_auth_method || 'client_secret_basic';

    // Build client data
    const client = {
      client_id: clientId,
      client_secret: clientSecret,
      client_secret_expires_at: 0, // Never expires (can be changed)
      client_id_issued_at: Math.floor(Date.now() / 1000),

      // Metadata
      client_name: metadata.client_name || `Client ${clientId}`,
      redirect_uris: metadata.redirect_uris,
      grant_types: metadata.grant_types || ['authorization_code'],
      response_types: metadata.response_types || ['code'],
      scope: metadata.scope || [],
      token_endpoint_auth_method: authMethod,

      // Additional metadata
      contacts: metadata.contacts || [],
      logo_uri: metadata.logo_uri,
      client_uri: metadata.client_uri,
      policy_uri: metadata.policy_uri,
      tos_uri: metadata.tos_uri,

      // Internal metadata
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store client
    this.clients.set(clientId, client);

    // Return registration response (RFC7591 Section 3.2.1)
    return {
      client_id: client.client_id,
      client_secret: client.client_secret,
      client_secret_expires_at: client.client_secret_expires_at,
      client_id_issued_at: client.client_id_issued_at,

      // Return registered metadata
      client_name: client.client_name,
      redirect_uris: client.redirect_uris,
      grant_types: client.grant_types,
      response_types: client.response_types,
      scope: client.scope,
      token_endpoint_auth_method: client.token_endpoint_auth_method
    };
  }

  /**
   * Get client by ID
   *
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Client data or null if not found
   */
  getClient(clientId) {
    return this.clients.get(clientId) || null;
  }

  /**
   * Verify client credentials
   *
   * @param {string} clientId - Client identifier
   * @param {string} clientSecret - Client secret
   * @returns {boolean} True if credentials are valid
   */
  verifyCredentials(clientId, clientSecret) {
    const client = this.getClient(clientId);
    if (!client) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return this._secureCompare(client.client_secret, clientSecret);
  }

  /**
   * Update client metadata
   *
   * @param {string} clientId - Client identifier
   * @param {Object} updates - Metadata updates
   * @returns {Object|null} Updated client or null if not found
   */
  updateClient(clientId, updates) {
    const client = this.getClient(clientId);
    if (!client) {
      return null;
    }

    // Validate updates
    if (updates.redirect_uris) {
      this._validateRedirectUris(updates.redirect_uris);
    }
    if (updates.grant_types) {
      this._validateGrantTypes(updates.grant_types);
    }
    if (updates.response_types) {
      this._validateResponseTypes(updates.response_types);
    }

    // Apply updates (only allowed fields)
    const allowedUpdates = [
      'client_name',
      'redirect_uris',
      'grant_types',
      'response_types',
      'scope',
      'contacts',
      'logo_uri',
      'client_uri',
      'policy_uri',
      'tos_uri'
    ];

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        client[key] = updates[key];
      }
    }

    client.updated_at = new Date().toISOString();

    // Store updated client
    this.clients.set(clientId, client);

    return client;
  }

  /**
   * Delete client
   *
   * @param {string} clientId - Client identifier
   * @returns {boolean} True if client was deleted
   */
  deleteClient(clientId) {
    return this.clients.delete(clientId);
  }

  /**
   * List all clients
   *
   * @returns {Object[]} Array of client data
   */
  listClients() {
    return Array.from(this.clients.values());
  }

  /**
   * Validate client metadata
   *
   * @private
   * @param {Object} metadata - Client metadata
   * @throws {Error} If validation fails
   */
  _validateClientMetadata(metadata) {
    // Redirect URIs are required for authorization_code flow
    if (!metadata.redirect_uris || !Array.isArray(metadata.redirect_uris) || metadata.redirect_uris.length === 0) {
      throw new Error('redirect_uris is required and must be a non-empty array');
    }

    this._validateRedirectUris(metadata.redirect_uris);

    // Validate grant types
    if (metadata.grant_types) {
      this._validateGrantTypes(metadata.grant_types);
    }

    // Validate response types
    if (metadata.response_types) {
      this._validateResponseTypes(metadata.response_types);
    }

    // Validate scopes
    if (metadata.scope && !Array.isArray(metadata.scope)) {
      throw new Error('scope must be an array');
    }
  }

  /**
   * Validate redirect URIs
   *
   * @private
   * @param {string[]} uris - Redirect URIs
   * @throws {Error} If validation fails
   */
  _validateRedirectUris(uris) {
    for (const uri of uris) {
      try {
        const url = new URL(uri);

        // OAuth 2.1: MUST use https (or http for localhost)
        if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          throw new Error(`Redirect URI must use https: ${uri}`);
        }

        // OAuth 2.1: Fragment is not allowed
        if (url.hash) {
          throw new Error(`Redirect URI must not contain fragment: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Invalid redirect URI: ${uri} - ${error.message}`);
      }
    }
  }

  /**
   * Validate grant types
   *
   * @private
   * @param {string[]} grantTypes - Grant types
   * @throws {Error} If validation fails
   */
  _validateGrantTypes(grantTypes) {
    for (const grantType of grantTypes) {
      if (!this.allowedGrantTypes.includes(grantType)) {
        throw new Error(`Unsupported grant type: ${grantType}`);
      }
    }
  }

  /**
   * Validate response types
   *
   * @private
   * @param {string[]} responseTypes - Response types
   * @throws {Error} If validation fails
   */
  _validateResponseTypes(responseTypes) {
    for (const responseType of responseTypes) {
      if (!this.allowedResponseTypes.includes(responseType)) {
        throw new Error(`Unsupported response type: ${responseType}`);
      }
    }
  }

  /**
   * Generate client ID
   *
   * @private
   * @returns {string} Client ID
   */
  _generateClientId() {
    return `client_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate client secret
   *
   * @private
   * @returns {string} Client secret
   */
  _generateClientSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Secure string comparison (constant-time)
   *
   * @private
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} True if strings match
   */
  _secureCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    const aBuffer = Buffer.from(a);
    const bBuffer = Buffer.from(b);

    return crypto.timingSafeEqual(aBuffer, bBuffer);
  }
}

export default ClientRegistry;
