/**
 * OAuth 2.1 HTTP Server
 *
 * Express-based HTTP server that exposes OAuth 2.1 endpoints
 * for remote MCP server authentication.
 *
 * @module mcp/auth/http-server
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { OAuthServer } from './oauth-server.js';
import { OAuthMiddleware } from './middleware.js';

/**
 * Create OAuth HTTP Server
 *
 * @param {Object} options - Server options
 * @param {number} options.port - Server port
 * @param {OAuthServer} options.oauthServer - OAuth server instance
 * @param {OAuthMiddleware} options.middleware - OAuth middleware instance
 * @returns {express.Application} Express app
 */
export function createOAuthHTTPServer(options = {}) {
  const app = express();
  const port = options.port || 3000;
  const oauthServer = options.oauthServer || new OAuthServer({ baseUrl: `http://localhost:${port}` });
  const middleware = options.middleware || new OAuthMiddleware({ tokenManager: oauthServer.tokenManager });

  // Security middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use((req, res, next) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip
    }));
    next();
  });

  /**
   * RFC8414: Authorization Server Metadata
   * GET /.well-known/oauth-authorization-server
   */
  app.get('/.well-known/oauth-authorization-server', (req, res) => {
    res.json(oauthServer.metadata.getMetadata());
  });

  /**
   * OAuth 2.1: Authorization Endpoint
   * GET /oauth/authorize
   */
  app.get('/oauth/authorize', async (req, res) => {
    try {
      const authResponse = await oauthServer.handleAuthorizationRequest(req.query);

      // Redirect to client with code
      res.redirect(authResponse.redirect_uri);
    } catch (error) {
      res.status(400).json({
        error: error.error || 'invalid_request',
        error_description: error.error_description || error.message
      });
    }
  });

  /**
   * OAuth 2.1: Token Endpoint
   * POST /oauth/token
   */
  app.post('/oauth/token', async (req, res) => {
    try {
      // Extract Basic auth if present
      const auth = extractBasicAuth(req);

      const tokenResponse = await oauthServer.handleTokenRequest(req.body, auth);

      res.json(tokenResponse);
    } catch (error) {
      res.status(400).json({
        error: error.error || 'invalid_request',
        error_description: error.error_description || error.message
      });
    }
  });

  /**
   * RFC7591: Dynamic Client Registration
   * POST /oauth/register
   */
  app.post('/oauth/register', async (req, res) => {
    try {
      const clientResponse = await oauthServer.handleRegistrationRequest(req.body);

      res.status(201).json(clientResponse);
    } catch (error) {
      res.status(400).json({
        error: error.error || 'invalid_request',
        error_description: error.error_description || error.message
      });
    }
  });

  /**
   * RFC7009: Token Revocation
   * POST /oauth/revoke
   */
  app.post('/oauth/revoke', async (req, res) => {
    try {
      const auth = extractBasicAuth(req);
      await oauthServer.handleRevocationRequest(req.body, auth);

      // RFC7009: Always return 200
      res.status(200).json({});
    } catch (error) {
      res.status(400).json({
        error: error.error || 'invalid_request',
        error_description: error.error_description || error.message
      });
    }
  });

  /**
   * RFC7662: Token Introspection
   * POST /oauth/introspect
   */
  app.post('/oauth/introspect', async (req, res) => {
    try {
      const auth = extractBasicAuth(req);
      const introspection = await oauthServer.handleIntrospectionRequest(req.body, auth);

      res.json(introspection);
    } catch (error) {
      res.status(400).json({
        error: error.error || 'invalid_request',
        error_description: error.error_description || error.message
      });
    }
  });

  /**
   * Protected MCP endpoint example
   * Requires valid OAuth token
   */
  app.get('/mcp/protected',
    middleware.authenticate(),
    middleware.requireScopes(['mcp:read']),
    middleware.rateLimit(),
    (req, res) => {
      res.json({
        message: 'Access granted',
        client_id: req.oauth.clientId,
        scope: req.oauth.scope
      });
    }
  );

  /**
   * Health check endpoint
   */
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * Error handler
   */
  app.use((err, req, res, next) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: err.stack
    }));

    res.status(err.status || 500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  });

  return app;
}

/**
 * Extract Basic authentication credentials
 *
 * @param {express.Request} req - Express request
 * @returns {Object} Auth credentials { username, password }
 */
function extractBasicAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return {};
  }

  try {
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    return { username, password };
  } catch {
    return {};
  }
}

/**
 * Start OAuth HTTP Server
 *
 * @param {Object} options - Server options
 * @returns {Promise<Object>} Server instance
 */
export async function startOAuthHTTPServer(options = {}) {
  const app = createOAuthHTTPServer(options);
  const port = options.port || 3000;

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `OAuth HTTP server listening on port ${port}`
      }));

      resolve({ app, server, port });
    });

    server.on('error', reject);
  });
}

export default { createOAuthHTTPServer, startOAuthHTTPServer };
