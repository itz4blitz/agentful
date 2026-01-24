#!/usr/bin/env node

/**
 * Agentful MCP Server
 *
 * Model Context Protocol server that exposes agentful capabilities to any MCP client.
 * Supports Claude Desktop, IDEs, and other MCP-compatible tools.
 *
 * Protocol: Model Context Protocol (MCP) 2025-11-25 spec
 * Transport: stdio (default), SSE (for remote access)
 *
 * CRITICAL REQUIREMENTS:
 * - All logging MUST go to stderr (never stdout)
 * - Stdout is reserved exclusively for JSON-RPC messages
 * - Proper error handling with JSON-RPC error codes
 * - Schema validation for all inputs
 *
 * @module mcp/server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { createRegistries } from './core/registry.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Log to stderr (NEVER stdout - it corrupts stdio transport)
 *
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data
 */
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service: 'agentful-mcp',
    message,
    ...data
  };

  console.error(JSON.stringify(logEntry));
}

/**
 * Load server configuration
 *
 * @returns {Promise<Object>} Configuration object
 */
async function loadConfig() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    log('warn', 'Failed to load config, using defaults', { error: error.message });
    return {
      server: {
        name: 'agentful-mcp',
        version: '1.0.0'
      },
      agentful: {
        rootDir: '..',
        agentsDir: '../.claude/agents',
        productDir: '../.claude/product',
        stateDir: '../.agentful'
      },
      resources: {
        cache: {
          enabled: true,
          ttl: 60000
        }
      }
    };
  }
}

/**
 * Register all MCP tools
 *
 * @param {Object} registry - Tool registry
 * @param {Object} config - Server configuration
 */
async function registerTools(registry, config) {
  try {
    // Import existing tools
    const toolsModule = await import('./tools/index.js');
    const { tools } = toolsModule;

    if (!tools || !Array.isArray(tools)) {
      log('warn', 'No tools array found in tools/index.js');
      return;
    }

    // Import adapter
    const { registerExistingTools } = await import('./core/adapters.js');

    // Register all tools
    await registerExistingTools(registry, tools, config);

    log('debug', `Registered ${tools.length} tools`);

  } catch (error) {
    log('warn', 'Failed to load tools', { error: error.message, stack: error.stack });
  }
}

/**
 * Register all MCP resources
 *
 * @param {Object} registry - Resource registry
 * @param {Object} config - Server configuration
 */
async function registerResources(registry, config) {
  try {
    // Import existing resources
    const resourcesModule = await import('./resources/index.js');
    const { resources } = resourcesModule;

    if (!resources || !Array.isArray(resources)) {
      log('warn', 'No resources array found in resources/index.js');
      return;
    }

    // Import adapter
    const { registerExistingResources } = await import('./core/adapters.js');

    // Register all resources
    await registerExistingResources(registry, resources, config);

    log('debug', `Registered ${resources.length} resources`);

  } catch (error) {
    log('warn', 'Failed to load resources', { error: error.message, stack: error.stack });
  }
}

/**
 * MCP Server for agentful
 *
 * Exposes agentful capabilities via Model Context Protocol:
 * - Tools: Launch agents, check status, update progress
 * - Resources: State, product spec, completion data
 */
