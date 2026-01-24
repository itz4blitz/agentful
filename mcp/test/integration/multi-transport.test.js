import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StdioTransport, SSETransport, createTransport } from '../../../core/transport.js';
import { Readable, Writable } from 'stream';
import http from 'http';

/**
 * Multi-Transport Integration Tests
 *
 * Tests interaction between different transport types:
 * - stdio ↔ SSE communication
 * - Transport switching
 * - Concurrent multi-transport scenarios
 */
describe('Multi-Transport Integration', () => {
  describe('Transport Factory', () => {
    it('should create stdio transport by default', () => {
      const transport = createTransport();
      expect(transport).toBeInstanceOf(StdioTransport);
    });

    it('should create stdio transport explicitly', () => {
      const transport = createTransport({ type: 'stdio' });
      expect(transport).toBeInstanceOf(StdioTransport);
    });

    it('should create SSE transport', () => {
      const transport = createTransport({ type: 'sse' });
      expect(transport).toBeInstanceOf(SSETransport);
    });

    it('should throw on unknown transport type', () => {
      expect(() => {
        createTransport({ type: 'unknown' });
      }).toThrow('Unknown transport type: unknown');
    });

    it('should pass options to transport', () => {
      const transport = createTransport({
        type: 'sse',
        options: { port: 9999, host: '0.0.0.0' }
      });

      expect(transport.port).toBe(9999);
      expect(transport.host).toBe('0.0.0.0');
    });
  });

  describe('Concurrent Transports', () => {
    let stdioTransport;
    let sseTransport;
    let mockInput;
    let mockOutput;

    beforeEach(() => {
      mockInput = new Readable({ read() {} });
      mockOutput = new Writable({
        write(chunk, encoding, callback) {
          callback();
        }
      });

      stdioTransport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });

      sseTransport = new SSETransport({
        port: 9877,
        logLevel: 'error'
      });
    });

    afterEach(async () => {
      if (stdioTransport.connected) await stdioTransport.stop();
      if (sseTransport.connected) await sseTransport.stop();
    });

    it('should run both transports concurrently', async () => {
      await Promise.all([
        stdioTransport.start(),
        sseTransport.start()
      ]);

      expect(stdioTransport.connected).toBe(true);
      expect(sseTransport.connected).toBe(true);
    });

    it('should handle messages on both transports', async () => {
      await stdioTransport.start();
      await sseTransport.start();

      const stdioMessagePromise = new Promise(resolve => {
        stdioTransport.once('message', resolve);
      });

      const sseMessagePromise = new Promise(resolve => {
        sseTransport.once('message', resolve);
      });

      // Send via stdio
      const stdioMsg = { jsonrpc: '2.0', id: 1, method: 'stdio-test' };
      mockInput.push(JSON.stringify(stdioMsg) + '\n');

      // Send via SSE
      const sseMsg = { jsonrpc: '2.0', id: 2, method: 'sse-test' };
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 9877,
          path: '/mcp/rpc',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }, () => resolve());

        req.on('error', reject);
        req.write(JSON.stringify(sseMsg));
        req.end();
      });

      const [receivedStdio, receivedSSE] = await Promise.all([
        stdioMessagePromise,
        sseMessagePromise
      ]);

      expect(receivedStdio).toEqual(stdioMsg);
      expect(receivedSSE).toEqual(sseMsg);
    });

    it('should independently close transports', async () => {
      await stdioTransport.start();
      await sseTransport.start();

      await stdioTransport.stop();
      expect(stdioTransport.connected).toBe(false);
      expect(sseTransport.connected).toBe(true);

      await sseTransport.stop();
      expect(sseTransport.connected).toBe(false);
    });

    it('should handle errors independently', async () => {
      await stdioTransport.start();
      await sseTransport.start();

      const stdioError = new Error('stdio error');
      const sseError = new Error('sse error');

      const stdioErrorPromise = new Promise(resolve => {
        stdioTransport.once('error', resolve);
      });

      const sseErrorPromise = new Promise(resolve => {
        sseTransport.server.once('error', resolve);
      });

      mockInput.emit('error', stdioError);
      sseTransport.server.emit('error', sseError);

      const [receivedStdioError, receivedSSEError] = await Promise.all([
        stdioErrorPromise,
        sseErrorPromise
      ]);

      expect(receivedStdioError).toBe(stdioError);
      expect(receivedSSEError).toBe(sseError);
    });
  });

  describe('Transport Message Routing', () => {
    it('should route messages to correct handler', async () => {
      const mockInput = new Readable({ read() {} });
      const mockOutput = new Writable({
        write(chunk, encoding, callback) {
          callback();
        }
      });

      const transport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });

      await transport.start();

      const messages = [];
      transport.on('message', msg => messages.push(msg));

      // Send multiple message types
      const request = { jsonrpc: '2.0', id: 1, method: 'test', params: {} };
      const notification = { jsonrpc: '2.0', method: 'notify', params: {} };
      const response = { jsonrpc: '2.0', id: 1, result: {} };

      mockInput.push(JSON.stringify(request) + '\n');
      mockInput.push(JSON.stringify(notification) + '\n');
      mockInput.push(JSON.stringify(response) + '\n');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages).toHaveLength(3);
      expect(messages[0]).toEqual(request);
      expect(messages[1]).toEqual(notification);
      expect(messages[2]).toEqual(response);

      await transport.stop();
    });
  });

  describe('Transport Switching', () => {
    it('should switch from stdio to SSE mid-session', async () => {
      // Start with stdio
      const mockInput = new Readable({ read() {} });
      const mockOutput = new Writable({
        write(chunk, encoding, callback) {
          callback();
        }
      });

      const stdioTransport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });

      await stdioTransport.start();

      // Send message via stdio
      const stdioMsg = { jsonrpc: '2.0', id: 1, method: 'test' };
      const stdioPromise = new Promise(resolve => {
        stdioTransport.once('message', resolve);
      });
      mockInput.push(JSON.stringify(stdioMsg) + '\n');
      await stdioPromise;

      // Stop stdio
      await stdioTransport.stop();

      // Start SSE
      const sseTransport = new SSETransport({
        port: 9878,
        logLevel: 'error'
      });

      await sseTransport.start();

      // Send message via SSE
      const sseMsg = { jsonrpc: '2.0', id: 2, method: 'test' };
      const ssePromise = new Promise(resolve => {
        sseTransport.once('message', resolve);
      });

      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 9878,
          path: '/mcp/rpc',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, () => resolve());

        req.on('error', reject);
        req.write(JSON.stringify(sseMsg));
        req.end();
      });

      const received = await ssePromise;
      expect(received).toEqual(sseMsg);

      await sseTransport.stop();
    });
  });

  describe('Load Distribution', () => {
    it('should handle load across multiple SSE connections', async () => {
      const transport = new SSETransport({
        port: 9879,
        logLevel: 'error'
      });

      await transport.start();

      // Establish multiple SSE connections
      const connectionPromises = Array(5).fill(null).map(() => {
        return new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: 9879,
            path: '/mcp/sse',
            method: 'GET'
          });

          req.on('response', (res) => {
            res.once('data', (chunk) => {
              const data = chunk.toString();
              const match = data.match(/data: ({.*})/);
              const event = JSON.parse(match[1]);
              resolve(event.connectionId);
            });
          });

          req.end();
        });
      });

      const connectionIds = await Promise.all(connectionPromises);
      expect(connectionIds).toHaveLength(5);
      expect(new Set(connectionIds).size).toBe(5); // All unique

      await transport.stop();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from transport failure', async () => {
      const transport1 = new SSETransport({
        port: 9880,
        logLevel: 'error'
      });

      await transport1.start();

      // Simulate failure by stopping
      await transport1.stop();

      // Start new transport on same port
      const transport2 = new SSETransport({
        port: 9880,
        logLevel: 'error'
      });

      await transport2.start();
      expect(transport2.connected).toBe(true);

      await transport2.stop();
    });

    it('should handle graceful degradation', async () => {
      const mockInput = new Readable({ read() {} });
      const mockOutput = new Writable({
        write(chunk, encoding, callback) {
          callback();
        }
      });

      const transport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });

      await transport.start();

      // Send invalid message
      mockInput.push('invalid json\n');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      // Transport should still be connected
      expect(transport.connected).toBe(true);

      // Send valid message
      const validMsg = { jsonrpc: '2.0', id: 1, method: 'test' };
      const promise = new Promise(resolve => {
        transport.once('message', resolve);
      });

      mockInput.push(JSON.stringify(validMsg) + '\n');
      const received = await promise;

      expect(received).toEqual(validMsg);

      await transport.stop();
    });
  });
});
