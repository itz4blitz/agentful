/**
 * MCP Client
 *
 * Connects to remote MCP server via HTTP/SSE and sends JSON-RPC requests.
 * Handles OAuth token management, reconnection logic, and timeout handling.
 *
 * @module mcp/client/mcp-client
 */

import { EventEmitter } from 'events';
import EventSource from 'eventsource';

/**
 * MCP Client for remote server communication
 */
export class MCPClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.serverId = options.serverId || `server-${Date.now()}`;
    this.baseUrl = options.baseUrl;
    this.authToken = options.authToken;
    this.timeout = options.timeout || 10000; // 10 seconds
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;

    if (!this.baseUrl) {
      throw new Error('baseUrl is required');
    }

    this.eventSource = null;
    this.connected = false;
    this.connecting = false;
    this.pendingRequests = new Map(); // requestId -> { resolve, reject, timeout }
    this.requestId = 0;
    this.connectionAttempts = 0;
    this.lastError = null;
    this.stats = {
      requestsSent: 0,
      responsesReceived: 0,
      errors: 0,
      reconnections: 0
    };
  }

  /**
   * Connect to the remote MCP server
   *
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.connected) {
      return;
    }

    if (this.connecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const onConnect = () => {
          this.off('connected', onConnect);
          this.off('error', onError);
          resolve();
        };
        const onError = (error) => {
          this.off('connected', onConnect);
          this.off('error', onError);
          reject(error);
        };
        this.once('connected', onConnect);
        this.once('error', onError);
      });
    }

    this.connecting = true;

    try {
      await this._connectSSE();
      this.connected = true;
      this.connecting = false;
      this.connectionAttempts = 0;
      this.lastError = null;
      this.emit('connected');
    } catch (error) {
      this.connecting = false;
      this.lastError = error;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from the remote MCP server
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client disconnected'));
    }
    this.pendingRequests.clear();

    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * Call a tool on the remote MCP server
   *
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool result
   */
  async callTool(toolName, args = {}) {
    if (!this.connected) {
      await this.connect();
    }

    const request = {
      jsonrpc: '2.0',
      id: this._generateRequestId(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    return this._sendRequest(request);
  }

  /**
   * Read a resource from the remote MCP server
   *
   * @param {string} uri - Resource URI
   * @returns {Promise<Object>} Resource contents
   */
  async readResource(uri) {
    if (!this.connected) {
      await this.connect();
    }

    const request = {
      jsonrpc: '2.0',
      id: this._generateRequestId(),
      method: 'resources/read',
      params: { uri }
    };

    return this._sendRequest(request);
  }

  /**
   * List available tools on the remote MCP server
   *
   * @returns {Promise<Array>} List of tools
   */
  async listTools() {
    if (!this.connected) {
      await this.connect();
    }

    const request = {
      jsonrpc: '2.0',
      id: this._generateRequestId(),
      method: 'tools/list',
      params: {}
    };

    const response = await this._sendRequest(request);
    return response.tools || [];
  }

  /**
   * List available resources on the remote MCP server
   *
   * @returns {Promise<Array>} List of resources
   */
  async listResources() {
    if (!this.connected) {
      await this.connect();
    }

    const request = {
      jsonrpc: '2.0',
      id: this._generateRequestId(),
      method: 'resources/list',
      params: {}
    };

    const response = await this._sendRequest(request);
    return response.resources || [];
  }

  /**
   * Ping the server to check connectivity
   *
   * @returns {Promise<boolean>} True if server is reachable
   */
  async ping() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this._getHeaders(),
        signal: AbortSignal.timeout(this.timeout)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get client statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      serverId: this.serverId,
      connected: this.connected,
      pendingRequests: this.pendingRequests.size,
      ...this.stats,
      lastError: this.lastError?.message
    };
  }

  /**
   * Connect to SSE endpoint
   *
   * @private
   */
  async _connectSSE() {
    return new Promise((resolve, reject) => {
      const sseUrl = `${this.baseUrl}/mcp/sse`;
      const headers = this._getHeaders();

      this.eventSource = new EventSource(sseUrl, { headers });

      const onOpen = () => {
        this.eventSource.removeListener('open', onOpen);
        this.eventSource.removeListener('error', onError);
        resolve();
      };

      const onError = (error) => {
        this.eventSource.removeListener('open', onOpen);
        this.eventSource.removeListener('error', onError);
        this.eventSource.close();
        this.eventSource = null;
        reject(new Error(`SSE connection failed: ${error.message || 'Unknown error'}`));
      };

      this.eventSource.addEventListener('open', onOpen);
      this.eventSource.addEventListener('error', onError);

      // Listen for messages
      this.eventSource.addEventListener('message', (event) => {
        this._handleSSEMessage(event);
      });

      // Handle connection close
      this.eventSource.addEventListener('error', () => {
        if (this.connected) {
          this.connected = false;
          this.emit('disconnected');
          this._attemptReconnection();
        }
      });
    });
  }

  /**
   * Handle SSE message
   *
   * @private
   * @param {Object} event - SSE event
   */
  _handleSSEMessage(event) {
    try {
      const message = JSON.parse(event.data);

      // Handle connection event
      if (message.type === 'connected') {
        return;
      }

      // Handle JSON-RPC response
      if (message.jsonrpc === '2.0' && message.id !== undefined) {
        this._handleResponse(message);
      }

      // Emit notification events
      if (message.method) {
        this.emit('notification', message);
      }

    } catch (error) {
      this.emit('error', new Error(`Failed to parse SSE message: ${error.message}`));
    }
  }

  /**
   * Send JSON-RPC request
   *
   * @private
   * @param {Object} request - JSON-RPC request
   * @returns {Promise<Object>} Response result
   */
  async _sendRequest(request) {
    this.stats.requestsSent++;

    return new Promise(async (resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        this.stats.errors++;
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);

      // Store pending request
      this.pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout: timeoutId
      });

      try {
        // Send request via HTTP POST
        const response = await fetch(`${this.baseUrl}/mcp/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this._getHeaders()
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Response will come via SSE
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(request.id);
        this.stats.errors++;
        reject(error);
      }
    });
  }

  /**
   * Handle JSON-RPC response
   *
   * @private
   * @param {Object} response - JSON-RPC response
   */
  _handleResponse(response) {
    const pending = this.pendingRequests.get(response.id);

    if (!pending) {
      return; // Unexpected response
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);
    this.stats.responsesReceived++;

    if (response.error) {
      const error = new Error(response.error.message || 'RPC Error');
      error.code = response.error.code;
      error.data = response.error.data;
      this.stats.errors++;
      pending.reject(error);
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Attempt to reconnect to the server
   *
   * @private
   */
  async _attemptReconnection() {
    if (this.connecting || this.connected) {
      return;
    }

    this.connectionAttempts++;

    if (this.connectionAttempts > this.retryAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    // Exponential backoff
    const delay = this.retryDelay * Math.pow(2, this.connectionAttempts - 1);

    setTimeout(async () => {
      try {
        await this.connect();
        this.stats.reconnections++;
        this.emit('reconnected');
      } catch (error) {
        // Will retry automatically if under max attempts
      }
    }, delay);
  }

  /**
   * Generate unique request ID
   *
   * @private
   * @returns {number} Request ID
   */
  _generateRequestId() {
    return ++this.requestId;
  }

  /**
   * Get HTTP headers with auth token
   *
   * @private
   * @returns {Object} Headers
   */
  _getHeaders() {
    const headers = {};

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }
}

export default MCPClient;
