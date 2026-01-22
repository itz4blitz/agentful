import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PipelineEngine } from '../../lib/pipeline/engine.js';
import { AgentExecutor } from '../../lib/pipeline/executor.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Pipeline Integration Tests
 *
 * End-to-end tests for pipeline execution
 * Tests full pipeline flows with real components
 */

describe('Pipeline Integration', () => {
  let testDir;
  let engine;
  let executor;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'pipeline-integration-'));

    // Setup test agent directory
    const agentsDir = path.join(testDir, '.claude/agents');
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(
      path.join(agentsDir, 'test-agent.md'),
      '# Test Agent\n\nThis is a test agent for integration testing.'
    );

    // Create mock executor
    executor = {
      execute: vi.fn(async (jobDef, context, options) => {
        // Simulate agent work
        if (options.onProgress) {
          options.onProgress(50);
        }
        await new Promise(resolve => setTimeout(resolve, 10));
        if (options.onProgress) {
          options.onProgress(100);
        }
        return {
          success: true,
          output: {
            jobId: jobDef.id,
            result: `Output from ${jobDef.id}`,
            timestamp: new Date().toISOString()
          },
          duration: 10
        };
      })
    };

    // Create engine with mock executor
    engine = new PipelineEngine({
      stateDir: path.join(testDir, '.agentful/pipelines'),
      enablePersistence: true,
      maxConcurrentJobs: 2,
      agentExecutor: async (jobDef, context, options) => {
        return await executor.execute(jobDef, context, options);
      }
    });
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('Single Job Pipeline', () => {
    it('should execute pipeline with one job', async () => {
      const pipeline = {
        name: 'single-job',
        jobs: [
          { id: 'job1', agent: 'test-agent', task: 'Test task' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);

      // Wait for completion
      await waitForCompletion(engine, runId, 5000);

      const status = engine.getPipelineStatus(runId);
      expect(status.status).toBe('completed');
      expect(status.progress).toBe(100);
      expect(status.jobs[0].status).toBe('completed');
    });

    it('should pass context to job', async () => {
      const pipeline = {
        name: 'context-test',
        jobs: [
          { id: 'job1', agent: 'test-agent', task: 'Test with context' }
        ]
      };

      const context = { customVar: 'test-value', env: 'test' };
      const runId = await engine.startPipeline(pipeline, context);

      await waitForCompletion(engine, runId, 5000);

      // Verify executor received context
      expect(executor.execute).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'job1' }),
        expect.objectContaining(context),
        expect.any(Object)
      );
    });

    it('should emit events during execution', async () => {
      const pipeline = {
        name: 'events-test',
        jobs: [
          { id: 'job1', agent: 'test-agent' }
        ]
      };

      const events = [];
      engine.on('pipeline:started', (e) => events.push({ type: 'started', ...e }));
      engine.on('job:started', (e) => events.push({ type: 'job:started', ...e }));
      engine.on('job:completed', (e) => events.push({ type: 'job:completed', ...e }));
      engine.on('pipeline:completed', (e) => events.push({ type: 'completed', ...e }));

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 5000);

      expect(events).toContainEqual(expect.objectContaining({ type: 'started' }));
      expect(events).toContainEqual(expect.objectContaining({ type: 'job:started' }));
      expect(events).toContainEqual(expect.objectContaining({ type: 'job:completed' }));
      expect(events).toContainEqual(expect.objectContaining({ type: 'completed' }));
    });
  });

  describe('Multi-Job Pipeline', () => {
    it('should execute sequential jobs in order', async () => {
      const pipeline = {
        name: 'sequential',
        jobs: [
          { id: 'job1', agent: 'test-agent' },
          { id: 'job2', agent: 'test-agent', dependsOn: 'job1' },
          { id: 'job3', agent: 'test-agent', dependsOn: 'job2' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 10000);

      const status = engine.getPipelineStatus(runId);
      expect(status.status).toBe('completed');
      expect(status.progress).toBe(100);

      // All jobs should be completed
      expect(status.jobs.every(j => j.status === 'completed')).toBe(true);
    });

    it('should execute parallel jobs concurrently', async () => {
      const pipeline = {
        name: 'parallel',
        jobs: [
          { id: 'job1', agent: 'test-agent' },
          { id: 'job2', agent: 'test-agent' },
          { id: 'job3', agent: 'test-agent' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 10000);

      const status = engine.getPipelineStatus(runId);
      expect(status.status).toBe('completed');
      expect(executor.execute).toHaveBeenCalledTimes(3);
    });

    it('should execute mixed parallel and sequential jobs', async () => {
      const pipeline = {
        name: 'mixed',
        jobs: [
          { id: 'job1', agent: 'test-agent' },
          { id: 'job2', agent: 'test-agent' },
          { id: 'job3', agent: 'test-agent', dependsOn: ['job1', 'job2'] }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 10000);

      const status = engine.getPipelineStatus(runId);
      expect(status.status).toBe('completed');
      expect(status.jobs.find(j => j.id === 'job3').status).toBe('completed');
    });

    it('should pass outputs between dependent jobs', async () => {
      const pipeline = {
        name: 'output-chain',
        jobs: [
          { id: 'job1', agent: 'test-agent' },
          { id: 'job2', agent: 'test-agent', dependsOn: 'job1' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 10000);

      // Verify second job received first job's output in context
      const job2Call = executor.execute.mock.calls.find(call => call[0].id === 'job2');
      expect(job2Call).toBeDefined();
      expect(job2Call[1].job1).toBeDefined(); // Output from job1 should be in context
    });
  });

  describe('Error Handling', () => {
    it('should handle job failure', async () => {
      executor.execute = vi.fn(async (jobDef) => {
        if (jobDef.id === 'failing-job') {
          throw new Error('Job failed intentionally');
        }
        return { success: true, output: {}, duration: 10 };
      });

      const pipeline = {
        name: 'failure-test',
        jobs: [
          { id: 'failing-job', agent: 'test-agent' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 5000);

      const status = engine.getPipelineStatus(runId);
      expect(status.status).toBe('failed');
      expect(status.jobs[0].status).toBe('failed');
      expect(status.jobs[0].error).toBeTruthy();
    });

    it('should continue on error when configured', async () => {
      executor.execute = vi.fn(async (jobDef) => {
        if (jobDef.id === 'job1') {
          throw new Error('Job failed');
        }
        return { success: true, output: {}, duration: 10 };
      });

      const pipeline = {
        name: 'continue-on-error',
        jobs: [
          { id: 'job1', agent: 'test-agent', continueOnError: true },
          { id: 'job2', agent: 'test-agent' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 10000);

      const status = engine.getPipelineStatus(runId);
      expect(status.jobs[0].status).toBe('failed');
      expect(status.jobs[1].status).toBe('completed');
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;
      executor.execute = vi.fn(async (jobDef) => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true, output: {}, duration: 10 };
      });

      const pipeline = {
        name: 'retry-test',
        jobs: [
          {
            id: 'retry-job',
            agent: 'test-agent',
            retry: { maxAttempts: 3, backoff: 'fixed', delayMs: 100 }
          }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 10000);

      const status = engine.getPipelineStatus(runId);
      expect(status.jobs[0].status).toBe('completed');
      expect(executor.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('State Persistence', () => {
    it('should persist pipeline state to disk', async () => {
      const pipeline = {
        name: 'persistence-test',
        jobs: [
          { id: 'job1', agent: 'test-agent' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      await waitForCompletion(engine, runId, 5000);

      // Check that state file exists
      const stateFile = path.join(testDir, '.agentful/pipelines/runs', `${runId}.json`);
      const exists = await fs.access(stateFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Verify state content
      const content = await fs.readFile(stateFile, 'utf-8');
      const state = JSON.parse(content);
      expect(state.runId).toBe(runId);
      expect(state.status).toBe('completed');
    });
  });

  describe('Cancellation', () => {
    it('should cancel running pipeline', async () => {
      // Make executor slow
      executor.execute = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, output: {}, duration: 2000 };
      });

      const pipeline = {
        name: 'cancel-test',
        jobs: [
          { id: 'slow-job', agent: 'test-agent' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);

      // Wait a bit then cancel
      await new Promise(resolve => setTimeout(resolve, 100));
      const cancelled = await engine.cancelPipeline(runId);

      expect(cancelled).toBe(true);

      const status = engine.getPipelineStatus(runId);
      expect(status.status).toBe('cancelled');
    });
  });
});

/**
 * Helper: Wait for pipeline completion
 */
async function waitForCompletion(engine, runId, timeout = 10000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const status = engine.getPipelineStatus(runId);

    if (!status) {
      throw new Error(`Pipeline ${runId} not found`);
    }

    if (
      status.status === 'completed' ||
      status.status === 'failed' ||
      status.status === 'cancelled'
    ) {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Pipeline ${runId} did not complete within ${timeout}ms`);
}
