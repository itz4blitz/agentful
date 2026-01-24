/**
 * HTTP Transport for MCP Server
 *
 * Express-based HTTP transport for JSON-RPC communication.
 * Provides RESTful POST endpoint for MCP protocol messages.
 *
 * Features:
 * - CORS support for web clients
 * - Compression middleware
 * - Security headers via Helmet
 * - Request/response logging to stderr
 * - Graceful shutdown
 * - HTTPS support via configuration
 *
 * @module mcp/core/http-transport
 */

import { EventEmitter } from 'events';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import https from 'https';
import http from 'http';
import { readFile } from 'fs/promises';

/**
 * Log to stderr (never stdout - reserved for stdio transport)
 *
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 */
function logToStderr(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    transport: 'http',
    message,
    ...data
  };

  console.error(JSON.stringify(logEntry));
}

/**
 * HTTP Transport
 *
 * Implements JSON-RPC communication over HTTP POST.
 * Suitable for remote MCP clients and web-based integrations.
 */
export class HttpTransport extends EventEmitter {
  constructor(options = {}) {
    super();

    this.port = options.port || 3838;
    this.host = options.host || 'localhost';
    this.logLevel = options.logLevel || 'info';
    this.corsOptions = options.cors || { origin: '*' };
    this.compression = options.compression !== false;
    this.helmet = options.helmet !== false;

    // HTTPS configuration
    this.https = options.https || null; // { key: '...', cert: '...' }

    // Express app
    this.app = null;
    this.server = null;
    this.connected = false;

    // Message handling
    this.pendingRequests = new Map(); // requestId -> { resolve, reject, timeout }
    this.requestTimeout = options.requestTimeout || 30000; // 30s default

    this._setupApp();
  }

