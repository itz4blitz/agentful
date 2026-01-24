import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMCPServer } from '../server.js';
import { MockExecutor } from './fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment } from './fixtures/test-helpers.js';

/**
 * MCP Server Integration Tests
 *
 * Tests the main MCP server functionality:
 * - Server initialization
 * - Tool registration
 * - Resource registration
 * - Error handling
 * - Graceful shutdown
 */
describe('MCP Server', () => {
  let server;
  let testDir;
  let mockExecutor;

  beforeEach(async () => {
    testDir = await createTestEnvironment();
    mockExecutor = new MockExecutor();

    server = createMCPServer({
      projectRoot: testDir,
      executor: mockExecutor
    });
  });

  afterEach(async () => {
    mockExecutor.reset();
    await cleanupTestEnvironment(testDir);
  });

  describe('Server Initialization', () => {
    it('should create server with default options', () => {
      const srv = createMCPServer();
      expect(srv).toBeDefined();
      expect(srv.projectRoot).toBe(process.cwd());
    });

    it('should create server with custom project root', () => {
      const customServer = createMCPServer({ projectRoot: '/custom/path' });
      expect(customServer.projectRoot).toBe('/custom/path');
    });

    it('should create server with custom executor', () => {
      const customExecutor = new MockExecutor();
      const customServer = createMCPServer({ executor: customExecutor });
      expect(customServer.executor).toBe(customExecutor);
    });

    it('should have a server instance', () => {
      const serverInstance = server.getServer();
      expect(serverInstance).toBeDefined();
      expect(serverInstance.constructor.name).toBe('Server');
    });
  });

  describe('Tool Registration', () => {
    it('should register all required tools', async () => {
      const result = await server.getServer().request(
        { method: 'tools/list' },
        'ListToolsResultSchema'
      );

      expect(result.tools).toHaveLength(8);

      const toolNames = result.tools.map(t => t.name);
      expect(toolNames).toContain('launch_specialist');
      expect(toolNames).toContain('get_execution_status');
      expect(toolNames).toContain('cancel_execution');
      expect(toolNames).toContain('update_progress');
      expect(toolNames).toContain('run_validation');
      expect(toolNames).toContain('list_agents');
      expect(toolNames).toContain('get_product_spec');
      expect(toolNames).toContain('analyze_codebase');
    });

    it('should have proper tool schemas', async () => {
      const result = await server.getServer().request(
        { method: 'tools/list' },
        'ListToolsResultSchema'
      );

      const launchTool = result.tools.find(t => t.name === 'launch_specialist');
      expect(launchTool).toBeDefined();
      expect(launchTool.description).toBeTruthy();
      expect(launchTool.inputSchema).toBeDefined();
    });

    it('should validate tool input schemas', async () => {
      const result = await server.getServer().request(
        { method: 'tools/list' },
        'ListToolsResultSchema'
      );

      const statusTool = result.tools.find(t => t.name === 'get_execution_status');
      expect(statusTool.inputSchema).toBeDefined();

      // Zod schema should have the right shape
      const schema = statusTool.inputSchema;
      expect(schema._def).toBeDefined(); // Zod internal structure
    });
  });

  describe('Resource Registration', () => {
    it('should register all required resources', async () => {
      const result = await server.getServer().request(
        { method: 'resources/list' },
        'ListResourcesResultSchema'
      );

      expect(result.resources).toHaveLength(4);

      const resourceUris = result.resources.map(r => r.uri);
      expect(resourceUris).toContain('agentful://state');
      expect(resourceUris).toContain('agentful://completion');
      expect(resourceUris).toContain('agentful://product-spec');
      expect(resourceUris).toContain('agentful://architecture');
    });

    it('should have proper resource metadata', async () => {
      const result = await server.getServer().request(
        { method: 'resources/list' },
        'ListResourcesResultSchema'
      );

      const stateResource = result.resources.find(r => r.uri === 'agentful://state');
      expect(stateResource).toBeDefined();
      expect(stateResource.name).toBe('Agentful State');
      expect(stateResource.description).toBeTruthy();
      expect(stateResource.mimeType).toBe('application/json');
    });

    it('should have correct MIME types', async () => {
      const result = await server.getServer().request(
        { method: 'resources/list' },
        'ListResourcesResultSchema'
      );

      const jsonResources = result.resources.filter(r => r.mimeType === 'application/json');
      const markdownResources = result.resources.filter(r => r.mimeType === 'text/markdown');

      expect(jsonResources).toHaveLength(3); // state, completion, architecture
      expect(markdownResources).toHaveLength(1); // product-spec
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool gracefully', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'tools/call',
            params: { name: 'unknown_tool', arguments: {} }
          },
          'CallToolResultSchema'
        );
      }).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should handle unknown resource gracefully', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'resources/read',
            params: { uri: 'agentful://unknown' }
          },
          'ReadResourceResultSchema'
        );
      }).rejects.toThrow('Unknown resource: agentful://unknown');
    });

    it('should handle missing agent file', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: { agent: 'nonexistent', task: 'Test task' }
            }
          },
          'CallToolResultSchema'
        );
      }).rejects.toThrow('Agent not found: nonexistent');
    });

    it('should handle missing execution ID', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'get_execution_status',
              arguments: { executionId: 'nonexistent-id' }
            }
          },
          'CallToolResultSchema'
        );
      }).rejects.toThrow('Execution not found: nonexistent-id');
    });
  });

  describe('Server Lifecycle', () => {
    it('should have error handler configured', () => {
      expect(server.getServer().onerror).toBeDefined();
      expect(typeof server.getServer().onerror).toBe('function');
    });

    it('should handle errors without crashing', () => {
      const error = new Error('Test error');
      expect(() => {
        server.getServer().onerror(error);
      }).not.toThrow();
    });

    it('should expose getServer method for testing', () => {
      expect(typeof server.getServer).toBe('function');
      expect(server.getServer()).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use provided project root', () => {
      expect(server.projectRoot).toBe(testDir);
    });

    it('should use provided executor', () => {
      expect(server.executor).toBe(mockExecutor);
    });

    it('should have server metadata', () => {
      const serverInstance = server.getServer();
      // MCP SDK Server doesn't expose metadata directly,
      // but we can verify it was constructed
      expect(serverInstance).toBeDefined();
    });
  });
});
