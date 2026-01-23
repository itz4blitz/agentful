/**
 * Agentful Remote Execution Server
 *
 * Secure HTTP server for remote agent execution with multiple authentication modes.
 *
 * @module server
 */

import http from 'http';
import https from 'https';
import { readFileSync } from 'fs';
import { createAuthMiddleware, captureRawBody } from './auth.js';
import {
  executeAgent,
  getExecutionStatus,
  listExecutions,
  startPeriodicCleanup,
} from './executor.js';
import { listAvailableAgents } from '../ci/claude-action-integration.js';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute per IP

/**
 * In-memory rate limit store
 */
const rateLimitStore = new Map();

/**
 * Clean up old rate limit entries periodically (every 2 minutes)
 */
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.windowStart < cutoff) {
      rateLimitStore.delete(ip);
    }
  }
}, 2 * 60 * 1000);

/**
 * Rate limiting middleware
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} True if request is allowed
 */
function checkRateLimit(req, res) {
  const clientIP = req.socket.remoteAddress;
  const now = Date.now();

  let rateLimitData = rateLimitStore.get(clientIP);

  // Initialize or reset window
  if (!rateLimitData || now - rateLimitData.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitData = {
      windowStart: now,
      requestCount: 0,
    };
    rateLimitStore.set(clientIP, rateLimitData);
  }

  // Increment request count
  rateLimitData.requestCount++;

  // Check if limit exceeded
  if (rateLimitData.requestCount > RATE_LIMIT_MAX_REQUESTS) {
    res.writeHead(429, {
      'Content-Type': 'application/json',
      'Retry-After': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    });
    res.end(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} requests per minute.`,
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      })
    );
    return false;
  }

  return true;
}

/**
 * Parse JSON body manually (to support raw body capture)
 * @param {string} rawBody - Raw request body
 * @returns {Object} Parsed JSON
 */
function parseJSON(rawBody) {
  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Simple request router
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Function} handler - Route handler
 * @returns {Object} Route definition
 */
function route(method, path, handler) {
  return { method, path, handler };
}

/**
 * Match route against request
 * @param {Object} route - Route definition
 * @param {string} method - Request method
 * @param {string} path - Request path
 * @returns {Object|null} Match result with params or null
 */
function matchRoute(route, method, path) {
  if (route.method !== method) {
    return null;
  }

  // Simple path matching with :param support
  const routeParts = route.path.split('/');
  const pathParts = path.split('/');

  if (routeParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].substring(1);
      params[paramName] = pathParts[i];
    } else if (routeParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return { params };
}

/**
 * Create agentful server
 * @param {Object} config - Server configuration
 * @param {string} [config.auth='tailscale'] - Authentication mode
 * @param {number} [config.port=3000] - Server port
 * @param {string} [config.secret] - HMAC secret (required for hmac mode)
 * @param {boolean} [config.https=false] - Enable HTTPS
 * @param {string} [config.cert] - SSL certificate path (for HTTPS)
 * @param {string} [config.key] - SSL key path (for HTTPS)
 * @param {string} [config.projectRoot] - Project root directory
 * @param {string} [config.corsOrigin] - CORS allowed origin (default: same-origin only)
 * @returns {Object} Server instance
 */
export function createServer(config = {}) {
  const {
    auth = 'tailscale',
    port = 3000,
    secret,
    https: enableHttps = false,
    cert,
    key,
    projectRoot = process.cwd(),
    corsOrigin = null,
  } = config;

  // Validate configuration
  if (auth === 'hmac' && !secret) {
    throw new Error('HMAC mode requires --secret');
  }

  if (enableHttps && (!cert || !key)) {
    throw new Error('HTTPS mode requires --cert and --key');
  }

  // Create authentication middleware
  const authMiddleware = createAuthMiddleware(auth, { secret });

  // Define routes
  const routes = [
    // Health check (no auth required)
    route('GET', '/health', async (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          uptime: process.uptime(),
          mode: auth,
          timestamp: Date.now(),
        })
      );
    }),

    // List available agents
    route('GET', '/agents', async (req, res, params) => {
      try {
        const agents = await listAvailableAgents(projectRoot);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            agents,
            count: agents.length,
          })
        );
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Failed to list agents',
            message: error.message,
          })
        );
      }
    }),

    // Trigger agent execution
    route('POST', '/trigger', async (req, res, params) => {
      try {
        const body = parseJSON(req.rawBody || '');

        // Validate request
        if (!body.agent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              error: 'Validation failed',
              message: 'Missing required field: agent',
            })
          );
        }

        if (!body.task) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              error: 'Validation failed',
              message: 'Missing required field: task',
            })
          );
        }

        // Log agent execution request
        console.log(`[${new Date().toISOString()}] Executing agent: ${body.agent}`);
        console.log(`[${new Date().toISOString()}] Task: ${body.task}`);

        // Start agent execution in background (async mode)
        const executionTimeout = body.timeout || 10 * 60 * 1000; // Default 10 min for execution

        const result = await executeAgent(body.agent, body.task, {
          projectRoot,
          timeout: executionTimeout,
          env: body.env,
          async: true, // Return immediately with executionId
        });

        console.log(`[${new Date().toISOString()}] Execution started: ${result.executionId}`);

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            executionId: result.executionId,
            message: 'Agent execution started',
            statusUrl: `/status/${result.executionId}`,
          })
        );
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Bad request',
            message: error.message,
          })
        );
      }
    }),

    // Get execution status
    route('GET', '/status/:executionId', async (req, res, params) => {
      const execution = getExecutionStatus(params.executionId);

      if (!execution) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(
          JSON.stringify({
            error: 'Not found',
            message: 'Execution not found',
          })
        );
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(execution));
    }),

    // List executions
    route('GET', '/executions', async (req, res, params) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const filters = {
        agent: url.searchParams.get('agent'),
        state: url.searchParams.get('state'),
        limit: parseInt(url.searchParams.get('limit') || '100', 10),
      };

      const executions = listExecutions(filters);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          executions,
          count: executions.length,
        })
      );
    }),
  ];

  // Request handler
  const requestHandler = (req, res) => {
    const startTime = Date.now();
    const clientIP = req.socket.remoteAddress;

    // Log incoming request
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} from ${clientIP}`);

    // Add CORS headers (restricted by default)
    if (corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    } else {
      // Same-origin only - no CORS header
      // Browsers will enforce same-origin policy
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Agentful-Signature, X-Agentful-Timestamp');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Response sent: 204 (${duration}ms)`);
      return res.end();
    }

    // Apply rate limiting
    if (!checkRateLimit(req, res)) {
      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Response sent: 429 Rate Limited (${duration}ms)`);
      return; // Rate limit exceeded, response already sent
    }

    // Intercept res.end to log responses
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      console.log(`[${new Date().toISOString()}] Response sent: ${statusCode} (${duration}ms)`);
      originalEnd.apply(res, args);
    };

    // Capture raw body (needed for HMAC verification)
    captureRawBody(req, res, () => {
      // Apply authentication (except for /health)
      if (req.url !== '/health') {
        authMiddleware(req, res, () => {
          handleRequest(req, res);
        });
      } else {
        handleRequest(req, res);
      }
    });
  };

  // Route request to handler
  function handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    // Find matching route
    for (const routeDef of routes) {
      const match = matchRoute(routeDef, req.method, path);
      if (match) {
        return routeDef.handler(req, res, match.params);
      }
    }

    // No route matched - 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Not found',
        message: `Route not found: ${req.method} ${path}`,
      })
    );
  }

  // Create HTTP or HTTPS server
  let server;
  if (enableHttps) {
    const credentials = {
      cert: readFileSync(cert, 'utf-8'),
      key: readFileSync(key, 'utf-8'),
    };
    server = https.createServer(credentials, requestHandler);
  } else {
    server = http.createServer(requestHandler);
  }

  // Always bind to all interfaces (0.0.0.0)
  // Security is enforced through authentication middleware, not binding address
  const host = '0.0.0.0';

  return {
    start: () => {
      return new Promise((resolve, reject) => {
        server.listen(port, host, (error) => {
          if (error) {
            return reject(error);
          }

          const protocol = enableHttps ? 'https' : 'http';
          console.log(`Agentful server listening on ${protocol}://${host}:${port}`);
          console.log(`Authentication mode: ${auth}`);

          if (auth === 'none') {
            console.log('Warning: No authentication enabled - use SSH tunnel for secure remote access');
          }

          // Start periodic cleanup
          startPeriodicCleanup();

          resolve();
        });
      });
    },

    stop: () => {
      return new Promise((resolve) => {
        server.close(() => {
          console.log('Server stopped');
          resolve();
        });
      });
    },

    server,
  };
}

/**
 * Start server from CLI arguments
 * @param {Object} args - Parsed CLI arguments
 */
export async function startServerFromCLI(args) {
  const config = {
    auth: args.auth || 'tailscale',
    port: args.port || 3000,
    secret: args.secret,
    https: args.https || false,
    cert: args.cert,
    key: args.key,
    projectRoot: args.projectRoot || process.cwd(),
    corsOrigin: args.corsOrigin || null,
  };

  const server = createServer(config);

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

export default {
  createServer,
  startServerFromCLI,
};
