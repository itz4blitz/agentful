import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPClient } from '../../client/mcp-client.js';
import http from 'http';

/**
 * MCP Client Tests
 *
 * Tests the MCP client for remote server communication:
 * - Connection management
 * - Request/response handling
 * - Timeout handling
 * - Reconnection logic
 * - OAuth token management
 */
describe('MCPClient', () => {
  let mockServer;
  let serverPort;
  let serverUrl;

  beforeEach(async () => {
    // Start a mock HTTP server
    serverPort = 3838 + Math.floor(Math.random() * 1000);
    serverUrl = `http://localhost:${serverPort}`;

    mockServer = await createMockMCPServer(serverPort);
  });

  afterEach(async () => {
    if (mockServer) {
      await closeMockServer(mockServer);
    }
  });

  describe('Client Initialization', () => {
    it('should create client with required options', () => {
      const client = new MCPClient({
        serverId: 'test-server',
        baseUrl: serverUrl
      });

      expect(client.serverId).toBe('test-server');
      expect(client.baseUrl).toBe(serverUrl);
      expect(client.connected).toBe(false);
    });

    it('should throw error if baseUrl is missing', () => {
      expect(() => {
        new MCPClient({ serverId: 'test' });
      }).toThrow('baseUrl is required');
    });

    it('should use default timeout if not specified', () => {
      const client = new MCPClient({
        baseUrl: serverUrl
      });

      expect(client.timeout).toBe(10000); // 10 seconds
    });

    it('should use custom timeout if specified', () => {
      const client = new MCPClient({
        baseUrl: serverUrl,
        timeout: 5000
      });

      expect(client.timeout).toBe(5000);
    });
  });

  describe('Connection Management', () => {
    it('should connect to server', async () => {
      const client = new MCPClient({
        baseUrl: serverUrl,
        timeout: 5000
      });

      await client.connect();

      expect(client.connected).toBe(true);
      expect(client.eventSource).toBeDefined();

      client.disconnect();
    });

    it('should handle connection failure', async () => {
      const client = new MCPClient({
        baseUrl: 'http://localhost:9999', // Non-existent server
        timeout: 1000
      });

      await expect(client.connect()).rejects.toThrow();
      expect(client.connected).toBe(false);
    });

    it('should disconnect from server', async () => {
      const client = new MCPClient({
        baseUrl: serverUrl,
        timeout: 5000
      });

      await client.connect();
      client.disconnect();

      expect(client.connected).toBe(false);
      expect(client.eventSource).toBeNull();
    });

    it('should emit connected event on successful connection', async () => {
      const client = new MCPClient({
        baseUrl: serverUrl,
        timeout: 5000
      });

      const connectedPromise = new Promise((resolve) => {
        client.once('connected', resolve);
      });

      await client.connect();
      await connectedPromise;

      expect(client.connected).toBe(true);

      client.disconnect();
    });

    it('should emit disconnected event on disconnect', async () => {
      const client = new MCPClient({
        baseUrl: serverUrl,
        timeout: 5000
      });

      await client.connect();

      const disconnectedPromise = new Promise((resolve) => {
        client.once('disconnected', resolve);
      });

      client.disconnect();
      await disconnectedPromise;
    });
  });

  describe('Health Check', () => {
    it('should ping server successfully', async () => {
      const client = new MCPClient({
        baseUrl: serverUrl,
        timeout: 5000
      });

      const result = await client.ping();
      expect(result).toBe(true);
    });

    it('should return false for unreachable server', async () => {
      const client = new MCPClient({
        baseUrl: 'http://localhost:9999',
        timeout: 1000
      });

      const result = await client.ping();
      expect(result).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should track client statistics', async () => {
      const client = new MCPClient({
        serverId: 'test-server',
        baseUrl: serverUrl,
        timeout: 5000
      });

      const stats = client.getStats();

      expect(stats).toHaveProperty('serverId', 'test-server');
      expect(stats).toHaveProperty('connected', false);
      expect(stats).toHaveProperty('pendingRequests', 0);
      expect(stats).toHaveProperty('requestsSent', 0);
      expect(stats).toHaveProperty('responsesReceived', 0);
      expect(stats).toHaveProperty('errors', 0);
    });
  });

  describe('OAuth Token Management', () => {
    it('should include auth token in requests', async () => {
      const authToken = 'test-token-123';
      const client = new MCPClient({
        baseUrl: serverUrl,
        authToken,
        timeout: 5000
      });

      expect(client.authToken).toBe(authToken);

      const headers = client._getHeaders();
      expect(headers['Authorization']).toBe(`Bearer ${authToken}`);
    });

    it('should not include auth header if no token provided', () => {
      const client = new MCPClient({
        baseUrl: serverUrl
      });

      const headers = client._getHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });
});

/**
 * Create a mock MCP server for testing
 */
async function createMockMCPServer(port) {
  return new Promise((resolve, reject) => {
    const connections = new Set();

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);

      // Health check endpoint
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }

      // SSE endpoint
      if (url.pathname === '/mcp/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        connections.add(res);

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: 'connected', connectionId: 'test-conn' })}\n\n`);

        req.on('close', () => {
          connections.delete(res);
        });

        return;
      }

      // RPC endpoint
      if (url.pathname === '/mcp/rpc' && req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const request = JSON.parse(body);

            // Send response via SSE to all connections
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: { success: true, data: 'mock-result' }
            };

            for (const conn of connections) {
              conn.write(`data: ${JSON.stringify(response)}\n\n`);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true }));

          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });

        return;
      }

      // Not found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(port, () => {
      server.connections = connections;
      resolve(server);
    });

    server.on('error', reject);
  });
}

/**
 * Close mock server
 */
async function closeMockServer(server) {
  return new Promise((resolve) => {
    // Close all connections
    if (server.connections) {
      for (const conn of server.connections) {
        conn.end();
      }
    }

    server.close(() => {
      resolve();
    });
  });
}
