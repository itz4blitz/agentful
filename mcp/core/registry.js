/**
 * MCP Registry - Tool and Resource Registration
 *
 * Manages registration and execution of MCP tools and resources.
 * Provides schema validation using Zod and proper error handling.
 *
 * @module mcp/core/registry
 */

import { z } from 'zod';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool Registry
 *
 * Manages MCP tool registration and execution with schema validation.
 */
export class ToolRegistry {
  constructor() {
    /** @type {Map<string, ToolDefinition>} */
    this.tools = new Map();
  }

  /**
   * Register a tool
   *
   * @param {string} name - Tool name (unique identifier)
   * @param {Object} definition - Tool definition
   * @param {string} definition.description - Human-readable description
   * @param {Object} definition.inputSchema - JSON Schema for tool input
   * @param {Function} definition.handler - Async function to execute tool
   * @throws {Error} If tool already registered or invalid definition
   */
  register(name, definition) {
    if (this.tools.has(name)) {
      throw new Error(`Tool already registered: ${name}`);
    }

    // Validate definition structure
    if (!definition.description || typeof definition.description !== 'string') {
      throw new Error(`Tool ${name}: description is required and must be a string`);
    }

    if (!definition.inputSchema || typeof definition.inputSchema !== 'object') {
      throw new Error(`Tool ${name}: inputSchema is required and must be an object`);
    }

    if (!definition.handler || typeof definition.handler !== 'function') {
      throw new Error(`Tool ${name}: handler is required and must be a function`);
    }

    this.tools.set(name, {
      name,
      description: definition.description,
      inputSchema: definition.inputSchema,
      handler: definition.handler,
      metadata: definition.metadata || {}
    });
  }

  /**
   * List all registered tools
   *
   * @returns {Array<Object>} Array of tool definitions (without handlers)
   */
  list() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      metadata: tool.metadata
    }));
  }

  /**
   * Get a specific tool definition
   *
   * @param {string} name - Tool name
   * @returns {Object|null} Tool definition or null if not found
   */
  get(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Execute a tool with validation
   *
   * @param {string} name - Tool name
   * @param {Object} args - Tool arguments
   * @returns {Promise<Object>} Tool execution result
   * @throws {McpError} If tool not found or execution fails
   */
  async call(name, args = {}) {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool not found: ${name}`
      );
    }

    try {
      // Validate arguments against schema
      this._validateArguments(tool, args);

      // Execute tool handler
      const result = await tool.handler(args);

      return result;

    } catch (error) {
      // If already an MCP error, rethrow
      if (error instanceof McpError) {
        throw error;
      }

      // Wrap other errors as internal errors
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error.message}`,
        { originalError: error.stack }
      );
    }
  }

  /**
   * Validate arguments against tool's input schema
   *
   * @private
   * @param {Object} tool - Tool definition
   * @param {Object} args - Arguments to validate
   * @throws {McpError} If validation fails
   */
  _validateArguments(tool, args) {
    // Basic JSON Schema validation
    // For production, consider using ajv or similar for full JSON Schema support

    const schema = tool.inputSchema;

    // Check required properties
    if (schema.required && Array.isArray(schema.required)) {
      for (const prop of schema.required) {
        if (!(prop in args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Missing required parameter: ${prop}`
          );
        }
      }
    }

    // Check property types (basic validation)
    if (schema.properties) {
      for (const [key, value] of Object.entries(args)) {
        const propSchema = schema.properties[key];

        if (!propSchema) {
          // Unknown property - could be strict or lenient based on additionalProperties
          if (schema.additionalProperties === false) {
            throw new McpError(
              ErrorCode.InvalidParams,
              `Unknown parameter: ${key}`
            );
          }
          continue;
        }

        // Type validation
        const actualType = this._getType(value);
        const expectedType = propSchema.type;

        if (expectedType && actualType !== expectedType) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Invalid type for ${key}: expected ${expectedType}, got ${actualType}`
          );
        }
      }
    }
  }

  /**
   * Get JavaScript type name
   *
   * @private
   * @param {*} value - Value to check
   * @returns {string} Type name
   */
  _getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}

/**
 * Resource Registry
 *
 * Manages MCP resource registration and retrieval with caching.
 */
export class ResourceRegistry {
  constructor(options = {}) {
    /** @type {Map<string, ResourceDefinition>} */
    this.resources = new Map();

    /** @type {Map<string, CacheEntry>} */
    this.cache = new Map();

    this.cacheEnabled = options.cacheEnabled !== false;
    this.cacheTTL = options.cacheTTL || 60000; // 1 minute default
  }

