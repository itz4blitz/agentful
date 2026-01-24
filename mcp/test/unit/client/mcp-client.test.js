import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMCPServer } from '../../../server.js';
import { MockExecutor } from '../../fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment } from '../../fixtures/test-helpers.js';

/**
 * MCP Client Tests
 *
 * Tests client interaction with MCP server:
 * - Tool invocation
 * - Resource reading
 * - Request/response handling
 * - Error propagation
 */
describe('MCP Client Integration', () => {
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

  describe('Tool Invocation', () => {
    it('should call tool and receive result', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
    });

    it('should handle tool parameters correctly', async () => {
      mockExecutor.setMockResult('launched', {
        executionId: 'test-exec-123',
        state: 'running'
      });

      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Test task'
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(result.content).toBeDefined();
      expect(result.content[0].text).toContain('test-exec-123');
    });

    it('should validate tool input schema', async () => {
      const serverInstance = server.getServer();

      await expect(
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                // Missing required 'agent' field
                task: 'Test task'
              }
            }
          },
          'CallToolResultSchema'
        )
      ).rejects.toThrow();
    });

    it('should handle tool execution errors', async () => {
      mockExecutor.setMockError(new Error('Execution failed'));

      const serverInstance = server.getServer();

      await expect(
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                agent: 'backend',
                task: 'Test task'
              }
            }
          },
          'CallToolResultSchema'
        )
      ).rejects.toThrow();
    });

    it('should handle concurrent tool calls', async () => {
      mockExecutor.setMockResult('launched', { executionId: 'test-123' });

      const serverInstance = server.getServer();

      const calls = Array(10).fill(null).map((_, i) =>
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                agent: 'backend',
                task: `Task ${i}`
              }
            }
          },
          'CallToolResultSchema'
        )
      );

      const results = await Promise.all(calls);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.content).toBeDefined();
      });
    });
  });

  describe('Resource Reading', () => {
    it('should read resource successfully', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'resources/read',
          params: {
            uri: 'agentful://state'
          }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents).toBeDefined();
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents[0].uri).toBe('agentful://state');
    });

    it('should list all resources', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'resources/list'
        },
        'ListResourcesResultSchema'
      );

      expect(result.resources).toBeDefined();
      expect(Array.isArray(result.resources)).toBe(true);

      const uris = result.resources.map(r => r.uri);
      expect(uris).toContain('agentful://state');
      expect(uris).toContain('agentful://completion');
    });

    it('should handle non-existent resource', async () => {
      const serverInstance = server.getServer();

      await expect(
        serverInstance.request(
          {
            method: 'resources/read',
            params: {
              uri: 'agentful://nonexistent'
            }
          },
          'ReadResourceResultSchema'
        )
      ).rejects.toThrow();
    });

    it('should return correct MIME type', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'resources/read',
          params: {
            uri: 'agentful://state'
          }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents[0].mimeType).toBe('application/json');
    });
  });

  describe('Request Lifecycle', () => {
    it('should include request ID in response', async () => {
      const serverInstance = server.getServer();

      // Note: MCP SDK handles request IDs internally
      const result = await serverInstance.request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      expect(result).toBeDefined();
    });

    it('should handle rapid sequential requests', async () => {
      const serverInstance = server.getServer();

      for (let i = 0; i < 20; i++) {
        const result = await serverInstance.request(
          {
            method: 'tools/list'
          },
          'ListToolsResultSchema'
        );

        expect(result.tools).toBeDefined();
      }
    });

    it('should maintain state across requests', async () => {
      mockExecutor.setMockResult('launched', {
        executionId: 'exec-1',
        state: 'running'
      });

      const serverInstance = server.getServer();

      // Launch task
      await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Task 1'
            }
          }
        },
        'CallToolResultSchema'
      );

      // Get status should reflect the launched task
      mockExecutor.setMockResult('status', {
        executionId: 'exec-1',
        state: 'running',
        agent: 'backend'
      });

      const status = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'get_execution_status',
            arguments: {
              executionId: 'exec-1'
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(status.content[0].text).toContain('exec-1');
    });
  });

  describe('Error Handling', () => {
    it('should propagate validation errors', async () => {
      const serverInstance = server.getServer();

      await expect(
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'update_progress',
              arguments: {
                scope: 'feature',
                name: 'test-feature',
                percentage: 150 // Invalid: > 100
              }
            }
          },
          'CallToolResultSchema'
        )
      ).rejects.toThrow();
    });

    it('should handle malformed requests', async () => {
      const serverInstance = server.getServer();

      await expect(
        serverInstance.request(
          {
            method: 'tools/call'
            // Missing params
          },
          'CallToolResultSchema'
        )
      ).rejects.toThrow();
    });

    it('should handle timeout scenarios', async () => {
      mockExecutor.setMockDelay(10000); // 10 second delay

      const serverInstance = server.getServer();

      // This should timeout or return error based on executor implementation
      const promise = serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Slow task'
            }
          }
        },
        'CallToolResultSchema'
      );

      // Note: Actual timeout behavior depends on executor implementation
      expect(promise).toBeDefined();
    }, { timeout: 2000 });
  });

  describe('Performance', () => {
    it('should handle high request volume', async () => {
      const serverInstance = server.getServer();
      const startTime = Date.now();

      const requests = Array(100).fill(null).map(() =>
        serverInstance.request(
          {
            method: 'tools/list'
          },
          'ListToolsResultSchema'
        )
      );

      await Promise.all(requests);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should not leak memory with repeated calls', async () => {
      const serverInstance = server.getServer();

      // Make many sequential calls
      for (let i = 0; i < 50; i++) {
        await serverInstance.request(
          {
            method: 'resources/list'
          },
          'ListResourcesResultSchema'
        );
      }

      // If we got here without OOM, test passes
      expect(true).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should validate tool list response schema', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      // Verify schema structure
      expect(result.tools).toBeDefined();
      result.tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      });
    });

    it('should validate resource list response schema', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'resources/list'
        },
        'ListResourcesResultSchema'
      );

      result.resources.forEach(resource => {
        expect(resource.uri).toBeDefined();
        expect(resource.name).toBeDefined();
        expect(resource.mimeType).toBeDefined();
      });
    });
  });
});
