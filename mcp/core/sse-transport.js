/**
 * SSE Transport for MCP Server
 *
 * Server-Sent Events transport for bidirectional JSON-RPC communication.
 * Provides real-time streaming updates from server to client.
 *
 * Features:
 * - Bidirectional communication (SSE for server->client, POST for client->server)
 * - Connection management and tracking
 * - Heartbeat/keepalive mechanism
 * - Automatic reconnection support
 * - CORS support for web clients
 * - Compression middleware
 *
 * Protocol:
 * - GET /mcp/sse - Establish SSE connection (server->client messages)
 * - POST /mcp/rpc - Send RPC requests (client->server messages)
 *
 * @module mcp/core/sse-transport
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
 * Log to stderr (never stdout)
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
    transport: 'sse',
    message,
    ...data
  };

  console.error(JSON.stringify(logEntry));
}

/**
 * SSE Transport
 *
 * Implements bidirectional JSON-RPC communication using:
 * - Server-Sent Events (SSE) for server-to-client streaming
 * - HTTP POST for client-to-server requests
 */
export class SSETransport extends EventEmitter {
  constructor(options = {}) {
    super();

    this.port = options.port || 3838;
    this.host = options.host || 'localhost';
    this.logLevel = options.logLevel || 'info';
    this.corsOptions = options.cors || { origin: '*' };
    this.compression = options.compression !== false;
    this.helmet = options.helmet !== false;

    // HTTPS configuration
    this.https = options.https || null;

    // Connection management
    this.connections = new Map(); // connectionId -> { res, metadata }
    this.connected = false;

    // Heartbeat configuration
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30s default
    this.heartbeatTimer = null;

    // Express app
    this.app = null;
    this.server = null;

    this._setupApp();
  }

