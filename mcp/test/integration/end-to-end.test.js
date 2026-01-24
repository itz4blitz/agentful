import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from '../../server.js';
import { MockExecutor } from '../fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment, waitFor, createTestProductSpec } from '../fixtures/test-helpers.js';

/**
 * End-to-End Integration Tests
 *
 * Tests the full MCP flow:
 * - Client → Server → Tool → Execution → Result
 * - Resource access and caching
 * - Error handling across the stack
 * - Real-world usage scenarios
 */
describe('MCP End-to-End Integration', () => {
  let server;
  let testDir;
  let mockExecutor;

  beforeEach(async () => {
    testDir = await createTestEnvironment();
    await createTestProductSpec(testDir);

    mockExecutor = new MockExecutor({ executionDelay: 50 });

    server = createMCPServer({
      projectRoot: testDir,
      executor: mockExecutor
    });
  });

  afterEach(async () => {
    mockExecutor.reset();
    await cleanupTestEnvironment(testDir);
  });

  describe('Full Agent Launch Flow', () => {
    it('should complete full agent launch → status → result flow', async () => {
      // Step 1: Launch agent
      const launchResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Implement authentication API'
            }
          }
        },
        'CallToolResultSchema'
      );

      const launchResponse = JSON.parse(launchResult.content[0].text);
      const executionId = launchResponse.executionId;

      expect(executionId).toBeDefined();
      expect(launchResponse.status).toBe('started');

      // Step 2: Wait for execution to be tracked
      await waitFor(() => mockExecutor.executions.size > 0);

      // Step 3: Check status
      const statusResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'get_execution_status',
            arguments: { executionId }
          }
        },
        'CallToolResultSchema'
      );

      const statusResponse = JSON.parse(statusResult.content[0].text);
      expect(statusResponse).toBeDefined();
      expect(statusResponse.agent).toBe('backend');

      // Step 4: Wait for completion
      await waitFor(() => {
        const status = mockExecutor.getExecutionStatus(executionId);
        return status && status.status === 'completed';
      }, 1000);

      // Step 5: Get final status
      const finalStatusResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'get_execution_status',
            arguments: { executionId }
          }
        },
        'CallToolResultSchema'
      );

      const finalStatus = JSON.parse(finalStatusResult.content[0].text);
      expect(finalStatus.status).toBe('completed');
      expect(finalStatus.output).toBeDefined();
    });

    it('should handle concurrent agent launches', async () => {
      // Launch multiple agents concurrently
      const launches = await Promise.all([
        server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: { agent: 'backend', task: 'Backend task' }
            }
          },
          'CallToolResultSchema'
        ),
        server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: { agent: 'frontend', task: 'Frontend task' }
            }
          },
          'CallToolResultSchema'
        )
      ]);

      expect(launches).toHaveLength(2);

      const executionIds = launches.map(r => JSON.parse(r.content[0].text).executionId);

      // All should have unique IDs
      expect(executionIds[0]).not.toBe(executionIds[1]);

      // Wait for all to be tracked
      await waitFor(() => mockExecutor.executions.size === 2);

      // All should be trackable
      executionIds.forEach(id => {
        const status = mockExecutor.getExecutionStatus(id);
        expect(status).toBeDefined();
      });
    });
  });

  describe('Resource Access Integration', () => {
    it('should read state resource', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents).toBeDefined();
      expect(result.contents[0].uri).toBe('agentful://state');

      const state = JSON.parse(result.contents[0].text);
      expect(state.currentPhase).toBeDefined();
      expect(state.progress).toBeDefined();
    });

    it('should read completion resource', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://completion' }
        },
        'ReadResourceResultSchema'
      );

      const completion = JSON.parse(result.contents[0].text);
      expect(completion.totalFeatures).toBeDefined();
      expect(completion.completedFeatures).toBeDefined();
      expect(completion.completionPercentage).toBeDefined();
    });

    it('should read product spec resource', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://product-spec' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents[0].mimeType).toBe('text/markdown');
      expect(result.contents[0].text).toContain('Test Product Specification');
    });

    it('should list all resources', async () => {
      const result = await server.getServer().request(
        {
          method: 'resources/list'
        },
        'ListResourcesResultSchema'
      );

      expect(result.resources).toHaveLength(4);

      const uris = result.resources.map(r => r.uri);
      expect(uris).toContain('agentful://state');
      expect(uris).toContain('agentful://completion');
      expect(uris).toContain('agentful://product-spec');
      expect(uris).toContain('agentful://architecture');
    });
  });

  describe('Tool Listing and Discovery', () => {
    it('should list all available tools', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);

      const toolNames = result.tools.map(t => t.name);
      expect(toolNames).toContain('launch_specialist');
      expect(toolNames).toContain('get_execution_status');
      expect(toolNames).toContain('list_agents');
    });

    it('should provide tool schemas for client validation', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/list'
        },
        'ListToolsResultSchema'
      );

      const launchTool = result.tools.find(t => t.name === 'launch_specialist');

      expect(launchTool).toBeDefined();
      expect(launchTool.description).toBeTruthy();
      expect(launchTool.inputSchema).toBeDefined();
    });
  });

  describe('Error Handling Across Stack', () => {
    it('should handle invalid agent name throughout stack', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: { agent: 'invalid-agent', task: 'Test' }
            }
          },
          'CallToolResultSchema'
        );
      }).rejects.toThrow('Agent not found');
    });

    it('should handle unknown tool gracefully', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'unknown_tool',
              arguments: {}
            }
          },
          'CallToolResultSchema'
        );
      }).rejects.toThrow('Unknown tool');
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
      }).rejects.toThrow('Unknown resource');
    });

    it('should handle execution errors', async () => {
      mockExecutor = new MockExecutor({ shouldFail: true, executionDelay: 50 });

      server = createMCPServer({
        projectRoot: testDir,
        executor: mockExecutor
      });

      const launchResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Test' }
          }
        },
        'CallToolResultSchema'
      );

      const executionId = JSON.parse(launchResult.content[0].text).executionId;

      // Wait for failure
      await waitFor(() => {
        const status = mockExecutor.getExecutionStatus(executionId);
        return status && status.status === 'failed';
      }, 1000);

      const statusResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'get_execution_status',
            arguments: { executionId }
          }
        },
        'CallToolResultSchema'
      );

      const status = JSON.parse(statusResult.content[0].text);
      expect(status.status).toBe('failed');
      expect(status.error).toBeDefined();
    });
  });

  describe('Real-World Usage Scenarios', () => {
    it('should support typical development workflow', async () => {
      // 1. List available agents
      const agentsResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: { name: 'list_agents', arguments: {} }
        },
        'CallToolResultSchema'
      );

      const agents = JSON.parse(agentsResult.content[0].text);
      expect(agents.agents).toContain('backend');
      expect(agents.agents).toContain('frontend');

      // 2. Read product spec to understand requirements
      const specResult = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://product-spec' }
        },
        'ReadResourceResultSchema'
      );

      expect(specResult.contents[0].text).toContain('Authentication');

      // 3. Launch backend agent for auth feature
      const launchResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Implement authentication API as specified in product spec'
            }
          }
        },
        'CallToolResultSchema'
      );

      const executionId = JSON.parse(launchResult.content[0].text).executionId;

      // 4. Monitor progress
      await waitFor(() => mockExecutor.executions.size > 0);

      const statusResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'get_execution_status',
            arguments: { executionId }
          }
        },
        'CallToolResultSchema'
      );

      const status = JSON.parse(statusResult.content[0].text);
      expect(status).toBeDefined();
      expect(status.agent).toBe('backend');

      // 5. Check overall completion
      const completionResult = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://completion' }
        },
        'ReadResourceResultSchema'
      );

      const completion = JSON.parse(completionResult.contents[0].text);
      expect(completion.totalFeatures).toBeGreaterThan(0);
    });

    it('should handle cancellation workflow', async () => {
      mockExecutor = new MockExecutor({ executionDelay: 1000 });

      server = createMCPServer({
        projectRoot: testDir,
        executor: mockExecutor
      });

      // 1. Launch long-running agent
      const launchResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Long task' }
          }
        },
        'CallToolResultSchema'
      );

      const executionId = JSON.parse(launchResult.content[0].text).executionId;

      // 2. Wait for it to start
      await waitFor(() => {
        const status = mockExecutor.getExecutionStatus(executionId);
        return status && status.status === 'running';
      });

      // 3. Cancel it
      const cancelResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'cancel_execution',
            arguments: { executionId }
          }
        },
        'CallToolResultSchema'
      );

      const cancelResponse = JSON.parse(cancelResult.content[0].text);
      expect(cancelResponse.cancelled).toBe(true);

      // 4. Verify it's cancelled
      const statusResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'get_execution_status',
            arguments: { executionId }
          }
        },
        'CallToolResultSchema'
      );

      const status = JSON.parse(statusResult.content[0].text);
      expect(status.status).toBe('cancelled');
    });

    it('should support progress update workflow', async () => {
      // 1. Read current completion
      const beforeResult = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://completion' }
        },
        'ReadResourceResultSchema'
      );

      const beforeCompletion = JSON.parse(beforeResult.contents[0].text);
      expect(beforeCompletion).toBeDefined();

      // 2. Update progress
      const updateResult = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'update_progress',
            arguments: {
              featureId: 'auth',
              progress: 75,
              status: 'in_progress'
            }
          }
        },
        'CallToolResultSchema'
      );

      const updateResponse = JSON.parse(updateResult.content[0].text);
      expect(updateResponse.message).toBe('Progress updated');
    });

    it('should support validation workflow', async () => {
      // Run all validations
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'run_validation',
            arguments: { checks: ['all'] }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.checks).toContain('all');
      expect(response.message).toBe('Validation started');
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent state across operations', async () => {
      // Read state twice
      const result1 = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      const result2 = await server.getServer().request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result1.contents[0].text).toBe(result2.contents[0].text);
    });

    it('should track all launched executions', async () => {
      const launches = await Promise.all([
        server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: { agent: 'backend', task: 'Task 1' }
            }
          },
          'CallToolResultSchema'
        ),
        server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: { agent: 'frontend', task: 'Task 2' }
            }
          },
          'CallToolResultSchema'
        )
      ]);

      const executionIds = launches.map(r => JSON.parse(r.content[0].text).executionId);

      await waitFor(() => mockExecutor.executions.size === 2);

      // All should be retrievable
      for (const id of executionIds) {
        const statusResult = await server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'get_execution_status',
              arguments: { executionId: id }
            }
          },
          'CallToolResultSchema'
        );

        const status = JSON.parse(statusResult.content[0].text);
        expect(status).toBeDefined();
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle rapid tool calls', async () => {
      const calls = Array.from({ length: 10 }, (_, i) =>
        server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'list_agents',
              arguments: {}
            }
          },
          'CallToolResultSchema'
        )
      );

      const results = await Promise.all(calls);
      expect(results).toHaveLength(10);

      results.forEach(result => {
        expect(result.content[0].text).toBeDefined();
      });
    });

    it('should handle rapid resource reads', async () => {
      const reads = Array.from({ length: 10 }, () =>
        server.getServer().request(
          {
            method: 'resources/read',
            params: { uri: 'agentful://state' }
          },
          'ReadResourceResultSchema'
        )
      );

      const results = await Promise.all(reads);
      expect(results).toHaveLength(10);

      results.forEach(result => {
        expect(result.contents[0].text).toBeDefined();
      });
    });
  });
});