  /**
   * Register a resource
   *
   * @param {string} uri - Resource URI (unique identifier)
   * @param {Object} definition - Resource definition
   * @param {string} definition.name - Human-readable name
   * @param {string} definition.description - Resource description
   * @param {string} definition.mimeType - MIME type (e.g., 'application/json')
   * @param {Function} definition.handler - Async function to fetch resource
   * @param {boolean} [definition.cacheable=true] - Whether to cache this resource
   * @throws {Error} If resource already registered or invalid definition
   */
  register(uri, definition) {
    if (this.resources.has(uri)) {
      throw new Error(`Resource already registered: ${uri}`);
    }

    // Validate definition
    if (!definition.name || typeof definition.name !== 'string') {
      throw new Error(`Resource ${uri}: name is required and must be a string`);
    }

    if (!definition.mimeType || typeof definition.mimeType !== 'string') {
      throw new Error(`Resource ${uri}: mimeType is required and must be a string`);
    }

    if (!definition.handler || typeof definition.handler !== 'function') {
      throw new Error(`Resource ${uri}: handler is required and must be a function`);
    }

    this.resources.set(uri, {
      uri,
      name: definition.name,
      description: definition.description || '',
      mimeType: definition.mimeType,
      handler: definition.handler,
      cacheable: definition.cacheable !== false,
      metadata: definition.metadata || {}
    });
  }

  /**
   * List all registered resources
   *
   * @returns {Array<Object>} Array of resource definitions (without handlers)
   */
  list() {
    return Array.from(this.resources.values()).map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
      metadata: resource.metadata
    }));
  }

  /**
   * Get a specific resource definition
   *
   * @param {string} uri - Resource URI
   * @returns {Object|null} Resource definition or null if not found
   */
  get(uri) {
    return this.resources.get(uri) || null;
  }

  /**
   * Read a resource with caching
   *
   * @param {string} uri - Resource URI
   * @returns {Promise<Object>} Resource contents
   * @throws {McpError} If resource not found or read fails
   */
  async read(uri) {
    const resource = this.resources.get(uri);

    if (!resource) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Resource not found: ${uri}`
      );
    }

    // Check cache first
    if (this.cacheEnabled && resource.cacheable) {
      const cached = this._getFromCache(uri);
      if (cached) {
        return cached;
      }
    }

    try {
      // Fetch resource
      const contents = await resource.handler();

      // Validate contents
      if (typeof contents !== 'string' && !Buffer.isBuffer(contents)) {
        throw new Error('Resource handler must return string or Buffer');
      }

      // Store in cache
      if (this.cacheEnabled && resource.cacheable) {
        this._storeInCache(uri, contents);
      }

      return {
        uri: resource.uri,
        mimeType: resource.mimeType,
        contents
      };

    } catch (error) {
      // If already an MCP error, rethrow
      if (error instanceof McpError) {
        throw error;
      }

      // Wrap other errors
      throw new McpError(
        ErrorCode.InternalError,
        `Resource read failed: ${error.message}`,
        { originalError: error.stack }
      );
    }
  }

  /**
   * Invalidate cache for a resource
   *
   * @param {string} uri - Resource URI to invalidate
   */
  invalidateCache(uri) {
    this.cache.delete(uri);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get resource from cache
   *
   * @private
   * @param {string} uri - Resource URI
   * @returns {Object|null} Cached contents or null if expired/missing
   */
  _getFromCache(uri) {
    const entry = this.cache.get(uri);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(uri);
      return null;
    }

    return entry.contents;
  }

  /**
   * Store resource in cache
   *
   * @private
   * @param {string} uri - Resource URI
   * @param {*} contents - Resource contents
   */
  _storeInCache(uri, contents) {
    this.cache.set(uri, {
      contents,
      timestamp: Date.now()
    });
  }
}

/**
 * Create registries with shared configuration
 *
 * @param {Object} config - Registry configuration
 * @returns {Object} Tool and resource registries
 */
export function createRegistries(config = {}) {
  const toolRegistry = new ToolRegistry();
  const resourceRegistry = new ResourceRegistry({
    cacheEnabled: config.cache?.enabled !== false,
    cacheTTL: config.cache?.ttl || 60000
  });

  return {
    tools: toolRegistry,
    resources: resourceRegistry
  };
}

/**
 * @typedef {Object} ToolDefinition
 * @property {string} name - Tool name
 * @property {string} description - Tool description
 * @property {Object} inputSchema - JSON Schema for input validation
 * @property {Function} handler - Async handler function
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} ResourceDefinition
 * @property {string} uri - Resource URI
 * @property {string} name - Resource name
 * @property {string} description - Resource description
 * @property {string} mimeType - MIME type
 * @property {Function} handler - Async handler function
 * @property {boolean} cacheable - Whether to cache
 * @property {Object} metadata - Additional metadata
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} contents - Cached contents
 * @property {number} timestamp - Cache timestamp
 */

export default { ToolRegistry, ResourceRegistry, createRegistries };
