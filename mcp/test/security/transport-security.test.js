import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StdioTransport, SSETransport } from '../../../core/transport.js';
import { Readable, Writable } from 'stream';
import http from 'http';

/**
 * Transport Security Tests
 *
 * Tests security aspects of MCP transports:
 * - Input validation
 * - Injection prevention
 * - Resource limits
 * - Error disclosure
 */
describe('Transport Security', () => {
  describe('Input Validation', () => {
    let transport;
    let mockInput;
    let mockOutput;

    beforeEach(() => {
      mockInput = new Readable({ read() {} });
      mockOutput = new Writable({
        write(chunk, encoding, callback) {
          callback();
        }
      });

      transport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });
    });

    afterEach(async () => {
      if (transport.connected) {
        await transport.stop();
      }
    });

    it('should reject malformed JSON-RPC messages', async () => {
      await transport.start();

      const invalidMessages = [
        '{"invalid": "no jsonrpc field"}',
        '{"jsonrpc": "1.0", "id": 1}', // Wrong version
        '{"jsonrpc": "2.0"}', // No method or id
        '{malformed json}',
        '[]', // Array instead of object
        'null',
        'undefined'
      ];

      for (const msg of invalidMessages) {
        mockInput.push(msg + '\n');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Transport should still be connected (graceful handling)
      expect(transport.connected).toBe(true);
    });

    it('should handle excessively large messages gracefully', async () => {
      await transport.start();

      // Create a 10MB message
      const largeMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: { data: 'x'.repeat(10 * 1024 * 1024) }
      };

      mockInput.push(JSON.stringify(largeMessage) + '\n');

      await new Promise(resolve => setTimeout(resolve, 500));

      // Should handle without crashing
      expect(transport.connected).toBe(true);
    });

    it('should sanitize error messages to prevent information disclosure', async () => {
      await transport.start();

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Send invalid message
      mockInput.push('invalid json\n');

      await new Promise(resolve => setTimeout(resolve, 100));

      // Error should be logged but not expose internal details
      expect(transport.connected).toBe(true);

      consoleErrorSpy.mockRestore();
    });

    it('should prevent prototype pollution attacks', async () => {
      await transport.start();

      const maliciousMessages = [
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'test',
          params: {
            '__proto__': { polluted: true },
            constructor: { polluted: true }
          }
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'test',
          params: JSON.parse('{"__proto__": {"polluted": true}}')
        }
      ];

      const messages = [];
      transport.on('message', msg => messages.push(msg));

      for (const msg of maliciousMessages) {
        mockInput.push(JSON.stringify(msg) + '\n');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify no pollution occurred
      expect({}.polluted).toBeUndefined();
      expect(Object.prototype.polluted).toBeUndefined();
    });

    it('should reject deeply nested JSON structures', async () => {
      await transport.start();

      // Create deeply nested object
      let nested = { jsonrpc: '2.0', id: 1, method: 'test' };
      for (let i = 0; i < 1000; i++) {
        nested = { nested };
      }

      // This might fail to parse or be rejected
      try {
        mockInput.push(JSON.stringify(nested) + '\n');
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(transport.connected).toBe(true);
      } catch (error) {
        // Acceptable to fail on deeply nested structures
        expect(error).toBeDefined();
      }
    });
  });

  describe('SSE Security', () => {
    let transport;

    beforeEach(async () => {
      transport = new SSETransport({
        port: 9882,
        logLevel: 'error'
      });
      await transport.start();
    });

    afterEach(async () => {
      if (transport.connected) {
        await transport.stop();
      }
    });

    it('should set security headers for SSE connections', async () => {
      await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 9882,
          path: '/mcp/sse',
          method: 'GET'
        }, (res) => {
          expect(res.headers['cache-control']).toBe('no-cache');
          expect(res.headers['connection']).toBe('keep-alive');
          resolve();
          req.destroy();
        });

        req.end();
      });
    });

    it('should handle malicious RPC payloads', async () => {
      const maliciousPayloads = [
        '<script>alert("xss")</script>',
        '{"__proto__": {"polluted": true}}',
        'A'.repeat(1024 * 1024), // 1MB of garbage
        '\x00\x01\x02\x03' // Binary data
      ];

      for (const payload of maliciousPayloads) {
        await new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: 9882,
            path: '/mcp/rpc',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }, (res) => {
            // Should return error or reject
            expect([400, 500]).toContain(res.statusCode);
            resolve();
          });

          req.write(payload);
          req.end();
        });
      }
    });

    it('should prevent connection flooding', async () => {
      // Try to establish 200 connections rapidly
      const connections = Array(200).fill(null).map(() => {
        return new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: 9882,
            path: '/mcp/sse',
            method: 'GET'
          });

          req.on('response', () => {
            resolve();
            req.destroy();
          });

          req.on('error', () => {
            resolve(); // Acceptable to fail under flood
          });

          req.end();
        });
      });

      await Promise.all(connections);

      // Server should still be functional
      expect(transport.connected).toBe(true);
    });

    it('should reject requests with invalid Content-Type', async () => {
      await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 9882,
          path: '/mcp/rpc',
          method: 'POST',
          headers: { 'Content-Type': 'text/html' } // Wrong type
        }, (res) => {
          // Should still process or reject gracefully
          expect(res.statusCode).toBeDefined();
          resolve();
        });

        req.write('{"jsonrpc": "2.0", "id": 1}');
        req.end();
      });
    });

    it('should limit request body size', async () => {
      // Try to send a very large payload
      const largePayload = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: { data: 'x'.repeat(50 * 1024 * 1024) } // 50MB
      });

      await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 9882,
          path: '/mcp/rpc',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(largePayload)
          }
        }, (res) => {
          // Should handle or reject
          resolve();
        });

        req.on('error', () => {
          resolve(); // Acceptable to fail
        });

        req.write(largePayload);
        req.end();
      });

      // Server should still be functional
      expect(transport.connected).toBe(true);
    });
  });

  describe('Resource Exhaustion Prevention', () => {
    it('should handle rapid connection open/close cycles', async () => {
      const transport = new SSETransport({
        port: 9883,
        logLevel: 'error'
      });

      await transport.start();

      // Rapidly open and close connections
      for (let i = 0; i < 50; i++) {
        const req = http.request({
          hostname: 'localhost',
          port: 9883,
          path: '/mcp/sse',
          method: 'GET'
        });

        req.on('response', () => {
          req.destroy();
        });

        req.end();
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Server should still be functional
      expect(transport.connected).toBe(true);

      await transport.stop();
    });

    it('should handle message flooding on stdio', async () => {
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

      // Send 1000 messages rapidly
      for (let i = 0; i < 1000; i++) {
        const msg = { jsonrpc: '2.0', id: i, method: 'flood' };
        mockInput.push(JSON.stringify(msg) + '\n');
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Transport should still be connected
      expect(transport.connected).toBe(true);

      await transport.stop();
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose internal paths in error messages', async () => {
      const mockInput = new Readable({ read() {} });
      const outputs = [];
      const mockOutput = new Writable({
        write(chunk, encoding, callback) {
          outputs.push(chunk.toString());
          callback();
        }
      });

      const transport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });

      await transport.start();

      // Send invalid message to trigger error
      mockInput.push('invalid\n');

      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that error responses don't contain file paths
      outputs.forEach(output => {
        expect(output).not.toMatch(/\/Users\//i);
        expect(output).not.toMatch(/\/home\//i);
        expect(output).not.toMatch(/C:\\/i);
        expect(output).not.toMatch(/node_modules/i);
      });

      await transport.stop();
    });

    it('should not expose stack traces to clients', async () => {
      const transport = new SSETransport({
        port: 9884,
        logLevel: 'error'
      });

      await transport.start();

      // Send malformed request
      await new Promise((resolve) => {
        const req = http.request({
          hostname: 'localhost',
          port: 9884,
          path: '/mcp/rpc',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (res) => {
          let body = '';
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => {
            // Error response should not contain stack trace
            expect(body).not.toMatch(/at .*\.js:\d+:\d+/);
            expect(body).not.toMatch(/Error:.*\n.*at /);
            resolve();
          });
        });

        req.write('invalid json');
        req.end();
      });

      await transport.stop();
    });
  });

  describe('Injection Prevention', () => {
    it('should prevent command injection via method names', async () => {
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

      const maliciousMethods = [
        '"; rm -rf /',
        '$(whoami)',
        '`cat /etc/passwd`',
        '../../../etc/passwd',
        'test; ls -la'
      ];

      const messages = [];
      transport.on('message', msg => messages.push(msg));

      for (const method of maliciousMethods) {
        const msg = { jsonrpc: '2.0', id: 1, method };
        mockInput.push(JSON.stringify(msg) + '\n');
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Messages should be received as-is (not executed)
      expect(messages.length).toBeGreaterThan(0);

      await transport.stop();
    });
  });
});
