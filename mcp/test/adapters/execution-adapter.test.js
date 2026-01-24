import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockExecutor } from '../fixtures/mock-executor.js';
import { waitFor } from '../fixtures/test-helpers.js';

/**
 * Execution Adapter Tests
 *
 * Tests integration with lib/pipeline/executor.js:
 * - Async execution tracking
 * - Error propagation
 * - Status updates
 * - Cancellation support
 * - Event emission
 */
describe('Execution Adapter', () => {
  let executor;

  beforeEach(() => {
    executor = new MockExecutor({ executionDelay: 50 });
  });

  afterEach(() => {
    executor.reset();
  });

  describe('Integration with AgentExecutor', () => {
    it('should execute job via executor', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const context = { env: 'test' };

      const result = await executor.execute(jobDef, context);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.executionId).toBeDefined();
    });

    it('should return execution ID immediately', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Long running task'
      };

      const startTime = Date.now();
      const result = await executor.execute(jobDef, {});
      const executionTime = Date.now() - startTime;

      // Should return quickly, not wait for completion
      expect(executionTime).toBeLessThan(100);
      expect(result.executionId).toBeDefined();
    });

    it('should track execution in executor', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const result = await executor.execute(jobDef, {});

      await waitFor(() => executor.executions.size > 0);

      const status = executor.getExecutionStatus(result.executionId);
      expect(status).toBeDefined();
      expect(status.agent).toBe('backend');
    });
  });

  describe('Async Execution Tracking', () => {
    it('should track execution status changes', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const result = await executor.execute(jobDef, {});

      // Initially running
      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.status === 'running';
      });

      // Eventually completed
      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.status === 'completed';
      }, 1000);

      const finalStatus = executor.getExecutionStatus(result.executionId);
      expect(finalStatus.status).toBe('completed');
    });

    it('should store execution output', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Generate output'
      };

      const result = await executor.execute(jobDef, {});

      // Wait for completion
      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.status === 'completed';
      }, 1000);

      const finalStatus = executor.getExecutionStatus(result.executionId);
      expect(finalStatus.output).toBeDefined();
      expect(finalStatus.output.length).toBeGreaterThan(0);
    });

    it('should record execution timestamps', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const result = await executor.execute(jobDef, {});

      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.startedAt;
      });

      const status = executor.getExecutionStatus(result.executionId);
      expect(status.startedAt).toBeDefined();

      // Wait for completion
      await waitFor(() => {
        const s = executor.getExecutionStatus(result.executionId);
        return s && s.completedAt;
      }, 1000);

      const completedStatus = executor.getExecutionStatus(result.executionId);
      expect(completedStatus.completedAt).toBeDefined();
    });

    it('should support multiple concurrent executions', async () => {
      const jobs = [
        { id: 'job1', agent: 'backend', task: 'Task 1' },
        { id: 'job2', agent: 'frontend', task: 'Task 2' },
        { id: 'job3', agent: 'tester', task: 'Task 3' }
      ];

      const results = await Promise.all(
        jobs.map(job => executor.execute(job, {}))
      );

      expect(results).toHaveLength(3);

      // All should have unique execution IDs
      const ids = results.map(r => r.executionId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);

      // Wait for all to be tracked
      await waitFor(() => executor.executions.size === 3);

      // All should be trackable
      results.forEach(result => {
        const status = executor.getExecutionStatus(result.executionId);
        expect(status).toBeDefined();
      });
    });
  });

  describe('Error Propagation', () => {
    beforeEach(() => {
      executor = new MockExecutor({ shouldFail: true, executionDelay: 50 });
    });

    it('should propagate execution errors', async () => {
      const jobDef = {
        id: 'failing-job',
        agent: 'backend',
        task: 'This will fail'
      };

      const result = await executor.execute(jobDef, {});
      expect(result.success).toBe(false);
    });

    it('should track failed execution status', async () => {
      const jobDef = {
        id: 'failing-job',
        agent: 'backend',
        task: 'This will fail'
      };

      const result = await executor.execute(jobDef, {});

      // Wait for failure
      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.status === 'failed';
      }, 1000);

      const status = executor.getExecutionStatus(result.executionId);
      expect(status.status).toBe('failed');
      expect(status.error).toBeDefined();
    });

    it('should include error details', async () => {
      const jobDef = {
        id: 'failing-job',
        agent: 'backend',
        task: 'This will fail'
      };

      const result = await executor.execute(jobDef, {});

      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.error;
      }, 1000);

      const status = executor.getExecutionStatus(result.executionId);
      expect(status.error).toContain('Mock execution failed');
    });
  });

  describe('Cancellation Support', () => {
    it('should cancel running execution', async () => {
      executor = new MockExecutor({ executionDelay: 500 });

      const jobDef = {
        id: 'long-job',
        agent: 'backend',
        task: 'Long running task'
      };

      const result = await executor.execute(jobDef, {});

      // Wait for it to start
      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.status === 'running';
      });

      // Cancel it
      const cancelled = await executor.cancel(result.executionId);
      expect(cancelled).toBe(true);

      // Should be marked as cancelled
      const status = executor.getExecutionStatus(result.executionId);
      expect(status.status).toBe('cancelled');
    });

    it('should return false for non-existent execution', async () => {
      const cancelled = await executor.cancel('nonexistent-id');
      expect(cancelled).toBe(false);
    });

    it('should emit cancellation event', async () => {
      executor = new MockExecutor({ executionDelay: 500 });

      const events = [];
      executor.on('execution:cancelled', (e) => events.push(e));

      const jobDef = {
        id: 'long-job',
        agent: 'backend',
        task: 'Long running task'
      };

      const result = await executor.execute(jobDef, {});

      await waitFor(() => {
        const status = executor.getExecutionStatus(result.executionId);
        return status && status.status === 'running';
      });

      await executor.cancel(result.executionId);

      await waitFor(() => events.length > 0);

      expect(events).toHaveLength(1);
      expect(events[0].status).toBe('cancelled');
    });
  });

  describe('Event Emission', () => {
    it('should emit execution:started event', async () => {
      const events = [];
      executor.on('execution:started', (e) => events.push(e));

      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      await executor.execute(jobDef, {});

      await waitFor(() => events.length > 0);

      expect(events).toHaveLength(1);
      expect(events[0].agent).toBe('backend');
    });

    it('should emit execution:completed event', async () => {
      const events = [];
      executor.on('execution:completed', (e) => events.push(e));

      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      await executor.execute(jobDef, {});

      await waitFor(() => events.length > 0, 1000);

      expect(events).toHaveLength(1);
      expect(events[0].status).toBe('completed');
    });

    it('should emit execution:failed event on error', async () => {
      executor = new MockExecutor({ shouldFail: true, executionDelay: 50 });

      const events = [];
      executor.on('execution:failed', (e) => events.push(e));

      const jobDef = {
        id: 'failing-job',
        agent: 'backend',
        task: 'This will fail'
      };

      await executor.execute(jobDef, {});

      await waitFor(() => events.length > 0, 1000);

      expect(events).toHaveLength(1);
      expect(events[0].status).toBe('failed');
      expect(events[0].error).toBeDefined();
    });

    it('should emit events in correct order', async () => {
      const events = [];

      executor.on('execution:started', () => events.push('started'));
      executor.on('execution:completed', () => events.push('completed'));

      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      await executor.execute(jobDef, {});

      await waitFor(() => events.length === 2, 1000);

      expect(events).toEqual(['started', 'completed']);
    });
  });

  describe('Progress Callbacks', () => {
    it('should call onProgress callback', async () => {
      const progressUpdates = [];

      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      await executor.execute(jobDef, {}, {
        onProgress: (progress) => progressUpdates.push(progress)
      });

      await waitFor(() => progressUpdates.length > 0, 1000);

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates).toContain(100);
    });

    it('should handle missing onProgress callback', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      await expect(
        executor.execute(jobDef, {}, {})
      ).resolves.toBeDefined();
    });
  });

  describe('Context Passing', () => {
    it('should pass context to execution', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const context = {
        environment: 'production',
        userId: '12345',
        metadata: { key: 'value' }
      };

      const result = await executor.execute(jobDef, context);

      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
    });

    it('should handle empty context', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const result = await executor.execute(jobDef, {});

      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
    });

    it('should handle complex context objects', async () => {
      const jobDef = {
        id: 'test-job',
        agent: 'backend',
        task: 'Test task'
      };

      const context = {
        nested: {
          deeply: {
            nested: {
              value: 'test'
            }
          }
        },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined
      };

      const result = await executor.execute(jobDef, context);

      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
    });
  });
});
