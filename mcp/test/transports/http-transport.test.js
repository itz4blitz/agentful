/**
 * HTTP Transport Tests
 *
 * Tests for HTTP-based JSON-RPC transport.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HttpTransport } from '../../core/http-transport.js';

describe('HttpTransport', () => {
  let transport;

  afterEach(async () => {
    if (transport) {
      await transport.stop();
      transport = null;
    }
  });

  describe('Constructor', () => {
    it('should create transport with default options', () => {
      transport = new HttpTransport();

      expect(transport.port).toBe(3838);
      expect(transport.host).toBe('localhost');
      expect(transport.logLevel).toBe('info');
      expect(transport.connected).toBe(false);
    });

    it('should create transport with custom options', () => {
      transport = new HttpTransport({
        port: 4000,
        host: '0.0.0.0',
        logLevel: 'debug',
        compression: false,
        helmet: false
      });

      expect(transport.port).toBe(4000);
      expect(transport.host).toBe('0.0.0.0');
      expect(transport.logLevel).toBe('debug');
      expect(transport.compression).toBe(false);
      expect(transport.helmet).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop server', async () => {
      transport = new HttpTransport({ port: 3839 });

      await transport.start();
      expect(transport.connected).toBe(true);

      await transport.stop();
      expect(transport.connected).toBe(false);
    });

    it('should throw error if starting already started transport', async () => {
      transport = new HttpTransport({ port: 3840 });
      await transport.start();

      await expect(transport.start()).rejects.toThrow('Transport already started');
    });

    it('should emit close event on stop', async () => {
      transport = new HttpTransport({ port: 3841 });
      await transport.start();

      const closePromise = new Promise((resolve) => {
        transport.once('close', resolve);
      });

      await transport.stop();
      await closePromise;
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      transport = new HttpTransport({ port: 3842 });
      await transport.start();

      const response = await fetch('http://localhost:3842/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.transport).toBe('http');
      expect(data.uptime).toBeTypeOf('number');
    });
  });

  describe('JSON-RPC Handling', () => {
    beforeEach(async () => {
      transport = new HttpTransport({ port: 3843, logLevel: 'error' });
      await transport.start();
    });

    it('should handle valid JSON-RPC request', async () => {
      const requestPromise = new Promise((resolve) => {
        transport.once('message', (message) => {
          resolve(message);
          transport.sendResponse(message.id, { success: true });
        });
      });

      const response = await fetch('http://localhost:3843/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      expect(data.id).toBe(1);
      expect(data.result).toEqual({ success: true });
    });

    it('should reject invalid JSON-RPC version', async () => {
      const response = await fetch('http://localhost:3843/mcp', {
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

    it('should handle missing method', async () => {
      const response = await fetch('http://localhost:3843/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1
        })
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32600);
    });

    it('should handle invalid JSON', async () => {
      const response = await fetch('http://localhost:3843/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      transport = new HttpTransport({ port: 3844, logLevel: 'error' });
      await transport.start();
    });

    it('should send error response', async () => {
      const errorPromise = new Promise((resolve) => {
        transport.once('message', (message) => {
          transport.sendError(message.id, -32001, 'Custom error', { detail: 'test' });
          resolve();
        });
      });

      const response = await fetch('http://localhost:3844/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'test/error',
          id: 1
        })
      });

      await errorPromise;

      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32001);
      expect(data.error.message).toBe('Custom error');
      expect(data.error.data).toEqual({ detail: 'test' });
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight', async () => {
      transport = new HttpTransport({ port: 3845, logLevel: 'error' });
      await transport.start();

      const response = await fetch('http://localhost:3845/mcp', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://example.com',
          'Access-Control-Request-Method': 'POST'
        }
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown paths', async () => {
      transport = new HttpTransport({ port: 3846, logLevel: 'error' });
      await transport.start();

      const response = await fetch('http://localhost:3846/unknown');

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Not Found');
    });
  });

  describe('Logging', () => {
    it('should respect log level', () => {
      transport = new HttpTransport({ logLevel: 'error' });

      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transport.log('debug', 'Debug message');
      expect(spy).not.toHaveBeenCalled();

      transport.log('error', 'Error message');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });
  });
});
