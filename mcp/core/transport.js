/**
 * MCP Transport Layer
 *
 * Handles message transport for Model Context Protocol server.
 * Supports stdio (for local Claude Desktop) and SSE (for future HTTP support).
 *
 * CRITICAL: All logging MUST go to stderr, never stdout.
 * Stdout is reserved for JSON-RPC messages in stdio transport.
 *
 * @module mcp/core/transport
 */

import { EventEmitter } from 'events';

/**
 * Log to stderr (never stdout - it corrupts stdio transport)
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
    message,
    ...data
  };

  // Write to stderr as JSON
  console.error(JSON.stringify(logEntry));
}

/**
 * Stdio Transport
 *
 * Implements JSON-RPC communication over stdin/stdout.
 * Used by Claude Desktop and other local MCP clients.
 */
export class StdioTransport extends EventEmitter {
  constructor(options = {}) {
    super();

    this.input = options.input || process.stdin;
    this.output = options.output || process.stdout;
    this.logLevel = options.logLevel || 'info';

    this.messageBuffer = '';
    this.connected = false;
    this.messageId = 0;

    this._setupInputHandling();
  }

  /**
   * Start the transport
   */
  async start() {
    if (this.connected) {
      throw new Error('Transport already started');
    }

    this.connected = true;
    this.log('info', 'Stdio transport started');

    // Set stdin to raw mode for better message handling
    if (this.input.isTTY) {
      this.input.setRawMode(true);
    }

    this.input.resume();

    return this;
  }

  /**
   * Stop the transport
   */
  async stop() {
    if (!this.connected) {
      return;
    }

    this.connected = false;
    this.input.pause();

    this.log('info', 'Stdio transport stopped');

    this.emit('close');
  }

  /**
   * Send a JSON-RPC message
   *
   * @param {Object} message - JSON-RPC message
   */
  send(message) {
    if (!this.connected) {
      throw new Error('Transport not connected');
    }

    try {
      // Serialize message
      const serialized = JSON.stringify(message);

      // Write to stdout with newline delimiter
      this.output.write(serialized + '\n');

      this.log('debug', 'Sent message', { messageId: message.id, method: message.method });

    } catch (error) {
      this.log('error', 'Failed to send message', { error: error.message });
      throw error;
    }
  }

  /**
   * Send a JSON-RPC response
   *
   * @param {number|string} id - Request ID
   * @param {*} result - Response result
   */
  sendResponse(id, result) {
    this.send({
      jsonrpc: '2.0',
      id,
      result
    });
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
    this.send({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data
      }
    });
  }

  /**
   * Send a JSON-RPC notification
   *
   * @param {string} method - Notification method
   * @param {*} params - Notification parameters
   */
  sendNotification(method, params) {
    this.send({
      jsonrpc: '2.0',
      method,
      params
    });
  }

  /**
   * Setup input stream handling
   *
   * @private
   */
  _setupInputHandling() {
    this.input.setEncoding('utf8');

    this.input.on('data', (chunk) => {
      this._handleInputChunk(chunk);
    });

    this.input.on('end', () => {
      this.log('info', 'Input stream ended');
      this.stop();
    });

    this.input.on('error', (error) => {
      this.log('error', 'Input stream error', { error: error.message });
      this.emit('error', error);
    });
  }

  /**
   * Handle input data chunk
   *
   * @private
   * @param {string} chunk - Data chunk
   */
  _handleInputChunk(chunk) {
    // Add to buffer
    this.messageBuffer += chunk;

    // Process complete messages (newline-delimited)
    let newlineIndex;
    while ((newlineIndex = this.messageBuffer.indexOf('\n')) !== -1) {
      const messageLine = this.messageBuffer.slice(0, newlineIndex).trim();
      this.messageBuffer = this.messageBuffer.slice(newlineIndex + 1);

      if (messageLine) {
        this._processMessage(messageLine);
      }
    }
  }

  /**
   * Process a complete message
   *
   * @private
   * @param {string} messageLine - Message line
   */
  _processMessage(messageLine) {
    try {
      const message = JSON.parse(messageLine);

      this.log('debug', 'Received message', { messageId: message.id, method: message.method });

      // Validate JSON-RPC format
      if (!message.jsonrpc || message.jsonrpc !== '2.0') {
        throw new Error('Invalid JSON-RPC version');
      }

      // Emit message event
      this.emit('message', message);

    } catch (error) {
      this.log('error', 'Failed to parse message', { error: error.message, messageLine });

      // Send parse error response if we can extract an ID
      try {
        const partialMessage = JSON.parse(messageLine);
        if (partialMessage.id) {
          this.sendError(partialMessage.id, -32700, 'Parse error', error.message);
        }
      } catch {
        // Can't send error response, just log
      }
    }
  }

  /**
   * Log message to stderr
   *
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   */
  log(level, message, data = {}) {
    // Check log level
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) {
      return; // Skip lower priority logs
    }

    logToStderr(level, `[StdioTransport] ${message}`, data);
  }
}

