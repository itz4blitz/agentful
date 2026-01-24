/**
 * SSE Transport Tests
 *
 * Tests for Server-Sent Events transport.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SSETransport } from '../../core/sse-transport.js';
import EventSource from 'eventsource';

describe('SSETransport', () => {
  let transport;

  afterEach(async () => {
    if (transport) {
      await transport.stop();
      transport = null;
    }
  });

  describe('Constructor', () => {
    it('should create transport with default options', () => {
      transport = new SSETransport();

      expect(transport.port).toBe(3838);
      expect(transport.host).toBe('localhost');
      expect(transport.logLevel).toBe('info');
      expect(transport.connected).toBe(false);
      expect(transport.heartbeatInterval).toBe(30000);
    });

    it('should create transport with custom options', () => {
      transport = new SSETransport({
        port: 4000,
        host: '0.0.0.0',
        logLevel: 'debug',
        heartbeatInterval: 60000,
        compression: false
      });

      expect(transport.port).toBe(4000);
      expect(transport.host).toBe('0.0.0.0');
      expect(transport.logLevel).toBe('debug');
      expect(transport.heartbeatInterval).toBe(60000);
      expect(transport.compression).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop server', async () => {
      transport = new SSETransport({ port: 3850 });

      await transport.start();
      expect(transport.connected).toBe(true);

      await transport.stop();
      expect(transport.connected).toBe(false);
    });

    it('should throw error if starting already started transport', async () => {
      transport = new SSETransport({ port: 3851 });
      await transport.start();

      await expect(transport.start()).rejects.toThrow('Transport already started');
    });

    it('should emit close event on stop', async () => {
      transport = new SSETransport({ port: 3852 });
      await transport.start();

      const closePromise = new Promise((resolve) => {
        transport.once('close', resolve);
      });

      await transport.stop();
      await closePromise;
    });
  });

  describe('Health Check', () => {
    it('should respond to health check with connection count', async () => {
      transport = new SSETransport({ port: 3853 });
      await transport.start();

      const response = await fetch('http://localhost:3853/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.transport).toBe('sse');
      expect(data.connections).toBe(0);
      expect(data.uptime).toBeTypeOf('number');
    });
  });

  describe('SSE Connection', () => {
    beforeEach(async () => {
      transport = new SSETransport({ port: 3854, logLevel: 'error', heartbeatInterval: 1000 });
      await transport.start();
    });

    it('should establish SSE connection', async () => {
      const connectionPromise = new Promise((resolve) => {
        transport.once('connection', resolve);
      });

      const eventSource = new EventSource('http://localhost:3854/mcp/sse');

      const connectedPromise = new Promise((resolve) => {
        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          resolve(data);
        });
      });

      const connectionId = await connectionPromise;
      const connectedData = await connectedPromise;

      expect(connectionId).toBeTruthy();
      expect(connectedData.connectionId).toBe(connectionId);

      eventSource.close();
    });

    it('should track connection count', async () => {
      const eventSource1 = new EventSource('http://localhost:3854/mcp/sse');
      const eventSource2 = new EventSource('http://localhost:3854/mcp/sse');

      // Wait for connections
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(transport.getConnectionCount()).toBe(2);
      expect(transport.getConnectionIds()).toHaveLength(2);

      eventSource1.close();
      eventSource2.close();
    });

    it('should send heartbeat events', async () => {
      const eventSource = new EventSource('http://localhost:3854/mcp/sse');

      const heartbeatPromise = new Promise((resolve) => {
        eventSource.addEventListener('heartbeat', (event) => {
          const data = JSON.parse(event.data);
          resolve(data);
        });
      });

      const heartbeatData = await heartbeatPromise;
      expect(heartbeatData.timestamp).toBeTruthy();

      eventSource.close();
    }, 10000);

    it('should handle connection close', async () => {
      const closePromise = new Promise((resolve) => {
        transport.once('connectionClosed', resolve);
      });

      const eventSource = new EventSource('http://localhost:3854/mcp/sse');

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 100));

      eventSource.close();

      const connectionId = await closePromise;
      expect(connectionId).toBeTruthy();
    });
  });

  describe('RPC Handling', () => {
    beforeEach(async () => {
      transport = new SSETransport({ port: 3855, logLevel: 'error' });
      await transport.start();
    });

    it('should handle valid JSON-RPC request', async () => {
      const requestPromise = new Promise((resolve) => {
        transport.once('message', (message) => {
          resolve(message);
        });
      });

      const response = await fetch('http://localhost:3855/mcp/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Connection-Id': 'test-conn-123'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'test/method',
          params: { foo: 'bar' },
          id: 1
        })
      });

      const request = await requestPromise;
      expect(request.method).toBe('test/method');
      expect(request.params).toEqual({ foo: 'bar' });

      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.result).toEqual({ received: true });
    });

    it('should reject invalid JSON-RPC version', async () => {
      const response = await fetch('http://localhost:3855/mcp/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '1.0',
          method: 'test/method',
          id: 1
        })
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32600);
    });
  });

  describe('Message Broadcasting', () => {
    beforeEach(async () => {
      transport = new SSETransport({ port: 3856, logLevel: 'error' });
      await transport.start();
    });

    it('should send message to specific connection', async () => {
      const eventSource = new EventSource('http://localhost:3856/mcp/sse');

      const connectedPromise = new Promise((resolve) => {
        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          resolve(data.connectionId);
        });
      });

      const connectionId = await connectedPromise;

      const messagePromise = new Promise((resolve) => {
        eventSource.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          resolve(data);
        });
      });

      transport.send(connectionId, {
        jsonrpc: '2.0',
        method: 'notification',
        params: { test: 'data' }
      });

      const message = await messagePromise;
      expect(message.method).toBe('notification');
      expect(message.params).toEqual({ test: 'data' });

      eventSource.close();
    });

    it('should broadcast to all connections', async () => {
      const eventSource1 = new EventSource('http://localhost:3856/mcp/sse');
      const eventSource2 = new EventSource('http://localhost:3856/mcp/sse');

      // Wait for connections
      await new Promise((resolve) => setTimeout(resolve, 100));

      const messages = [];
      const messagePromise = new Promise((resolve) => {
        let count = 0;
        const handler = (event) => {
          messages.push(JSON.parse(event.data));
          count++;
          if (count === 2) resolve();
        };

        eventSource1.addEventListener('message', handler);
        eventSource2.addEventListener('message', handler);
      });

      transport.broadcast({
        jsonrpc: '2.0',
        method: 'broadcast',
        params: { test: 'broadcast' }
      });

      await messagePromise;

      expect(messages).toHaveLength(2);
      expect(messages[0].method).toBe('broadcast');
      expect(messages[1].method).toBe('broadcast');

      eventSource1.close();
      eventSource2.close();
    });

    it('should throw error for non-existent connection', () => {
      expect(() => {
        transport.send('invalid-conn-id', { jsonrpc: '2.0', method: 'test' });
      }).toThrow('Connection not found');
    });
  });

  describe('Response Methods', () => {
    beforeEach(async () => {
      transport = new SSETransport({ port: 3857, logLevel: 'error' });
      await transport.start();
    });

    it('should send response to specific connection', async () => {
      const eventSource = new EventSource('http://localhost:3857/mcp/sse');

      const connectedPromise = new Promise((resolve) => {
        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          resolve(data.connectionId);
        });
      });

      const connectionId = await connectedPromise;

      const messagePromise = new Promise((resolve) => {
        eventSource.addEventListener('message', (event) => {
          resolve(JSON.parse(event.data));
        });
      });

      transport.sendResponse(1, { success: true }, connectionId);

      const response = await messagePromise;
      expect(response.id).toBe(1);
      expect(response.result).toEqual({ success: true });

      eventSource.close();
    });

    it('should send error to specific connection', async () => {
      const eventSource = new EventSource('http://localhost:3857/mcp/sse');

      const connectedPromise = new Promise((resolve) => {
        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          resolve(data.connectionId);
        });
      });

      const connectionId = await connectedPromise;

      const messagePromise = new Promise((resolve) => {
        eventSource.addEventListener('message', (event) => {
          resolve(JSON.parse(event.data));
        });
      });

      transport.sendError(1, -32001, 'Test error', { detail: 'test' }, connectionId);

      const error = await messagePromise;
      expect(error.id).toBe(1);
      expect(error.error.code).toBe(-32001);
      expect(error.error.message).toBe('Test error');

      eventSource.close();
    });

    it('should send notification', async () => {
      const eventSource = new EventSource('http://localhost:3857/mcp/sse');

      const connectedPromise = new Promise((resolve) => {
        eventSource.addEventListener('connected', (event) => {
          const data = JSON.parse(event.data);
          resolve(data.connectionId);
        });
      });

      const connectionId = await connectedPromise;

      const messagePromise = new Promise((resolve) => {
        eventSource.addEventListener('message', (event) => {
          resolve(JSON.parse(event.data));
        });
      });

      transport.sendNotification('test/notification', { data: 'test' }, connectionId);

      const notification = await messagePromise;
      expect(notification.method).toBe('test/notification');
      expect(notification.params).toEqual({ data: 'test' });
      expect(notification.id).toBeUndefined();

      eventSource.close();
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown paths', async () => {
      transport = new SSETransport({ port: 3858, logLevel: 'error' });
      await transport.start();

      const response = await fetch('http://localhost:3858/unknown');

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Not Found');
    });
  });

  describe('Logging', () => {
    it('should respect log level', () => {
      transport = new SSETransport({ logLevel: 'error' });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transport.log('debug', 'Debug message');
      expect(spy).not.toHaveBeenCalled();

      transport.log('error', 'Error message');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });
  });
});