export class AgentfulMCPServer {
  constructor(config = {}, registries = null) {
    this.config = config;
    this.registries = registries;

    this.server = new Server(
      {
        name: config.server?.name || 'agentful-mcp',
        version: config.server?.version || '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );

    this._setupHandlers();
    this._setupErrorHandling();
  }

  /**
   * Setup MCP request handlers
   */
  _setupHandlers() {
    // Handle tool list request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolList = this.registries.tools.list();

      log('debug', 'Listing tools', { count: toolList.length });

      return {
        tools: toolList
      };
    });

    // Handle tool call request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      log('info', 'Calling tool', { name, args });

      try {
        const result = await this.registries.tools.call(name, args || {});

        log('info', 'Tool executed successfully', { name });

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        log('error', 'Tool execution failed', { name, error: error.message });
        throw error;
      }
    });

    // Handle resource list request
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resourceList = this.registries.resources.list();

      log('debug', 'Listing resources', { count: resourceList.length });

      return {
        resources: resourceList
      };
    });

    // Handle resource read request
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      log('info', 'Reading resource', { uri });

      try {
        const resource = await this.registries.resources.read(uri);

        log('info', 'Resource read successfully', { uri });

        return {
          contents: [
            {
              uri: resource.uri,
              mimeType: resource.mimeType,
              text: resource.contents.toString()
            }
          ]
        };
      } catch (error) {
        log('error', 'Resource read failed', { uri, error: error.message });
        throw error;
      }
    });
  }

  /**
   * Setup error handling
   */
  _setupErrorHandling() {
    this.server.onerror = (error) => {
      log('error', 'MCP Server Error', { error: error.message, stack: error.stack });
    };

    const shutdown = async () => {
      log('info', 'Shutting down MCP server');

      try {
        await this.server.close();
        process.exit(0);
      } catch (error) {
        log('error', 'Error during shutdown', { error: error.message });
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Start the MCP server
   *
   * @param {Object} [transport] - Custom transport (optional)
   */
  async start(transport = null) {
    // Use provided transport, or stored transport, or default to stdio
    const activeTransport = transport || this.transport;

    if (!activeTransport) {
      // Default to stdio transport (MCP SDK)
      const stdioTransport = new StdioServerTransport();
      await this.server.connect(stdioTransport);
      log('info', 'MCP server running on stdio transport');
    } else {
      // Use custom transport (HTTP, SSE, etc.)
      await this._startCustomTransport(activeTransport);
    }
  }

  /**
   * Start server with custom transport
   *
   * @private
   * @param {Object} transport - Custom transport instance
   */
  async _startCustomTransport(transport) {
    // Start the transport
    await transport.start();

    // Setup message handling
    transport.on('message', async (message, connectionId) => {
      try {
        // Handle JSON-RPC request
        const handler = this._getRequestHandler(message.method);

        if (!handler) {
          transport.sendError(
            message.id,
            -32601, // Method not found
            `Method not found: ${message.method}`,
            null,
            connectionId
          );
          return;
        }

        // Execute handler
        const result = await handler({ params: message.params });

        // Send response
        transport.sendResponse(message.id, result, connectionId);

      } catch (error) {
        log('error', 'Request handler error', {
          method: message.method,
          error: error.message
        });

        transport.sendError(
          message.id,
          -32603, // Internal error
          error.message,
          null,
          connectionId
        );
      }
    });

    // Setup error handling
    transport.on('error', (error) => {
      log('error', 'Transport error', { error: error.message });
    });

    transport.on('close', () => {
      log('info', 'Transport closed');
    });

    log('info', `MCP server running on ${transport.constructor.name}`);
  }

  /**
   * Get request handler for method
   *
   * @private
   * @param {string} method - Request method
   * @returns {Function|null} Handler function or null
   */
  _getRequestHandler(method) {
    // Map MCP SDK request types to methods
    const methodMap = {
      'tools/list': this._handleToolsList.bind(this),
      'tools/call': this._handleToolsCall.bind(this),
      'resources/list': this._handleResourcesList.bind(this),
      'resources/read': this._handleResourcesRead.bind(this)
    };

    return methodMap[method] || null;
  }

  /**
   * Handle tools/list request
   *
   * @private
   * @param {Object} request - Request object
   * @returns {Object} Response
   */
  async _handleToolsList(request) {
    const toolList = this.registries.tools.list();
    log('debug', 'Listing tools', { count: toolList.length });
    return { tools: toolList };
  }

  /**
   * Handle tools/call request
   *
   * @private
   * @param {Object} request - Request object
   * @returns {Object} Response
   */
  async _handleToolsCall(request) {
    const { name, arguments: args } = request.params;
    log('info', 'Calling tool', { name, args });

    const result = await this.registries.tools.call(name, args || {});
    log('info', 'Tool executed successfully', { name });

    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Handle resources/list request
   *
   * @private
   * @param {Object} request - Request object
   * @returns {Object} Response
   */
  async _handleResourcesList(request) {
    const resourceList = this.registries.resources.list();
    log('debug', 'Listing resources', { count: resourceList.length });
    return { resources: resourceList };
  }

  /**
   * Handle resources/read request
   *
   * @private
   * @param {Object} request - Request object
   * @returns {Object} Response
   */
  async _handleResourcesRead(request) {
    const { uri } = request.params;
    log('info', 'Reading resource', { uri });

    const resource = await this.registries.resources.read(uri);
    log('info', 'Resource read successfully', { uri });

    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: resource.contents.toString()
        }
      ]
    };
  }

  /**
   * Get the server instance (for testing)
   */
  getServer() {
    return this.server;
  }
}

/**
 * Create MCP Server (Factory function for testing)
 *
 * @param {Object} options - Server options
 * @param {string} options.projectRoot - Project root directory
 * @param {Object} options.executor - Agent executor (optional, for testing)
 * @param {Object} options.transport - Transport instance (optional)
 * @returns {Promise<AgentfulMCPServer>} Server instance
 */
export async function createMCPServer(options = {}) {
  const config = await loadConfig();

  // Override config with options
  if (options.projectRoot) {
    config.agentful.rootDir = options.projectRoot;
    config.agentful.agentsDir = path.join(options.projectRoot, '.claude/agents');
    config.agentful.productDir = path.join(options.projectRoot, '.claude/product');
    config.agentful.stateDir = path.join(options.projectRoot, '.agentful');
  }

  // Create registries
  const registries = createRegistries(config.resources);

  // Register tools and resources
  await registerTools(registries.tools, config);
  await registerResources(registries.resources, config);

  // Create server
  const server = new AgentfulMCPServer(config, registries);

  // Override executor for testing
  if (options.executor) {
    server.executor = options.executor;
  }

  // Store transport for later use
  if (options.transport) {
    server.transport = options.transport;
  }

  return server;
}

/**
 * Main server function
 */
async function main() {
  try {
    log('info', 'Starting agentful MCP server');

    // Load configuration
    const config = await loadConfig();
    log('info', 'Configuration loaded', { serverName: config.server.name });

    // Create registries
    const registries = createRegistries(config.resources);
    log('info', 'Registries created');

    // Register tools and resources
    await registerTools(registries.tools, config);
    await registerResources(registries.resources, config);

    log('info', 'Tools and resources registered', {
      toolCount: registries.tools.list().length,
      resourceCount: registries.resources.list().length
    });

    // Create and start MCP server
    const server = new AgentfulMCPServer(config, registries);
    await server.start();

  } catch (error) {
    log('error', 'Fatal server error', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection', {
    reason: String(reason),
    promise: String(promise)
  });
});

process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Only start server if run directly (not imported for testing)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
