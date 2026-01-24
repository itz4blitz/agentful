import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StdioTransport } from '../../../core/transport.js';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';

/**
 * StdioTransport Unit Tests
 *
 * Tests the stdio transport implementation:
 * - Message buffering
 * - JSON-RPC parsing
 * - Error handling
 * - Connection lifecycle
 */
describe('StdioTransport', () => {
  let transport;
  let mockInput;
  let mockOutput;

  beforeEach(() => {
    // Create mock stdin/stdout
    mockInput = new Readable({ read() {} });
    mockOutput = new Writable({
      write(chunk, encoding, callback) {
        callback();
      }
    });

    transport = new StdioTransport({
      input: mockInput,
      output: mockOutput,
      logLevel: 'error' // Suppress logs in tests
    });
  });

  afterEach(async () => {
    if (transport.connected) {
      await transport.stop();
    }
  });

  describe('Initialization', () => {
    it('should create transport with default options', () => {
      const defaultTransport = new StdioTransport();
      expect(defaultTransport).toBeDefined();
      expect(defaultTransport.input).toBe(process.stdin);
      expect(defaultTransport.output).toBe(process.stdout);
    });

    it('should create transport with custom streams', () => {
      expect(transport.input).toBe(mockInput);
      expect(transport.output).toBe(mockOutput);
    });

    it('should initialize with disconnected state', () => {
      expect(transport.connected).toBe(false);
    });

    it('should set custom log level', () => {
      const transport = new StdioTransport({ logLevel: 'debug' });
      expect(transport.logLevel).toBe('debug');
    });
  });

  describe('Connection Lifecycle', () => {
    it('should start transport successfully', async () => {
      await transport.start();
      expect(transport.connected).toBe(true);
    });

    it('should throw if starting already connected transport', async () => {
      await transport.start();
      await expect(transport.start()).rejects.toThrow('Transport already started');
    });

    it('should stop transport successfully', async () => {
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

    it('should handle multiple stops gracefully', async () => {
      await transport.start();
      await transport.stop();
      await transport.stop(); // Should not throw
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      await transport.start();
    });

    it('should send JSON-RPC message', () => {
      const writeSpy = vi.spyOn(mockOutput, 'write');

      const message = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: { foo: 'bar' }
      };

      transport.send(message);

      expect(writeSpy).toHaveBeenCalledWith(JSON.stringify(message) + '\n');
    });

    it('should throw if sending while disconnected', async () => {
      await transport.stop();

      expect(() => {
        transport.send({ jsonrpc: '2.0', id: 1, method: 'test' });
      }).toThrow('Transport not connected');
    });

    it('should send response message', () => {
      const writeSpy = vi.spyOn(mockOutput, 'write');

      transport.sendResponse(1, { result: 'success' });

      const expectedMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { result: 'success' }
      };

      expect(writeSpy).toHaveBeenCalledWith(JSON.stringify(expectedMessage) + '\n');
    });

    it('should send error response', () => {
      const writeSpy = vi.spyOn(mockOutput, 'write');

      transport.sendError(1, -32600, 'Invalid Request', { details: 'test' });

      const expectedMessage = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: { details: 'test' }
        }
      };

      expect(writeSpy).toHaveBeenCalledWith(JSON.stringify(expectedMessage) + '\n');
    });

    it('should send notification', () => {
      const writeSpy = vi.spyOn(mockOutput, 'write');

      transport.sendNotification('progress', { percentage: 50 });

      const expectedMessage = {
        jsonrpc: '2.0',
        method: 'progress',
        params: { percentage: 50 }
      };

      expect(writeSpy).toHaveBeenCalledWith(JSON.stringify(expectedMessage) + '\n');
    });
  });

  describe('Message Receiving', () => {
    beforeEach(async () => {
      await transport.start();
    });

    it('should receive and parse JSON-RPC message', async () => {
      const messagePromise = new Promise(resolve => {
        transport.once('message', resolve);
      });

      const testMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: {}
      };

      mockInput.push(JSON.stringify(testMessage) + '\n');

      const receivedMessage = await messagePromise;
      expect(receivedMessage).toEqual(testMessage);
    });

    it('should handle multiple messages in single chunk', async () => {
      const messages = [];
      transport.on('message', msg => messages.push(msg));

      const msg1 = { jsonrpc: '2.0', id: 1, method: 'test1', params: {} };
      const msg2 = { jsonrpc: '2.0', id: 2, method: 'test2', params: {} };

      mockInput.push(JSON.stringify(msg1) + '\n' + JSON.stringify(msg2) + '\n');

      // Wait for messages to be processed
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(msg1);
      expect(messages[1]).toEqual(msg2);
    });

    it('should buffer incomplete messages', async () => {
      const messagePromise = new Promise(resolve => {
        transport.once('message', resolve);
      });

      const testMessage = { jsonrpc: '2.0', id: 1, method: 'test', params: {} };
      const serialized = JSON.stringify(testMessage) + '\n';

      // Send message in chunks
      mockInput.push(serialized.slice(0, 10));
      await new Promise(resolve => setTimeout(resolve, 10));
      mockInput.push(serialized.slice(10));

      const receivedMessage = await messagePromise;
      expect(receivedMessage).toEqual(testMessage);
    });

    it('should reject invalid JSON', async () => {
      const errorSpy = vi.fn();
      transport.on('error', errorSpy);

      mockInput.push('invalid json\n');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should log error but not crash
      expect(transport.connected).toBe(true);
    });

    it('should reject invalid JSON-RPC version', async () => {
      mockInput.push(JSON.stringify({ jsonrpc: '1.0', id: 1, method: 'test' }) + '\n');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should handle error gracefully
      expect(transport.connected).toBe(true);
    });

    it('should handle empty lines', async () => {
      const messages = [];
      transport.on('message', msg => messages.push(msg));

      mockInput.push('\n\n');
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(messages).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should emit error on input stream error', async () => {
      await transport.start();

      const errorPromise = new Promise(resolve => {
        transport.once('error', resolve);
      });

      const testError = new Error('Test input error');
      mockInput.emit('error', testError);

      const emittedError = await errorPromise;
      expect(emittedError).toBe(testError);
    });

    it('should handle input stream end gracefully', async () => {
      await transport.start();

      const closePromise = new Promise(resolve => {
        transport.once('close', resolve);
      });

      mockInput.emit('end');

      await closePromise;
      expect(transport.connected).toBe(false);
    });

    it('should handle send errors gracefully', async () => {
      await transport.start();

      // Make write throw error
      mockOutput.write = () => {
        throw new Error('Write error');
      };

      expect(() => {
        transport.send({ jsonrpc: '2.0', id: 1, method: 'test' });
      }).toThrow('Write error');
    });
  });

  describe('Logging', () => {
    it('should respect log level', () => {
      const debugTransport = new StdioTransport({
        input: mockInput,
        output: mockOutput,
        logLevel: 'error'
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      debugTransport.log('debug', 'Debug message');
      debugTransport.log('info', 'Info message');
      debugTransport.log('error', 'Error message');

      // Only error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });

    it('should include metadata in logs', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      transport.log('error', 'Test message', { foo: 'bar' });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logEntry = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(logEntry.level).toBe('error');
      expect(logEntry.message).toContain('Test message');
      expect(logEntry.foo).toBe('bar');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large messages', async () => {
      await transport.start();

      const messagePromise = new Promise(resolve => {
        transport.once('message', resolve);
      });

      const largeParams = { data: 'x'.repeat(100000) };
      const testMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: largeParams
      };

      mockInput.push(JSON.stringify(testMessage) + '\n');

      const receivedMessage = await messagePromise;
      expect(receivedMessage.params.data).toHaveLength(100000);
    });

    it('should handle rapid message bursts', async () => {
      await transport.start();

      const messages = [];
      transport.on('message', msg => messages.push(msg));

      // Send 100 messages rapidly
      for (let i = 0; i < 100; i++) {
        const msg = { jsonrpc: '2.0', id: i, method: 'test', params: {} };
        mockInput.push(JSON.stringify(msg) + '\n');
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(messages).toHaveLength(100);
    });

    it('should handle unicode characters', async () => {
      await transport.start();

      const messagePromise = new Promise(resolve => {
        transport.once('message', resolve);
      });

      const testMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: { text: '你好世界 🚀 émoji' }
      };

      mockInput.push(JSON.stringify(testMessage) + '\n');

      const receivedMessage = await messagePromise;
      expect(receivedMessage.params.text).toBe('你好世界 🚀 émoji');
    });

    it('should handle circular JSON references gracefully', async () => {
      await transport.start();

      const circular = { a: 1 };
      circular.self = circular;

      expect(() => {
        transport.send(circular);
      }).toThrow();
    });
  });
});
