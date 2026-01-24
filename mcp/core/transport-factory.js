/**
 * Transport Factory
 *
 * Creates appropriate transport based on configuration.
 * Provides unified interface for all transport types.
 *
 * Supported transports:
 * - stdio: Standard input/output (for local MCP clients like Claude Code)
 * - http: HTTP POST endpoint (for REST-based clients)
 * - sse: Server-Sent Events (for streaming, bidirectional communication)
 *
 * @module mcp/core/transport-factory
 */

import { StdioTransport } from './transport.js';
import { HttpTransport } from './http-transport.js';
import { SSETransport } from './sse-transport.js';

/**
 * Transport types
 */
export const TransportType = {
  STDIO: 'stdio',
  HTTP: 'http',
  SSE: 'sse'
};

/**
 * Create transport based on configuration
 *
 * @param {Object} config - Transport configuration
 * @param {string} config.type - Transport type ('stdio', 'http', or 'sse')
 * @param {Object} [config.options] - Transport-specific options
 * @returns {StdioTransport|HttpTransport|SSETransport} Transport instance
 *
 * @example
 * // Stdio transport
 * const transport = createTransport({
 *   type: 'stdio',
 *   options: { logLevel: 'debug' }
 * });
 *
 * @example
 * // HTTP transport
 * const transport = createTransport({
 *   type: 'http',
 *   options: {
 *     port: 3838,
 *     host: 'localhost',
 *     cors: { origin: '*' }
 *   }
 * });
 *
 * @example
 * // SSE transport
 * const transport = createTransport({
 *   type: 'sse',
 *   options: {
 *     port: 3838,
 *     host: '0.0.0.0',
 *     heartbeatInterval: 30000
 *   }
 * });
 */
export function createTransport(config = {}) {
  const type = config.type || TransportType.STDIO;
  const options = config.options || {};

  switch (type) {
    case TransportType.STDIO:
      return new StdioTransport(options);

    case TransportType.HTTP:
      return new HttpTransport(options);

    case TransportType.SSE:
      return new SSETransport(options);

    default:
      throw new Error(`Unknown transport type: ${type}. Valid types: ${Object.values(TransportType).join(', ')}`);
  }
}

/**
 * Validate transport configuration
 *
 * @param {Object} config - Transport configuration
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateTransportConfig(config) {
  const errors = [];

  if (!config.type) {
    errors.push('Transport type is required');
  } else if (!Object.values(TransportType).includes(config.type)) {
    errors.push(`Invalid transport type: ${config.type}. Valid types: ${Object.values(TransportType).join(', ')}`);
  }

  // Type-specific validation
  if (config.type === TransportType.HTTP || config.type === TransportType.SSE) {
    const options = config.options || {};

    if (options.port && (typeof options.port !== 'number' || options.port < 1 || options.port > 65535)) {
      errors.push('Port must be a number between 1 and 65535');
    }

    if (options.https) {
      if (!options.https.key) {
        errors.push('HTTPS requires key option');
      }
      if (!options.https.cert) {
        errors.push('HTTPS requires cert option');
      }
    }
  }

  if (config.type === TransportType.SSE) {
    const options = config.options || {};

    if (options.heartbeatInterval && (typeof options.heartbeatInterval !== 'number' || options.heartbeatInterval < 1000)) {
      errors.push('Heartbeat interval must be a number >= 1000ms');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default options for transport type
 *
 * @param {string} type - Transport type
 * @returns {Object} Default options
 */
export function getDefaultOptions(type) {
  switch (type) {
    case TransportType.STDIO:
      return {
        logLevel: 'info'
      };

    case TransportType.HTTP:
      return {
        port: 3838,
        host: 'localhost',
        logLevel: 'info',
        cors: { origin: '*' },
        compression: true,
        helmet: true,
        requestTimeout: 30000
      };

    case TransportType.SSE:
      return {
        port: 3838,
        host: 'localhost',
        logLevel: 'info',
        cors: { origin: '*' },
        compression: true,
        helmet: true,
        heartbeatInterval: 30000
      };

    default:
      return {};
  }
}

/**
 * Create transport from environment variables
 *
 * Reads configuration from environment:
 * - MCP_TRANSPORT: Transport type
 * - MCP_PORT: Port number (HTTP/SSE only)
 * - MCP_HOST: Host address (HTTP/SSE only)
 * - LOG_LEVEL: Logging level
 * - MCP_HTTPS_KEY: Path to HTTPS key file
 * - MCP_HTTPS_CERT: Path to HTTPS cert file
 *
 * @returns {StdioTransport|HttpTransport|SSETransport} Transport instance
 */
export function createTransportFromEnv() {
  const type = process.env.MCP_TRANSPORT || TransportType.STDIO;
  const options = getDefaultOptions(type);

  // Override with environment variables
  if (process.env.MCP_PORT) {
    options.port = parseInt(process.env.MCP_PORT, 10);
  }

  if (process.env.MCP_HOST) {
    options.host = process.env.MCP_HOST;
  }

  if (process.env.LOG_LEVEL) {
    options.logLevel = process.env.LOG_LEVEL;
  }

  // HTTPS configuration
  if (process.env.MCP_HTTPS_KEY && process.env.MCP_HTTPS_CERT) {
    options.https = {
      key: process.env.MCP_HTTPS_KEY,
      cert: process.env.MCP_HTTPS_CERT
    };
  }

  // SSE heartbeat interval
  if (type === TransportType.SSE && process.env.MCP_HEARTBEAT_INTERVAL) {
    options.heartbeatInterval = parseInt(process.env.MCP_HEARTBEAT_INTERVAL, 10);
  }

  return createTransport({ type, options });
}

export default {
  createTransport,
  createTransportFromEnv,
  validateTransportConfig,
  getDefaultOptions,
  TransportType
};
