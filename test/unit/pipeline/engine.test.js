import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PipelineEngine, JobStatus, PipelineStatus } from '../../../lib/pipeline/engine.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Pipeline Engine Unit Tests
 *
 * Tests for the core pipeline orchestration engine
 * Covers job scheduling, dependency resolution, state management, and error handling
 */

describe('PipelineEngine', () => {
  let engine;
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'pipeline-test-'));
    engine = new PipelineEngine({
      stateDir: path.join(testDir, '.agentful/pipelines'),
      enablePersistence: true,
      maxConcurrentJobs: 2,
      agentExecutor: vi.fn(async (jobDef, context, options) => {
        // Mock agent executor - add small delay to prevent immediate execution
        await new Promise(resolve => setTimeout(resolve, 10));
        return { success: true, output: { result: 'mock output' }, duration: 100 };
      })
    });
  });

  afterEach(async () => {
    // Cancel all running pipelines before cleanup
    for (const [runId] of engine.pipelines) {
      await engine.cancelPipeline(runId);
    }

    // Wait a bit for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should create engine with default options', () => {
      const eng = new PipelineEngine();
      expect(eng.options.maxConcurrentJobs).toBe(3);
      expect(eng.options.stateDir).toBe('.agentful/pipelines');
      expect(eng.options.enablePersistence).toBe(true);
    });

    it('should accept custom options', () => {
      const eng = new PipelineEngine({
        maxConcurrentJobs: 5,
        stateDir: '/custom/path',
        enablePersistence: false
      });
      expect(eng.options.maxConcurrentJobs).toBe(5);
      expect(eng.options.stateDir).toBe('/custom/path');
      expect(eng.options.enablePersistence).toBe(false);
    });

    it('should initialize empty state', () => {
      expect(engine.pipelines.size).toBe(0);
      expect(engine.runningJobs.size).toBe(0);
      expect(engine.jobQueue.length).toBe(0);
      expect(engine.activeJobCount).toBe(0);
    });
  });

  describe('loadPipeline', () => {
    it('should load and validate pipeline from YAML file', async () => {
      const pipelineFile = path.join(testDir, 'pipeline.yml');
      const pipelineYaml = `
name: test-pipeline
version: 1.0
jobs:
  - id: job1
    name: Test Job
    agent: test-agent
    task: Test task
`;
      await fs.writeFile(pipelineFile, pipelineYaml);

      const pipeline = await engine.loadPipeline(pipelineFile);
      expect(pipeline.name).toBe('test-pipeline');
      expect(pipeline.jobs).toHaveLength(1);
      expect(pipeline.jobs[0].id).toBe('job1');
    });

    it('should throw error for invalid YAML', async () => {
      const pipelineFile = path.join(testDir, 'invalid.yml');
      await fs.writeFile(pipelineFile, 'invalid: yaml: content:');

      await expect(engine.loadPipeline(pipelineFile)).rejects.toThrow();
    });

    it('should throw error for missing file', async () => {
      await expect(engine.loadPipeline('/nonexistent.yml')).rejects.toThrow();
    });
  });

  describe('_validatePipeline', () => {
    it('should accept valid pipeline', () => {
      const pipeline = {
        name: 'valid-pipeline',
        jobs: [
          { id: 'job1', agent: 'test-agent', task: 'Test' }
        ]
      };
      expect(() => engine._validatePipeline(pipeline)).not.toThrow();
    });

    it('should reject pipeline without name', () => {
      const pipeline = {
        jobs: [{ id: 'job1', agent: 'test-agent' }]
      };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Pipeline must have a name');
    });

    it('should reject pipeline without jobs', () => {
      const pipeline = { name: 'test' };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Pipeline must have at least one job');
    });

    it('should reject pipeline with empty jobs array', () => {
      const pipeline = { name: 'test', jobs: [] };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Pipeline must have at least one job');
    });

    it('should reject job without id', () => {
      const pipeline = {
        name: 'test',
        jobs: [{ agent: 'test-agent' }]
      };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Each job must have an id');
    });

    it('should reject job without agent', () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1' }]
      };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Job job1 must specify an agent');
    });

    it('should reject duplicate job ids', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job1', agent: 'agent2' }
        ]
      };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Duplicate job id: job1');
    });

    it('should reject dependency on unknown job', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1', dependsOn: 'unknown-job' }
        ]
      };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Job job1 depends on unknown job: unknown-job');
    });

    it('should reject circular dependencies', () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1', dependsOn: 'job2' },
          { id: 'job2', agent: 'agent2', dependsOn: 'job1' }
        ]
      };
      expect(() => engine._validatePipeline(pipeline)).toThrow('Circular dependency detected');
    });
  });

  describe('startPipeline', () => {
    it('should start pipeline from object', async () => {
      const pipeline = {
        name: 'test-pipeline',
        jobs: [
          { id: 'job1', agent: 'test-agent', task: 'Test task' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      expect(runId).toBeTruthy();
      expect(runId).toContain('test-pipeline');

      const state = engine.pipelines.get(runId);
      expect(state).toBeTruthy();
      expect(state.status).toBe(PipelineStatus.RUNNING);
    });

    it('should start pipeline from file', async () => {
      const pipelineFile = path.join(testDir, 'pipeline.yml');
      const pipelineYaml = `
name: file-pipeline
jobs:
  - id: job1
    agent: test-agent
    task: Test task
`;
      await fs.writeFile(pipelineFile, pipelineYaml);

      const runId = await engine.startPipeline(pipelineFile);
      expect(runId).toBeTruthy();
      expect(runId).toContain('file-pipeline');
    });

    it('should initialize pipeline state correctly', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const runId = await engine.startPipeline(pipeline, { customVar: 'value' });
      const state = engine.pipelines.get(runId);

      expect(state.runId).toBe(runId);
      expect(state.pipeline).toBe(pipeline);
      expect(state.status).toBe(PipelineStatus.RUNNING);
      expect(state.startedAt).toBeTruthy();
      expect(state.context).toEqual({ customVar: 'value' });
      expect(state.jobs.job1).toBeTruthy();
      // Job may be PENDING, QUEUED, or RUNNING depending on execution speed
      expect([JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING]).toContain(state.jobs.job1.status);
    });

    it('should emit pipeline:started event', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const eventPromise = new Promise((resolve) => {
        engine.once('pipeline:started', resolve);
      });

      await engine.startPipeline(pipeline);
      const event = await eventPromise;

      expect(event.pipeline).toBe('test');
      expect(event.runId).toBeTruthy();
    });
  });

  describe('getPipelineStatus', () => {
    it('should return null for non-existent pipeline', () => {
      const status = engine.getPipelineStatus('nonexistent-id');
      expect(status).toBeNull();
    });

    it('should return status for existing pipeline', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const runId = await engine.startPipeline(pipeline);
      const status = engine.getPipelineStatus(runId);

      expect(status).toBeTruthy();
      expect(status.runId).toBe(runId);
      expect(status.pipeline).toBe('test');
      expect(status.status).toBe(PipelineStatus.RUNNING);
      expect(status.jobs).toHaveLength(1);
    });

    it('should calculate progress correctly', async () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      const state = engine.pipelines.get(runId);

      // Mark one job completed
      state.jobs.job1.status = JobStatus.COMPLETED;

      const status = engine.getPipelineStatus(runId);
      expect(status.progress).toBe(50);
    });
  });

  describe('cancelPipeline', () => {
    it('should return false for non-existent pipeline', async () => {
      const result = await engine.cancelPipeline('nonexistent-id');
      expect(result).toBe(false);
    });

    it('should cancel pipeline and all jobs', async () => {
      const pipeline = {
        name: 'test',
        jobs: [
          { id: 'job1', agent: 'agent1' },
          { id: 'job2', agent: 'agent2' }
        ]
      };

      const runId = await engine.startPipeline(pipeline);
      const result = await engine.cancelPipeline(runId);

      expect(result).toBe(true);

      const state = engine.pipelines.get(runId);
      expect(state.status).toBe(PipelineStatus.CANCELLED);
      expect(state.completedAt).toBeTruthy();
    });

    it('should emit pipeline:cancelled event', async () => {
      const pipeline = {
        name: 'test',
        jobs: [{ id: 'job1', agent: 'agent1' }]
      };

      const runId = await engine.startPipeline(pipeline);

      const eventPromise = new Promise((resolve) => {
        engine.once('pipeline:cancelled', resolve);
      });

      await engine.cancelPipeline(runId);
      const event = await eventPromise;

      expect(event.runId).toBe(runId);
    });
  });

  describe('_buildDependencyGraph', () => {
    it('should build graph for jobs without dependencies', () => {
      const jobs = [
        { id: 'job1', agent: 'agent1' },
        { id: 'job2', agent: 'agent2' }
      ];

      const graph = engine._buildDependencyGraph(jobs);
      expect(graph.job1).toEqual([]);
      expect(graph.job2).toEqual([]);
    });

    it('should build graph with single dependency', () => {
      const jobs = [
        { id: 'job1', agent: 'agent1' },
        { id: 'job2', agent: 'agent2', dependsOn: 'job1' }
      ];

      const graph = engine._buildDependencyGraph(jobs);
      expect(graph.job2).toEqual(['job1']);
    });

    it('should build graph with multiple dependencies', () => {
      const jobs = [
        { id: 'job1', agent: 'agent1' },
        { id: 'job2', agent: 'agent2' },
        { id: 'job3', agent: 'agent3', dependsOn: ['job1', 'job2'] }
      ];

      const graph = engine._buildDependencyGraph(jobs);
      expect(graph.job3).toEqual(['job1', 'job2']);
    });
  });

  describe('_detectCircularDependencies', () => {
    it('should not throw for valid DAG', () => {
      const jobs = [
        { id: 'job1', agent: 'agent1' },
        { id: 'job2', agent: 'agent2', dependsOn: 'job1' },
        { id: 'job3', agent: 'agent3', dependsOn: 'job2' }
      ];

      expect(() => engine._detectCircularDependencies(jobs)).not.toThrow();
    });

    it('should throw for direct circular dependency', () => {
      const jobs = [
        { id: 'job1', agent: 'agent1', dependsOn: 'job2' },
        { id: 'job2', agent: 'agent2', dependsOn: 'job1' }
      ];

      expect(() => engine._detectCircularDependencies(jobs)).toThrow('Circular dependency detected');
    });

    it('should throw for indirect circular dependency', () => {
      const jobs = [
        { id: 'job1', agent: 'agent1', dependsOn: 'job3' },
        { id: 'job2', agent: 'agent2', dependsOn: 'job1' },
        { id: 'job3', agent: 'agent3', dependsOn: 'job2' }
      ];

      expect(() => engine._detectCircularDependencies(jobs)).toThrow('Circular dependency detected');
    });
  });

  describe('_findReadyJobs', () => {
    it('should find jobs with no dependencies', () => {
      const jobs = {
        job1: { status: JobStatus.PENDING },
        job2: { status: JobStatus.PENDING }
      };
      const graph = { job1: [], job2: [] };

      const ready = engine._findReadyJobs(jobs, graph);
      expect(ready).toContain('job1');
      expect(ready).toContain('job2');
      expect(ready).toHaveLength(2);
    });

    it('should not return completed jobs', () => {
      const jobs = {
        job1: { status: JobStatus.COMPLETED },
        job2: { status: JobStatus.PENDING }
      };
      const graph = { job1: [], job2: [] };

      const ready = engine._findReadyJobs(jobs, graph);
      expect(ready).not.toContain('job1');
      expect(ready).toContain('job2');
    });

    it('should not return jobs with pending dependencies', () => {
      const jobs = {
        job1: { status: JobStatus.PENDING },
        job2: { status: JobStatus.PENDING }
      };
      const graph = { job1: [], job2: ['job1'] };

      const ready = engine._findReadyJobs(jobs, graph);
      expect(ready).toContain('job1');
      expect(ready).not.toContain('job2');
    });

    it('should return jobs when all dependencies completed', () => {
      const jobs = {
        job1: { status: JobStatus.COMPLETED },
        job2: { status: JobStatus.COMPLETED },
        job3: { status: JobStatus.PENDING }
      };
      const graph = { job1: [], job2: [], job3: ['job1', 'job2'] };

      const ready = engine._findReadyJobs(jobs, graph);
      expect(ready).toContain('job3');
    });

    it('should skip jobs with failing conditions', () => {
      const jobs = {
        job1: { status: JobStatus.COMPLETED },
        job2: { status: JobStatus.PENDING, when: "job1.status == 'failed'" }
      };
      const graph = { job1: [], job2: ['job1'] };

      const ready = engine._findReadyJobs(jobs, graph);
      expect(ready).toHaveLength(0);
      expect(jobs.job2.status).toBe(JobStatus.SKIPPED);
    });
  });

  describe('_calculateRetryDelay', () => {
    it('should use default delay without config', () => {
      const delay = engine._calculateRetryDelay(1, null);
      expect(delay).toBe(2000);
    });

    it('should use exponential backoff', () => {
      const config = { backoff: 'exponential', delayMs: 1000 };
      expect(engine._calculateRetryDelay(1, config)).toBe(1000);
      expect(engine._calculateRetryDelay(2, config)).toBe(2000);
      expect(engine._calculateRetryDelay(3, config)).toBe(4000);
    });

    it('should use linear backoff', () => {
      const config = { backoff: 'linear', delayMs: 1000 };
      expect(engine._calculateRetryDelay(1, config)).toBe(1000);
      expect(engine._calculateRetryDelay(2, config)).toBe(2000);
      expect(engine._calculateRetryDelay(3, config)).toBe(3000);
    });

    it('should use fixed delay', () => {
      const config = { backoff: 'fixed', delayMs: 1000 };
      expect(engine._calculateRetryDelay(1, config)).toBe(1000);
      expect(engine._calculateRetryDelay(5, config)).toBe(1000);
    });
  });

  describe('_calculateProgress', () => {
    it('should return 0 for no completed jobs', () => {
      const state = {
        jobs: {
          job1: { status: JobStatus.PENDING },
          job2: { status: JobStatus.PENDING }
        }
      };
      expect(engine._calculateProgress(state)).toBe(0);
    });

    it('should return 100 for all completed jobs', () => {
      const state = {
        jobs: {
          job1: { status: JobStatus.COMPLETED },
          job2: { status: JobStatus.COMPLETED }
        }
      };
      expect(engine._calculateProgress(state)).toBe(100);
    });

    it('should calculate partial progress', () => {
      const state = {
        jobs: {
          job1: { status: JobStatus.COMPLETED },
          job2: { status: JobStatus.PENDING },
          job3: { status: JobStatus.PENDING },
          job4: { status: JobStatus.PENDING }
        }
      };
      expect(engine._calculateProgress(state)).toBe(25);
    });

    it('should count skipped jobs as completed', () => {
      const state = {
        jobs: {
          job1: { status: JobStatus.COMPLETED },
          job2: { status: JobStatus.SKIPPED }
        }
      };
      expect(engine._calculateProgress(state)).toBe(100);
    });
  });

  describe('_generateRunId', () => {
    it('should generate unique run ID', () => {
      const id1 = engine._generateRunId('test');
      const id2 = engine._generateRunId('test');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('test');
      expect(id2).toContain('test');
    });

    it('should include pipeline name', () => {
      const id = engine._generateRunId('my-pipeline');
      expect(id).toContain('my-pipeline');
    });
  });

  describe('_evaluateCondition', () => {
    it('should evaluate status conditions', () => {
      const jobs = {
        job1: { status: JobStatus.COMPLETED }
      };

      const result = engine._evaluateCondition("job1.status == 'completed'", jobs);
      expect(result).toBe(true);
    });

    it('should return false for non-matching conditions', () => {
      const jobs = {
        job1: { status: JobStatus.COMPLETED }
      };

      const result = engine._evaluateCondition("job1.status == 'failed'", jobs);
      expect(result).toBe(false);
    });

    it('should handle missing jobs gracefully', () => {
      const jobs = {};
      const result = engine._evaluateCondition("job1.status == 'completed'", jobs);
      expect(result).toBe(false);
    });
  });

  describe('JobStatus constants', () => {
    it('should export all job statuses', () => {
      expect(JobStatus.PENDING).toBe('pending');
      expect(JobStatus.QUEUED).toBe('queued');
      expect(JobStatus.RUNNING).toBe('running');
      expect(JobStatus.COMPLETED).toBe('completed');
      expect(JobStatus.FAILED).toBe('failed');
      expect(JobStatus.CANCELLED).toBe('cancelled');
      expect(JobStatus.SKIPPED).toBe('skipped');
    });
  });

  describe('PipelineStatus constants', () => {
    it('should export all pipeline statuses', () => {
      expect(PipelineStatus.IDLE).toBe('idle');
      expect(PipelineStatus.RUNNING).toBe('running');
      expect(PipelineStatus.PAUSED).toBe('paused');
      expect(PipelineStatus.COMPLETED).toBe('completed');
      expect(PipelineStatus.FAILED).toBe('failed');
      expect(PipelineStatus.CANCELLED).toBe('cancelled');
    });
  });
});
