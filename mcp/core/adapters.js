/**
 * MCP Core Adapters
 *
 * Adapts existing agentful tool/resource definitions to work with
 * the registry-based architecture.
 *
 * @module mcp/core/adapters
 */

/**
 * Register existing tools with the registry
 *
 * @param {Object} registry - Tool registry instance
 * @param {Array<Object>} tools - Array of tool definitions
 * @param {Object} config - Server configuration
 */
export async function registerExistingTools(registry, tools, config) {
  for (const tool of tools) {
    try {
      registry.register(tool.name, {
        description: tool.description,
        inputSchema: tool.inputSchema,
        handler: tool.handler,
        metadata: tool.metadata || {}
      });
    } catch (error) {
      console.error(`Failed to register tool ${tool.name}:`, error.message);
    }
  }
}

/**
 * Register existing resources with the registry
 *
 * @param {Object} registry - Resource registry instance
 * @param {Array<Object>} resources - Array of resource definitions
 * @param {Object} config - Server configuration
 */
export async function registerExistingResources(registry, resources, config) {
  for (const resource of resources) {
    try {
      registry.register(resource.uri, {
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
        handler: async () => {
          // Call the resource's read method with adapters
          const { createAdapters } = await import('../resources/adapters.js');
          const adapters = createAdapters(config.agentful?.rootDir || '..');

          const result = await resource.read(adapters, {});

          // Extract text content from the result
          if (result.contents && result.contents[0]) {
            return result.contents[0].text;
          }

          return JSON.stringify(result);
        },
        cacheable: resource.cacheable !== false,
        metadata: resource.metadata || {}
      });
    } catch (error) {
      console.error(`Failed to register resource ${resource.uri}:`, error.message);
    }
  }
}

export default { registerExistingTools, registerExistingResources };