  /**
   * Setup Express application
   *
   * @private
   */
  _setupApp() {
    this.app = express();

    // Trust proxy headers
    this.app.set('trust proxy', true);

    // Security headers (relaxed for SSE)
    if (this.helmet) {
      this.app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
      }));
    }

    // CORS
    this.app.use(cors(this.corsOptions));

    // Compression (disabled for SSE endpoints)
    if (this.compression) {
      this.app.use((req, res, next) => {
        // Skip compression for SSE
        if (req.path === '/mcp/sse') {
          return next();
        }
        compression()(req, res, next);
      });
    }

    // JSON body parser
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.log('debug', 'HTTP request', {
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
        transport: 'sse',
        connections: this.connections.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // SSE endpoint (server->client messages)
    this.app.get('/mcp/sse', (req, res) => {
      this._handleSSEConnection(req, res);
    });

    // RPC endpoint (client->server messages)
    this.app.post('/mcp/rpc', async (req, res) => {
      await this._handleRPCRequest(req, res);
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
          code: -32603,
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
        message: 'Available endpoints: GET /mcp/sse, POST /mcp/rpc'
      });
    });
  }

  /**
   * Start the transport
   *
   * @returns {Promise<SSETransport>} This transport instance
   */
  async start() {
    if (this.connected) {
      throw new Error('Transport already started');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Create HTTP or HTTPS server
        if (this.https) {
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
          this.log('info', `SSE transport started on ${protocol}://${this.host}:${this.port}`);

          // Start heartbeat
          this._startHeartbeat();

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
      // Stop heartbeat
      this._stopHeartbeat();

      // Close all SSE connections
      for (const [connectionId, { res }] of this.connections) {
        this._sendSSE(res, 'close', { reason: 'Server shutting down' });
        res.end();
      }
      this.connections.clear();

      // Close server
      this.server.close(() => {
        this.connected = false;
        this.log('info', 'SSE transport stopped');
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
   * Handle SSE connection
   *
   * @private
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  _handleSSEConnection(req, res) {
    const connectionId = this._generateConnectionId();

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Store connection
    const metadata = {
      connectedAt: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    this.connections.set(connectionId, { res, metadata });

    this.log('info', 'SSE connection established', { connectionId, ...metadata });

    // Send connection event
    this._sendSSE(res, 'connected', { connectionId });

    // Handle connection close
    req.on('close', () => {
      this.connections.delete(connectionId);
      this.log('info', 'SSE connection closed', { connectionId });
      this.emit('connectionClosed', connectionId);
    });

    // Emit connection event
    this.emit('connection', connectionId);
  }

  /**
   * Handle RPC request
   *
   * @private
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   */
  async _handleRPCRequest(req, res) {
    try {
      const message = req.body;
      const connectionId = req.get('x-connection-id');

      // Validate JSON-RPC format
      if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid JSON-RPC version (expected "2.0")'
          },
          id: message.id || null
        });
      }

      this.log('debug', 'Received RPC request', {
        id: message.id,
        method: message.method,
        connectionId
      });

      // Emit message event
      this.emit('message', message, connectionId);

      // Send acknowledgment
      res.json({
        jsonrpc: '2.0',
        result: { received: true },
        id: message.id
      });

    } catch (error) {
      this.log('error', 'Failed to handle RPC request', { error: error.message });

      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error.message
        },
        id: req.body?.id || null
      });
    }
  }

  /**
   * Send message to specific connection
   *
   * @param {string} connectionId - Connection ID
   * @param {Object} message - JSON-RPC message
   */
  send(connectionId, message) {
    const connection = this.connections.get(connectionId);

    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    this._sendSSE(connection.res, 'message', message);
    this.log('debug', 'Sent SSE message', { connectionId, messageId: message.id });
  }

  /**
   * Broadcast message to all connections
   *
   * @param {Object} message - JSON-RPC message
   */
  broadcast(message) {
    let sent = 0;

    for (const [connectionId, { res }] of this.connections) {
      try {
        this._sendSSE(res, 'message', message);
        sent++;
      } catch (error) {
        this.log('error', 'Failed to broadcast to connection', {
          connectionId,
          error: error.message
        });
      }
    }

    this.log('debug', 'Broadcast message', { recipients: sent, total: this.connections.size });
  }

  /**
   * Send a JSON-RPC response
   *
   * @param {number|string} id - Request ID
   * @param {*} result - Response result
   * @param {string} [connectionId] - Connection ID (broadcasts if omitted)
   */
  sendResponse(id, result, connectionId = null) {
    const response = {
      jsonrpc: '2.0',
      id,
      result
    };

    if (connectionId) {
      this.send(connectionId, response);
    } else {
      this.broadcast(response);
    }
  }

  /**
   * Send a JSON-RPC error response
   *
   * @param {number|string} id - Request ID
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {*} [data] - Additional error data
   * @param {string} [connectionId] - Connection ID (broadcasts if omitted)
   */
  sendError(id, code, message, data = null, connectionId = null) {
    const response = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    };

    if (connectionId) {
      this.send(connectionId, response);
    } else {
      this.broadcast(response);
    }
  }

  /**
   * Send a JSON-RPC notification
   *
   * @param {string} method - Notification method
   * @param {*} params - Notification parameters
   * @param {string} [connectionId] - Connection ID (broadcasts if omitted)
   */
  sendNotification(method, params, connectionId = null) {
    const notification = {
      jsonrpc: '2.0',
      method,
      params
    };

    if (connectionId) {
      this.send(connectionId, notification);
    } else {
      this.broadcast(notification);
    }
  }

  /**
   * Send SSE event
   *
   * @private
   * @param {Object} res - Response object
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  _sendSSE(res, event, data) {
    const payload = JSON.stringify(data);
    res.write(`event: ${event}\n`);
    res.write(`data: ${payload}\n\n`);
  }

  /**
   * Start heartbeat timer
   *
   * @private
   */
  _startHeartbeat() {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      const timestamp = new Date().toISOString();

      for (const [connectionId, { res }] of this.connections) {
        try {
          this._sendSSE(res, 'heartbeat', { timestamp });
        } catch (error) {
          this.log('warn', 'Heartbeat failed, removing connection', {
            connectionId,
            error: error.message
          });
          this.connections.delete(connectionId);
        }
      }

      this.log('debug', 'Heartbeat sent', { connections: this.connections.size });
    }, this.heartbeatInterval);

    this.log('info', 'Heartbeat started', { interval: this.heartbeatInterval });
  }

  /**
   * Stop heartbeat timer
   *
   * @private
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.log('info', 'Heartbeat stopped');
    }
  }

  /**
   * Generate connection ID
   *
   * @private
   * @returns {string} Connection ID
   */
  _generateConnectionId() {
    return `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get connection count
   *
   * @returns {number} Number of active connections
   */
  getConnectionCount() {
    return this.connections.size;
  }

  /**
   * Get connection IDs
   *
   * @returns {string[]} Array of connection IDs
   */
  getConnectionIds() {
    return Array.from(this.connections.keys());
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

    logToStderr(level, `[SSETransport] ${message}`, data);
  }
}

export default SSETransport;
