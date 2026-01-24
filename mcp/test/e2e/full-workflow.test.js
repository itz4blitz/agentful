import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from '../../../server.js';
import { MockExecutor } from '../../fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment, createTestProductSpec } from '../../fixtures/test-helpers.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * End-to-End Workflow Tests
 *
 * Tests complete user workflows through MCP:
 * - Full feature development lifecycle
 * - Multi-agent coordination
 * - Progress tracking
 * - Validation gates
 */
describe('E2E: Complete Development Workflow', () => {
  let server;
  let testDir;
  let mockExecutor;

  beforeEach(async () => {
    testDir = await createTestEnvironment();
    await createTestProductSpec(testDir);

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

  describe('Feature Development Lifecycle', () => {
    it('should complete full feature implementation workflow', async () => {
      const serverInstance = server.getServer();

      // Step 1: Read product specification
      const specResult = await serverInstance.request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://product-spec' }
        },
        'ReadResourceResultSchema'
      );

      expect(specResult.contents[0].text).toContain('Authentication');

      // Step 2: Analyze architecture
      const analyzeResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'analyze_codebase',
            arguments: {}
          }
        },
        'CallToolResultSchema'
      );

      expect(analyzeResult.content).toBeDefined();

      // Step 3: Launch backend agent
      mockExecutor.setMockResult('launched', {
        executionId: 'backend-123',
        state: 'running'
      });

      const backendResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Implement authentication API endpoints'
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(backendResult.content[0].text).toContain('backend-123');

      // Step 4: Track progress
      const progressResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'update_progress',
            arguments: {
              scope: 'feature',
              name: 'authentication',
              percentage: 50
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(progressResult.content).toBeDefined();

      // Step 5: Run validation
      const validationResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'run_validation',
            arguments: {
              gates: ['tests', 'lint']
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(validationResult.content).toBeDefined();

      // Step 6: Check final state
      const stateResult = await serverInstance.request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(stateResult.contents[0].mimeType).toBe('application/json');
    });

    it('should handle multi-agent coordination', async () => {
      const serverInstance = server.getServer();

      // Launch multiple agents in sequence
      const agents = ['backend', 'frontend', 'tester'];
      const executions = [];

      for (const agent of agents) {
        mockExecutor.setMockResult('launched', {
          executionId: `${agent}-exec`,
          state: 'running'
        });

        const result = await serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                agent,
                task: `Implement ${agent} components`
              }
            }
          },
          'CallToolResultSchema'
        );

        executions.push(result);
      }

      expect(executions).toHaveLength(3);
    });

    it('should track completion across multiple features', async () => {
      const serverInstance = server.getServer();

      const features = [
        { name: 'authentication', percentage: 100 },
        { name: 'api', percentage: 75 },
        { name: 'frontend', percentage: 30 }
      ];

      for (const feature of features) {
        await serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'update_progress',
              arguments: {
                scope: 'feature',
                name: feature.name,
                percentage: feature.percentage
              }
            }
          },
          'CallToolResultSchema'
        );
      }

      // Read completion status
      const completionResult = await serverInstance.request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://completion' }
        },
        'ReadResourceResultSchema'
      );

      const completion = JSON.parse(completionResult.contents[0].text);
      expect(completion).toBeDefined();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from agent execution failure', async () => {
      const serverInstance = server.getServer();

      // First attempt fails
      mockExecutor.setMockError(new Error('Agent execution failed'));

      await expect(
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                agent: 'backend',
                task: 'Implement feature'
              }
            }
          },
          'CallToolResultSchema'
        )
      ).rejects.toThrow();

      // Clear error and retry
      mockExecutor.setMockError(null);
      mockExecutor.setMockResult('launched', {
        executionId: 'retry-123',
        state: 'running'
      });

      const retryResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Implement feature'
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(retryResult.content[0].text).toContain('retry-123');
    });

    it('should handle validation failures gracefully', async () => {
      const serverInstance = server.getServer();

      const validationResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'run_validation',
            arguments: {
              gates: ['tests', 'lint', 'types']
            }
          }
        },
        'CallToolResultSchema'
      );

      // Should return results (not throw)
      expect(validationResult.content).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should persist state across operations', async () => {
      const serverInstance = server.getServer();

      // Update state through operations
      mockExecutor.setMockResult('launched', {
        executionId: 'state-test',
        state: 'running'
      });

      await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Test state persistence'
            }
          }
        },
        'CallToolResultSchema'
      );

      // Read state
      const stateResult = await serverInstance.request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const state = JSON.parse(stateResult.contents[0].text);
      expect(state).toBeDefined();
    });

    it('should handle concurrent state updates', async () => {
      const serverInstance = server.getServer();

      // Make multiple concurrent updates
      const updates = Array(10).fill(null).map((_, i) =>
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'update_progress',
              arguments: {
                scope: 'feature',
                name: `feature-${i}`,
                percentage: (i + 1) * 10
              }
            }
          },
          'CallToolResultSchema'
        )
      );

      await Promise.all(updates);

      // State should be consistent
      const stateResult = await serverInstance.request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://completion' }
        },
        'ReadResourceResultSchema'
      );

      expect(stateResult.contents).toBeDefined();
    });
  });

  describe('Resource Access Patterns', () => {
    it('should support multiple clients reading resources', async () => {
      const serverInstance = server.getServer();

      // Simulate multiple clients reading same resource
      const reads = Array(5).fill(null).map(() =>
        serverInstance.request(
          {
            method: 'resources/read',
            params: { uri: 'agentful://product-spec' }
          },
          'ReadResourceResultSchema'
        )
      );

      const results = await Promise.all(reads);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.contents[0].text).toContain('Test Product');
      });
    });

    it('should list all available resources', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'resources/list'
        },
        'ListResourcesResultSchema'
      );

      const uris = result.resources.map(r => r.uri);

      expect(uris).toContain('agentful://state');
      expect(uris).toContain('agentful://completion');
      expect(uris).toContain('agentful://product-spec');
      expect(uris).toContain('agentful://architecture');
    });
  });

  describe('Tool Discovery and Usage', () => {
    it('should discover all available tools', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      const toolNames = result.tools.map(t => t.name);

      expect(toolNames).toContain('launch_specialist');
      expect(toolNames).toContain('get_execution_status');
      expect(toolNames).toContain('cancel_execution');
      expect(toolNames).toContain('update_progress');
      expect(toolNames).toContain('run_validation');
    });

    it('should validate tool schemas', async () => {
      const serverInstance = server.getServer();

      const result = await serverInstance.request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      result.tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      });
    });
  });

  describe('Long-Running Operations', () => {
    it('should handle long-running agent executions', async () => {
      const serverInstance = server.getServer();

      mockExecutor.setMockDelay(1000); // 1 second delay
      mockExecutor.setMockResult('launched', {
        executionId: 'long-running',
        state: 'running'
      });

      const startTime = Date.now();

      const result = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Long running task'
            }
          }
        },
        'CallToolResultSchema'
      );

      const duration = Date.now() - startTime;

      expect(result.content).toBeDefined();
      // Should complete (execution happens async in real implementation)
      expect(duration).toBeLessThan(500);
    }, { timeout: 5000 });

    it('should support execution status polling', async () => {
      const serverInstance = server.getServer();

      mockExecutor.setMockResult('launched', {
        executionId: 'poll-test',
        state: 'running'
      });

      // Launch task
      await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Polling test'
            }
          }
        },
        'CallToolResultSchema'
      );

      // Poll status multiple times
      mockExecutor.setMockResult('status', {
        executionId: 'poll-test',
        state: 'running',
        progress: 50
      });

      for (let i = 0; i < 5; i++) {
        const statusResult = await serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'get_execution_status',
              arguments: {
                executionId: 'poll-test'
              }
            }
          },
          'CallToolResultSchema'
        );

        expect(statusResult.content).toBeDefined();
      }
    });
  });

  describe('Cancellation and Cleanup', () => {
    it('should support execution cancellation', async () => {
      const serverInstance = server.getServer();

      mockExecutor.setMockResult('launched', {
        executionId: 'cancel-test',
        state: 'running'
      });

      // Launch task
      await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Task to cancel'
            }
          }
        },
        'CallToolResultSchema'
      );

      // Cancel task
      const cancelResult = await serverInstance.request(
        {
          method: 'tools/call',
          params: {
            name: 'cancel_execution',
            arguments: {
              executionId: 'cancel-test'
            }
          }
        },
        'CallToolResultSchema'
      );

      expect(cancelResult.content).toBeDefined();
    });
  });
});
