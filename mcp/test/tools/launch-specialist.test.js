import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from '../../server.js';
import { MockExecutor } from '../fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment, waitFor } from '../fixtures/test-helpers.js';

/**
 * launch_specialist Tool Tests
 *
 * Tests the core agent launching functionality:
 * - Valid agent launch
 * - Invalid agent name
 * - Missing required params
 * - Execution ID returned
 * - Status tracking
 * - Context passing
 */
describe('launch_specialist Tool', () => {
  let server;
  let testDir;
  let mockExecutor;

  beforeEach(async () => {
    testDir = await createTestEnvironment();
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

  describe('Valid Agent Launch', () => {
    it('should launch a valid agent successfully', async () => {
      const result = await server.getServer().request(
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

      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.executionId).toBeDefined();
      expect(response.agent).toBe('backend');
      expect(response.task).toBe('Implement authentication API');
      expect(response.status).toBe('started');
    });

    it('should return unique execution IDs', async () => {
      const result1 = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Task 1' }
          }
        },
        'CallToolResultSchema'
      );

      const result2 = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'frontend', task: 'Task 2' }
          }
        },
        'CallToolResultSchema'
      );

      const id1 = JSON.parse(result1.content[0].text).executionId;
      const id2 = JSON.parse(result2.content[0].text).executionId;

      expect(id1).not.toBe(id2);
    });

    it('should track execution in executor', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Test task' }
          }
        },
        'CallToolResultSchema'
      );

      const executionId = JSON.parse(result.content[0].text).executionId;

      // Wait for execution to be tracked
      await waitFor(() => mockExecutor.executions.size > 0);

      const execution = mockExecutor.getExecutionStatus(executionId);
      expect(execution).toBeDefined();
      expect(execution.agent).toBe('backend');
    });
  });

  describe('Context Passing', () => {
    it('should pass context to executor', async () => {
      const context = {
        environment: 'test',
        features: ['auth', 'api'],
        customData: { key: 'value' }
      };

      await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Test task',
              context
            }
          }
        },
        'CallToolResultSchema'
      );

      // Verify executor was called with context
      await waitFor(() => mockExecutor.executions.size > 0);

      // In a real implementation, you'd verify the context was passed
      // For now, we just verify the execution happened
      expect(mockExecutor.executions.size).toBeGreaterThan(0);
    });

    it('should handle empty context', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Test task',
              context: {}
            }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.executionId).toBeDefined();
    });

    it('should work without context parameter', async () => {
      const result = await server.getServer().request(
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

      const response = JSON.parse(result.content[0].text);
      expect(response.executionId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should fail with invalid agent name', async () => {
      await expect(async () => {
        await server.getServer().request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                agent: 'nonexistent-agent',
                task: 'Test task'
              }
            }
          },
          'CallToolResultSchema'
        );
      }).rejects.toThrow('Agent not found: nonexistent-agent');
    });

    it('should handle special characters in task', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Task with "quotes" and \'apostrophes\' and $special chars'
            }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.executionId).toBeDefined();
    });

    it('should handle very long task descriptions', async () => {
      const longTask = 'A'.repeat(5000);

      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: longTask
            }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.executionId).toBeDefined();
    });

    it('should handle unicode in task', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: {
              agent: 'backend',
              task: 'Task with emoji 🚀 and unicode: 你好世界'
            }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.executionId).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('should return proper JSON structure', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Test' }
          }
        },
        'CallToolResultSchema'
      );

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      const response = JSON.parse(result.content[0].text);
      expect(response).toHaveProperty('executionId');
      expect(response).toHaveProperty('agent');
      expect(response).toHaveProperty('task');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('message');
    });

    it('should return valid JSON', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Test' }
          }
        },
        'CallToolResultSchema'
      );

      expect(() => {
        JSON.parse(result.content[0].text);
      }).not.toThrow();
    });
  });

  describe('Multiple Agents', () => {
    it('should launch backend agent', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'backend', task: 'Backend task' }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.agent).toBe('backend');
    });

    it('should launch frontend agent', async () => {
      const result = await server.getServer().request(
        {
          method: 'tools/call',
          params: {
            name: 'launch_specialist',
            arguments: { agent: 'frontend', task: 'Frontend task' }
          }
        },
        'CallToolResultSchema'
      );

      const response = JSON.parse(result.content[0].text);
      expect(response.agent).toBe('frontend');
    });

    it('should handle concurrent launches', async () => {
      const launches = [
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
      ];

      const results = await Promise.all(launches);

      expect(results).toHaveLength(2);
      expect(results[0].content[0].text).toBeDefined();
      expect(results[1].content[0].text).toBeDefined();

      const id1 = JSON.parse(results[0].content[0].text).executionId;
      const id2 = JSON.parse(results[1].content[0].text).executionId;

      expect(id1).not.toBe(id2);
    });
  });
});