/**
 * SSE Transport (Server-Sent Events)
 *
 * Implements JSON-RPC communication over HTTP with SSE.
 * For future remote execution support.
 */
export class SSETransport extends EventEmitter {
  constructor(options = {}) {
    super();

    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.logLevel = options.logLevel || 'info';

    this.server = null;
    this.connections = new Map(); // connectionId -> response stream
    this.connected = false;
  }

  /**
   * Start the transport
   */
  async start() {
    if (this.connected) {
      throw new Error('Transport already started');
    }

    // Lazy import http module
    const http = await import('http');

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this._handleRequest(req, res);
      });

      this.server.listen(this.port, this.host, () => {
        this.connected = true;
        this.log('info', `SSE transport started on ${this.host}:${this.port}`);
        resolve(this);
      });

      this.server.on('error', (error) => {
        this.log('error', 'Server error', { error: error.message });
        reject(error);
      });
    });
  }

  /**
   * Stop the transport
   */
  async stop() {
    if (!this.connected || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      // Close all connections
      for (const [connectionId, res] of this.connections) {
        res.end();
      }
      this.connections.clear();

      // Close server
      this.server.close(() => {
        this.connected = false;
        this.log('info', 'SSE transport stopped');
        this.emit('close');
        resolve();
      });
    });
  }

  /**
   * Send message to specific connection
   *
   * @param {string} connectionId - Connection ID
   * @param {Object} message - JSON-RPC message
   */
  send(connectionId, message) {
    const res = this.connections.get(connectionId);

    if (!res) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    try {
      const serialized = JSON.stringify(message);

      // Send as SSE event
      res.write(`data: ${serialized}\n\n`);

      this.log('debug', 'Sent SSE message', { connectionId, messageId: message.id });

    } catch (error) {
      this.log('error', 'Failed to send SSE message', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle HTTP request
   *
   * @private
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   */
  _handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/mcp/sse') {
      // SSE endpoint
      this._handleSSEConnection(req, res);
    } else if (url.pathname === '/mcp/rpc' && req.method === 'POST') {
      // RPC endpoint (for requests)
      this._handleRPCRequest(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }

  /**
   * Handle SSE connection
   *
   * @private
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   */
  _handleSSEConnection(req, res) {
    const connectionId = this._generateConnectionId();

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Store connection
    this.connections.set(connectionId, res);

    this.log('info', 'SSE connection established', { connectionId });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`);

    // Handle connection close
    req.on('close', () => {
      this.connections.delete(connectionId);
      this.log('info', 'SSE connection closed', { connectionId });
    });
  }

  /**
   * Handle RPC request
   *
   * @private
   * @param {Object} req - HTTP request
   * @param {Object} res - HTTP response
   */
  async _handleRPCRequest(req, res) {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const message = JSON.parse(body);

        this.log('debug', 'Received RPC request', { messageId: message.id });

        // Emit message event
        this.emit('message', message);

        // Send acknowledgment
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));

      } catch (error) {
        this.log('error', 'Failed to parse RPC request', { error: error.message });

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
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
   * Log message to stderr
   *
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   */
  log(level, message, data = {}) {
    // Check log level
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) {
      return;
    }

    logToStderr(level, `[SSETransport] ${message}`, data);
  }
}

/**
 * Create transport based on configuration
 *
 * @param {Object} config - Transport configuration
 * @param {string} config.type - Transport type ('stdio' or 'sse')
 * @param {Object} config.options - Transport options
 * @returns {StdioTransport|SSETransport} Transport instance
 */
export function createTransport(config = {}) {
  const type = config.type || 'stdio';

  if (type === 'stdio') {
    return new StdioTransport(config.options);
  } else if (type === 'sse') {
    return new SSETransport(config.options);
  } else {
    throw new Error(`Unknown transport type: ${type}`);
  }
}

export default { StdioTransport, SSETransport, createTransport };