  /**
   * Setup Express application
   *
   * @private
   */
  _setupApp() {
    this.app = express();

    // Trust proxy headers (for behind reverse proxy)
    this.app.set('trust proxy', true);

    // Security headers
    if (this.helmet) {
      this.app.use(helmet({
        contentSecurityPolicy: false, // Allow flexibility for MCP clients
        crossOriginEmbedderPolicy: false
      }));
    }

    // CORS
    this.app.use(cors(this.corsOptions));

    // Compression
    if (this.compression) {
      this.app.use(compression());
    }

    // JSON body parser
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.log('info', 'HTTP request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          ip: req.ip
        });
      });

      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        transport: 'http',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // MCP JSON-RPC endpoint
    this.app.post('/mcp', async (req, res) => {
      await this._handleMCPRequest(req, res);
    });

    // Error handling middleware
    this.app.use((err, req, res, next) => {
      this.log('error', 'Express error', {
        error: err.message,
        stack: err.stack,
        path: req.path
      });

      res.status(err.status || 500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603, // Internal error
          message: 'Internal server error',
          data: process.env.NODE_ENV === 'development' ? err.message : undefined
        },
        id: null
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        path: req.path,
        message: 'MCP endpoint is POST /mcp'
      });
    });
  }

  /**
   * Start the transport
   *
   * @returns {Promise<HttpTransport>} This transport instance
   */
  async start() {
    if (this.connected) {
      throw new Error('Transport already started');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Create HTTP or HTTPS server
        if (this.https) {
          // Load certificate files if paths provided
          const httpsOptions = { ...this.https };

          if (typeof httpsOptions.key === 'string' && httpsOptions.key.startsWith('/')) {
            httpsOptions.key = await readFile(httpsOptions.key, 'utf-8');
          }
          if (typeof httpsOptions.cert === 'string' && httpsOptions.cert.startsWith('/')) {
            httpsOptions.cert = await readFile(httpsOptions.cert, 'utf-8');
          }

          this.server = https.createServer(httpsOptions, this.app);
          this.log('info', 'Creating HTTPS server');
        } else {
          this.server = http.createServer(this.app);
          this.log('info', 'Creating HTTP server');
        }

        // Start listening
        this.server.listen(this.port, this.host, () => {
          this.connected = true;
          const protocol = this.https ? 'https' : 'http';
          this.log('info', `HTTP transport started on ${protocol}://${this.host}:${this.port}`);
          resolve(this);
        });

        this.server.on('error', (error) => {
          this.log('error', 'Server error', { error: error.message });
          if (!this.connected) {
            reject(error);
          } else {
            this.emit('error', error);
          }
        });

        this.server.on('close', () => {
          this.log('info', 'Server closed');
          this.emit('close');
        });

      } catch (error) {
        this.log('error', 'Failed to start server', { error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Stop the transport
   *
   * @returns {Promise<void>}
   */
  async stop() {
    if (!this.connected || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      // Cancel all pending requests
      for (const [requestId, pending] of this.pendingRequests) {
        clearTimeout(pending.timeout);
        pending.reject(new Error('Server shutting down'));
      }
      this.pendingRequests.clear();

      // Close server gracefully
      this.server.close(() => {
        this.connected = false;
        this.log('info', 'HTTP transport stopped');
        resolve();
      });

      // Force close after timeout
      setTimeout(() => {
        this.server.closeAllConnections?.();
        resolve();
      }, 5000);
    });
  }

  /**
   * Handle MCP JSON-RPC request
   *
   * @private
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async _handleMCPRequest(req, res) {
    try {
      const message = req.body;

      // Validate JSON-RPC format
      if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600, // Invalid Request
            message: 'Invalid JSON-RPC version (expected "2.0")'
          },
          id: message.id || null
        });
      }

      // Check if it's a request (has method) or response (has result/error)
      if (message.method) {
        // It's a request - emit for server to handle
        this.log('debug', 'Received JSON-RPC request', {
          id: message.id,
          method: message.method
        });

        // Emit message event and wait for response
        const response = await this._handleRequest(message);

        // Send response
        res.json(response);

      } else if (message.id && (message.result !== undefined || message.error !== undefined)) {
        // It's a response to our request
        this.log('debug', 'Received JSON-RPC response', { id: message.id });

        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.id);

          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }

        // Acknowledge receipt
        res.json({ received: true });

      } else {
        // Invalid message format
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600, // Invalid Request
            message: 'Invalid message format'
          },
          id: message.id || null
        });
      }

    } catch (error) {
      this.log('error', 'Failed to handle MCP request', { error: error.message });

      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603, // Internal error
          message: 'Internal server error',
          data: error.message
        },
        id: req.body?.id || null
      });
    }
  }

  /**
   * Handle incoming JSON-RPC request
   *
   * @private
   * @param {Object} message - JSON-RPC message
   * @returns {Promise<Object>} JSON-RPC response
   */
  async _handleRequest(message) {
    return new Promise((resolve) => {
      // Set up response handler
      const responseHandler = (response) => {
        this.removeListener('response', responseHandler);
        resolve(response);
      };

      this.once('response', responseHandler);

      // Emit message for server to handle
      this.emit('message', message);

      // Timeout handler
      setTimeout(() => {
        this.removeListener('response', responseHandler);
        resolve({
          jsonrpc: '2.0',
          error: {
            code: -32000, // Server error
            message: 'Request timeout'
          },
          id: message.id
        });
      }, this.requestTimeout);
    });
  }

  /**
   * Send a JSON-RPC message (for server-initiated requests)
   *
   * @param {Object} message - JSON-RPC message
   * @returns {Promise<*>} Response result
   */
  async send(message) {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    // Note: HTTP transport is request/response, not bidirectional
    // Server-initiated messages need SSE transport
    throw new Error('HTTP transport does not support server-initiated messages. Use SSE transport instead.');
  }

  /**
   * Send a JSON-RPC response
   *
   * @param {number|string} id - Request ID
   * @param {*} result - Response result
   */
  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };

    this.log('debug', 'Sending response', { id });
    this.emit('response', response);
  }

  /**
   * Send a JSON-RPC error response
   *
   * @param {number|string} id - Request ID
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {*} [data] - Additional error data
   */
  sendError(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };

    this.log('debug', 'Sending error response', { id, code, message });
    this.emit('response', response);
  }

  /**
   * Log message to stderr
   *
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   */
  log(level, message, data = {}) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) {
      return;
    }

    logToStderr(level, `[HttpTransport] ${message}`, data);
  }
}

export default HttpTransport;
