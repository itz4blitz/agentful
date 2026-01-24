/**
 * Transport Factory Tests
 *
 * Tests for transport factory and configuration validation.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  createTransport,
  createTransportFromEnv,
  validateTransportConfig,
  getDefaultOptions,
  TransportType
} from '../../core/transport-factory.js';
import { StdioTransport } from '../../core/transport.js';
import { HttpTransport } from '../../core/http-transport.js';
import { SSETransport } from '../../core/sse-transport.js';

describe('Transport Factory', () => {
  let transport;

  afterEach(async () => {
    if (transport) {
      await transport.stop?.();
      transport = null;
    }
  });

  describe('TransportType', () => {
    it('should export transport types', () => {
      expect(TransportType.STDIO).toBe('stdio');
      expect(TransportType.HTTP).toBe('http');
      expect(TransportType.SSE).toBe('sse');
    });
  });

  describe('createTransport', () => {
    it('should create stdio transport by default', () => {
      transport = createTransport();
      expect(transport).toBeInstanceOf(StdioTransport);
    });

    it('should create stdio transport explicitly', () => {
      transport = createTransport({ type: 'stdio' });
      expect(transport).toBeInstanceOf(StdioTransport);
    });

    it('should create HTTP transport', () => {
      transport = createTransport({ type: 'http' });
      expect(transport).toBeInstanceOf(HttpTransport);
    });

    it('should create SSE transport', () => {
      transport = createTransport({ type: 'sse' });
      expect(transport).toBeInstanceOf(SSETransport);
    });

    it('should pass options to transport', () => {
      transport = createTransport({
        type: 'http',
        options: {
          port: 5000,
          host: '0.0.0.0',
          logLevel: 'debug'
        }
      });

      expect(transport.port).toBe(5000);
      expect(transport.host).toBe('0.0.0.0');
      expect(transport.logLevel).toBe('debug');
    });

    it('should throw error for unknown transport type', () => {
      expect(() => {
        createTransport({ type: 'unknown' });
      }).toThrow('Unknown transport type: unknown');
    });
  });

  describe('validateTransportConfig', () => {
    it('should validate valid stdio config', () => {
      const result = validateTransportConfig({ type: 'stdio' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid HTTP config', () => {
      const result = validateTransportConfig({
        type: 'http',
        options: {
          port: 3838,
          host: 'localhost'
        }
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid SSE config', () => {
      const result = validateTransportConfig({
        type: 'sse',
        options: {
          port: 3838,
          heartbeatInterval: 30000
        }
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing type', () => {
      const result = validateTransportConfig({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transport type is required');
    });

    it('should fail validation for invalid type', () => {
      const result = validateTransportConfig({ type: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid transport type');
    });

    it('should fail validation for invalid port', () => {
      const result = validateTransportConfig({
        type: 'http',
        options: { port: 99999 }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Port must be a number between 1 and 65535');
    });

    it('should fail validation for negative port', () => {
      const result = validateTransportConfig({
        type: 'http',
        options: { port: -1 }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Port must be a number between 1 and 65535');
    });

    it('should fail validation for HTTPS without key', () => {
      const result = validateTransportConfig({
        type: 'http',
        options: {
          https: { cert: 'cert-content' }
        }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTTPS requires key option');
    });

    it('should fail validation for HTTPS without cert', () => {
      const result = validateTransportConfig({
        type: 'http',
        options: {
          https: { key: 'key-content' }
        }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTTPS requires cert option');
    });

    it('should fail validation for invalid heartbeat interval', () => {
      const result = validateTransportConfig({
        type: 'sse',
        options: { heartbeatInterval: 500 }
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Heartbeat interval must be a number >= 1000ms');
    });
  });

  describe('getDefaultOptions', () => {
    it('should return default options for stdio', () => {
      const options = getDefaultOptions('stdio');
      expect(options.logLevel).toBe('info');
    });

    it('should return default options for HTTP', () => {
      const options = getDefaultOptions('http');
      expect(options.port).toBe(3838);
      expect(options.host).toBe('localhost');
      expect(options.logLevel).toBe('info');
      expect(options.cors).toEqual({ origin: '*' });
      expect(options.compression).toBe(true);
      expect(options.helmet).toBe(true);
      expect(options.requestTimeout).toBe(30000);
    });

    it('should return default options for SSE', () => {
      const options = getDefaultOptions('sse');
      expect(options.port).toBe(3838);
      expect(options.host).toBe('localhost');
      expect(options.logLevel).toBe('info');
      expect(options.heartbeatInterval).toBe(30000);
    });

    it('should return empty object for unknown type', () => {
      const options = getDefaultOptions('unknown');
      expect(options).toEqual({});
    });
  });

  describe('createTransportFromEnv', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create stdio transport by default', () => {
      delete process.env.MCP_TRANSPORT;
      transport = createTransportFromEnv();
      expect(transport).toBeInstanceOf(StdioTransport);
    });

    it('should read transport type from env', () => {
      process.env.MCP_TRANSPORT = 'http';
      transport = createTransportFromEnv();
      expect(transport).toBeInstanceOf(HttpTransport);
    });

    it('should read port from env', () => {
      process.env.MCP_TRANSPORT = 'http';
      process.env.MCP_PORT = '4000';
      transport = createTransportFromEnv();
      expect(transport.port).toBe(4000);
    });

    it('should read host from env', () => {
      process.env.MCP_TRANSPORT = 'http';
      process.env.MCP_HOST = '0.0.0.0';
      transport = createTransportFromEnv();
      expect(transport.host).toBe('0.0.0.0');
    });

    it('should read log level from env', () => {
      process.env.LOG_LEVEL = 'debug';
      transport = createTransportFromEnv();
      expect(transport.logLevel).toBe('debug');
    });

    it('should read HTTPS config from env', () => {
      process.env.MCP_TRANSPORT = 'http';
      process.env.MCP_HTTPS_KEY = '/path/to/key';
      process.env.MCP_HTTPS_CERT = '/path/to/cert';
      transport = createTransportFromEnv();
      expect(transport.https).toEqual({
        key: '/path/to/key',
        cert: '/path/to/cert'
      });
    });

    it('should read heartbeat interval from env for SSE', () => {
      process.env.MCP_TRANSPORT = 'sse';
      process.env.MCP_HEARTBEAT_INTERVAL = '60000';
      transport = createTransportFromEnv();
      expect(transport.heartbeatInterval).toBe(60000);
    });
  });

  describe('Integration', () => {
    it('should create and start HTTP transport', async () => {
      transport = createTransport({
        type: 'http',
        options: { port: 3860, logLevel: 'error' }
      });

      await transport.start();
      expect(transport.connected).toBe(true);

      const response = await fetch('http://localhost:3860/health');
      expect(response.status).toBe(200);

      await transport.stop();
    });

    it('should create and start SSE transport', async () => {
      transport = createTransport({
        type: 'sse',
        options: { port: 3861, logLevel: 'error' }
      });

      await transport.start();
      expect(transport.connected).toBe(true);

      const response = await fetch('http://localhost:3861/health');
      expect(response.status).toBe(200);

      await transport.stop();
    });
  });
});
