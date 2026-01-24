import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SSETransport } from '../../../core/transport.js';
import http from 'http';

/**
 * SSETransport Unit Tests
 *
 * Tests the Server-Sent Events transport implementation:
 * - HTTP server lifecycle
 * - SSE connection management
 * - RPC request handling
 * - Multiple concurrent connections
 */
describe('SSETransport', () => {
  let transport;
  const testPort = 9876 + Math.floor(Math.random() * 100); // Random port to avoid conflicts

  beforeEach(() => {
    transport = new SSETransport({
      port: testPort,
      host: 'localhost',
      logLevel: 'error'
    });
  });

  afterEach(async () => {
    if (transport && transport.connected) {
      await transport.stop();
    }
  });

  describe('Initialization', () => {
    it('should create transport with default options', () => {
      const defaultTransport = new SSETransport();
      expect(defaultTransport.port).toBe(3000);
      expect(defaultTransport.host).toBe('localhost');
    });

    it('should create transport with custom options', () => {
      expect(transport.port).toBe(testPort);
      expect(transport.host).toBe('localhost');
    });

    it('should initialize with disconnected state', () => {
      expect(transport.connected).toBe(false);
    });

    it('should initialize empty connections map', () => {
      expect(transport.connections.size).toBe(0);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start HTTP server successfully', async () => {
      await transport.start();
      expect(transport.connected).toBe(true);
      expect(transport.server).toBeDefined();
    });

    it('should listen on correct port', async () => {
      await transport.start();
      const address = transport.server.address();
      expect(address.port).toBe(testPort);
    });

    it('should throw if starting already connected transport', async () => {
      await transport.start();
      await expect(transport.start()).rejects.toThrow('Transport already started');
    });

    it('should stop server successfully', async () => {
      await transport.start();
      await transport.stop();
      expect(transport.connected).toBe(false);
    });

    it('should emit close event on stop', async () => {
      await transport.start();

      const closePromise = new Promise(resolve => {
        transport.once('close', resolve);
      });

      await transport.stop();
      await closePromise;
    });

    it('should handle port already in use', async () => {
      await transport.start();

      // Try to start another transport on same port
      const transport2 = new SSETransport({ port: testPort });
      await expect(transport2.start()).rejects.toThrow();
    });
  });

  describe('SSE Connection Management', () => {
    beforeEach(async () => {
      await transport.start();
    });

    it('should accept SSE connection', async () => {
      const connectionPromise = new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET',
          headers: { 'Accept': 'text/event-stream' }
        });

        req.on('response', (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toBe('text/event-stream');

          res.on('data', (chunk) => {
            const data = chunk.toString();
            if (data.includes('connected')) {
              resolve();
              req.destroy();
            }
          });
        });

        req.end();
      });

      await connectionPromise;
      expect(transport.connections.size).toBe(1);
    });

    it('should generate unique connection IDs', async () => {
      const ids = new Set();

      for (let i = 0; i < 3; i++) {
        const id = transport._generateConnectionId();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });

    it('should send initial connection event', async () => {
      const dataPromise = new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });

        req.on('response', (res) => {
          res.on('data', (chunk) => {
            const data = chunk.toString();
            const match = data.match(/data: ({.*})/);
            if (match) {
              const event = JSON.parse(match[1]);
              expect(event.type).toBe('connected');
              expect(event.connectionId).toBeDefined();
              resolve();
              req.destroy();
            }
          });
        });

        req.end();
      });

      await dataPromise;
    });

    it('should handle connection close', async () => {
      let connectionId;

      await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });

        req.on('response', (res) => {
          res.on('data', (chunk) => {
            const data = chunk.toString();
            const match = data.match(/data: ({.*})/);
            if (match) {
              const event = JSON.parse(match[1]);
              connectionId = event.connectionId;
              expect(transport.connections.has(connectionId)).toBe(true);

              req.destroy(); // Close connection

              setTimeout(() => {
                expect(transport.connections.has(connectionId)).toBe(false);
                resolve();
              }, 50);
            }
          });
        });

        req.end();
      });
    });

    it('should handle multiple concurrent connections', async () => {
      const connections = 5;
      const promises = [];

      for (let i = 0; i < connections; i++) {
        const promise = new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: testPort,
            path: '/mcp/sse',
            method: 'GET'
          });

          req.on('response', (res) => {
            res.once('data', () => {
              resolve();
            });
          });

          req.end();
        });

        promises.push(promise);
      }

      await Promise.all(promises);
      expect(transport.connections.size).toBe(connections);
    });
  });

  describe('Message Sending', () => {
    let connectionId;

    beforeEach(async () => {
      await transport.start();

      // Establish connection and get ID
      connectionId = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });

        req.on('response', (res) => {
          res.on('data', (chunk) => {
            const data = chunk.toString();
            const match = data.match(/data: ({.*})/);
            if (match) {
              const event = JSON.parse(match[1]);
              resolve(event.connectionId);
            }
          });
        });

        req.end();
      });
    });

    it('should send message to specific connection', async () => {
      const messagePromise = new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });

        let receivedConnectionEvent = false;

        req.on('response', (res) => {
          res.on('data', (chunk) => {
            const data = chunk.toString();

            if (!receivedConnectionEvent) {
              receivedConnectionEvent = true;
              const match = data.match(/data: ({.*})/);
              const event = JSON.parse(match[1]);
              const connId = event.connectionId;

              // Send test message
              const testMessage = { jsonrpc: '2.0', id: 1, method: 'test' };
              transport.send(connId, testMessage);

            } else {
              const match = data.match(/data: ({.*})/);
              if (match) {
                const message = JSON.parse(match[1]);
                expect(message.jsonrpc).toBe('2.0');
                expect(message.method).toBe('test');
                resolve();
                req.destroy();
              }
            }
          });
        });

        req.end();
      });

      await messagePromise;
    });

    it('should throw if sending to non-existent connection', () => {
      expect(() => {
        transport.send('invalid-connection-id', { jsonrpc: '2.0' });
      }).toThrow('Connection not found');
    });

    it('should format message as SSE event', async () => {
      const messagePromise = new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });

        let receivedConnectionEvent = false;

        req.on('response', (res) => {
          res.on('data', (chunk) => {
            if (!receivedConnectionEvent) {
              receivedConnectionEvent = true;
              const data = chunk.toString();
              const match = data.match(/data: ({.*})/);
              const event = JSON.parse(match[1]);

              transport.send(event.connectionId, { test: 'message' });
            } else {
              const data = chunk.toString();
              expect(data).toMatch(/^data: {.*}\n\n$/);
              resolve();
              req.destroy();
            }
          });
        });

        req.end();
      });

      await messagePromise;
    });
  });

  describe('RPC Request Handling', () => {
    beforeEach(async () => {
      await transport.start();
    });

    it('should handle POST request to /mcp/rpc', async () => {
      const messagePromise = new Promise(resolve => {
        transport.once('message', resolve);
      });

      const testMessage = { jsonrpc: '2.0', id: 1, method: 'test', params: {} };

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/rpc',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(testMessage))
          }
        }, (res) => {
          expect(res.statusCode).toBe(200);

          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            const response = JSON.parse(body);
            expect(response.received).toBe(true);
            resolve();
          });
        });

        req.on('error', reject);
        req.write(JSON.stringify(testMessage));
        req.end();
      });

      const receivedMessage = await messagePromise;
      expect(receivedMessage).toEqual(testMessage);
    });

    it('should reject invalid JSON in RPC request', async () => {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/rpc',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (res) => {
          expect(res.statusCode).toBe(400);

          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            const response = JSON.parse(body);
            expect(response.error).toBe('Invalid JSON');
            resolve();
          });
        });

        req.on('error', reject);
        req.write('invalid json');
        req.end();
      });
    });

    it('should emit message event for valid RPC request', async () => {
      const messages = [];
      transport.on('message', msg => messages.push(msg));

      const testMessages = [
        { jsonrpc: '2.0', id: 1, method: 'test1', params: {} },
        { jsonrpc: '2.0', id: 2, method: 'test2', params: {} }
      ];

      for (const msg of testMessages) {
        await new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: testPort,
            path: '/mcp/rpc',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(JSON.stringify(msg))
            }
          }, () => resolve());

          req.write(JSON.stringify(msg));
          req.end();
        });
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(testMessages[0]);
      expect(messages[1]).toEqual(testMessages[1]);
    });
  });

  describe('HTTP Routing', () => {
    beforeEach(async () => {
      await transport.start();
    });

    it('should return 404 for unknown paths', async () => {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/unknown',
          method: 'GET'
        }, (res) => {
          expect(res.statusCode).toBe(404);
          resolve();
        });

        req.on('error', reject);
        req.end();
      });
    });

    it('should set CORS headers for SSE', async () => {
      await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        }, (res) => {
          expect(res.headers['access-control-allow-origin']).toBe('*');
          expect(res.headers['cache-control']).toBe('no-cache');
          expect(res.headers['connection']).toBe('keep-alive');
          resolve();
          req.destroy();
        });

        req.end();
      });
    });
  });

  describe('Cleanup on Stop', () => {
    it('should close all connections on stop', async () => {
      await transport.start();

      // Establish multiple connections
      const connections = [];
      for (let i = 0; i < 3; i++) {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });
        req.end();
        connections.push(req);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(transport.connections.size).toBeGreaterThan(0);

      await transport.stop();
      expect(transport.connections.size).toBe(0);
    });

    it('should reject operations after stop', async () => {
      await transport.start();
      await transport.stop();

      expect(() => {
        transport.send('any-id', { test: 'message' });
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      await transport.start();

      const errorPromise = new Promise((resolve) => {
        transport.server.once('error', resolve);
      });

      // Trigger a server error (this is test-specific)
      transport.server.emit('error', new Error('Test server error'));

      await errorPromise;
      expect(transport.connected).toBe(true); // Should stay connected
    });

    it('should handle client disconnect during send', async () => {
      await transport.start();

      const connectionId = await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: testPort,
          path: '/mcp/sse',
          method: 'GET'
        });

        req.on('response', (res) => {
          res.on('data', (chunk) => {
            const data = chunk.toString();
            const match = data.match(/data: ({.*})/);
            if (match) {
              const event = JSON.parse(match[1]);
              resolve(event.connectionId);
              req.destroy(); // Disconnect immediately
            }
          });
        });

        req.end();
      });

      // Wait for disconnect to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to send to disconnected client
      expect(() => {
        transport.send(connectionId, { test: 'message' });
      }).toThrow('Connection not found');
    });
  });

  describe('Logging', () => {
    it('should log connection events', async () => {
      const transport = new SSETransport({
        port: testPort + 1,
        logLevel: 'info'
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await transport.start();

      // Should log server start
      expect(consoleErrorSpy).toHaveBeenCalled();

      await transport.stop();
      consoleErrorSpy.mockRestore();
    });

    it('should respect log level', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transport.log('debug', 'Debug message');
      transport.log('error', 'Error message');

      // Only error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });
  });
});
