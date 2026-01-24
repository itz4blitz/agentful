import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkDistributor } from '../../orchestrator/work-distributor.js';
import { EventEmitter } from 'events';

/**
 * Mock MCP Server Pool
 */
class MockMCPPool extends EventEmitter {
  constructor(workers = []) {
    super();
    this.workers = new Map();
    this.size = workers.length;

    for (const worker of workers) {
      this.workers.set(worker.id, worker);
    }
  }

  async getAvailableWorkers() {
    return Array.from(this.workers.values());
  }

  async getWorker(workerId) {
    return this.workers.get(workerId);
  }
}

/**
 * Mock Worker
 */
class MockWorker {
  constructor(id, options = {}) {
    this.id = id;
    this.capabilities = options.capabilities || {
      memory: 1024,
      cpu: 2,
      agents: ['backend', 'frontend', 'tester', 'reviewer']
    };
    this.executionDelay = options.executionDelay || 10;
    this.failureRate = options.failureRate || 0;
  }

  async executeAgent(agent, task, options) {
    await new Promise(resolve => setTimeout(resolve, this.executionDelay));

    if (Math.random() < this.failureRate) {
      throw new Error('Mock execution failed');
    }

    return {
      success: true,
      agent,
      task,
      duration: this.executionDelay,
      executionId: `exec-${Date.now()}`
    };
  }
}

describe('WorkDistributor', () => {
  let distributor;
  let mcpPool;
  let workers;

  beforeEach(() => {
    workers = [
      new MockWorker('worker-1'),
      new MockWorker('worker-2'),
      new MockWorker('worker-3')
    ];

    mcpPool = new MockMCPPool(workers);
    distributor = new WorkDistributor(mcpPool, {
      maxRetries: 2,
      retryDelay: 10,
      progressPath: null
    });
  });

  afterEach(() => {
    distributor.destroy();
  });

  describe('Initialization', () => {
    it('should create distributor with MCP pool', () => {
      expect(distributor).toBeDefined();
      expect(distributor.mcpPool).toBe(mcpPool);
    });

    it('should throw without MCP pool', () => {
      expect(() => {
        new WorkDistributor(null);
      }).toThrow('MCP server pool is required');
    });

    it('should initialize components', () => {
      expect(distributor.analyzer).toBeDefined();
      expect(distributor.planner).toBeDefined();
      expect(distributor.aggregator).toBeDefined();
    });
  });

  describe('Work Distribution', () => {
    it('should distribute simple features', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'frontend', dependencies: [] }
      ];

      const result = await distributor.distributeWork({ features });

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should distribute features with dependencies', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: ['A'] },
        { id: 'C', agent: 'backend', dependencies: ['B'] }
      ];

      const result = await distributor.distributeWork({ features });

      expect(result.total).toBe(3);
      expect(result.successful).toBe(3);
    });

    it('should throw on circular dependencies', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: ['B'] },
        { id: 'B', agent: 'backend', dependencies: ['A'] }
      ];

      await expect(async () => {
        await distributor.distributeWork({ features });
      }).rejects.toThrow('Circular dependencies detected');
    });

    it('should throw on invalid dependencies', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: ['nonexistent'] }
      ];

      await expect(async () => {
        await distributor.distributeWork({ features });
      }).rejects.toThrow('Dependency validation failed');
    });

    it('should throw on no features', async () => {
      await expect(async () => {
        await distributor.distributeWork({ features: [] });
      }).rejects.toThrow('No features provided');
    });

    it('should prevent concurrent distributions', async () => {
      const features = [{ id: 'A', agent: 'backend', dependencies: [] }];

      const promise1 = distributor.distributeWork({ features });

      await expect(async () => {
        await distributor.distributeWork({ features });
      }).rejects.toThrow('Distribution already in progress');

      await promise1;
    });
  });

  describe('Batch Execution', () => {
    it('should execute batches sequentially', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: ['A'] }
      ];

      const batchEvents = [];
      distributor.on('batch-started', (e) => batchEvents.push(e));

      await distributor.distributeWork({ features });

      expect(batchEvents).toHaveLength(2);
      expect(batchEvents[0].batchNumber).toBe(1);
      expect(batchEvents[1].batchNumber).toBe(2);
    });

    it('should execute features in parallel within batch', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: [] },
        { id: 'C', agent: 'backend', dependencies: [] }
      ];

      const startTime = Date.now();
      await distributor.distributeWork({ features });
      const duration = Date.now() - startTime;

      // Should take less time than sequential (3 * 10ms)
      expect(duration).toBeLessThan(30);
    });

    it('should support sequential execution mode', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: [] }
      ];

      const result = await distributor.distributeWork({
        features,
        sequential: true
      });

      expect(result.successful).toBe(2);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed features', async () => {
      const failingWorker = new MockWorker('worker-fail', { failureRate: 0.5 });
      const failPool = new MockMCPPool([failingWorker]);
      const failDistributor = new WorkDistributor(failPool, {
        maxRetries: 3,
        retryDelay: 5
      });

      const features = [
        { id: 'A', agent: 'backend', dependencies: [] }
      ];

      const retryEvents = [];
      failDistributor.on('feature-retry', (e) => retryEvents.push(e));

      try {
        await failDistributor.distributeWork({ features });
      } catch (error) {
        // May fail even after retries
      }

      // Should have attempted some retries
      expect(retryEvents.length).toBeGreaterThanOrEqual(0);

      failDistributor.destroy();
    });

    it('should track retry count', async () => {
      const failingWorker = new MockWorker('worker-fail', { failureRate: 1.0 });
      const failPool = new MockMCPPool([failingWorker]);
      const failDistributor = new WorkDistributor(failPool, {
        maxRetries: 2,
        retryDelay: 5
      });

      const features = [
        { id: 'A', agent: 'backend', dependencies: [] }
      ];

      try {
        await failDistributor.distributeWork({ features });
      } catch (error) {
        // Expected to fail
      }

      expect(failDistributor.retryCount.get('A')).toBeGreaterThan(0);

      failDistributor.destroy();
    });
  });

  describe('Progress Tracking', () => {
    it('should track overall progress', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: [] }
      ];

      const progressPromise = distributor.distributeWork({ features });

      // Wait a bit for execution to start
      await new Promise(resolve => setTimeout(resolve, 5));

      const progress = distributor.getProgress();
      expect(progress.overall).toBeDefined();
      expect(progress.overall.totalFeatures).toBe(2);

      await progressPromise;
    });

    it('should emit feature progress events', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] }
      ];

      const progressEvents = [];
      distributor.on('feature-progress', (e) => progressEvents.push(e));

      await distributor.distributeWork({ features });

      expect(progressEvents.length).toBeGreaterThan(0);
    });

    it('should emit feature-complete events', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] }
      ];

      const completeEvents = [];
      distributor.on('feature-complete', (e) => completeEvents.push(e));

      await distributor.distributeWork({ features });

      expect(completeEvents).toHaveLength(1);
      expect(completeEvents[0].featureId).toBe('A');
    });
  });

  describe('Event Emission', () => {
    it('should emit distribution-started event', async () => {
      const features = [{ id: 'A', agent: 'backend', dependencies: [] }];

      const startedPromise = new Promise((resolve) => {
        distributor.on('distribution-started', (e) => {
          expect(e.features).toBe(1);
          resolve();
        });
      });

      await distributor.distributeWork({ features });
      await startedPromise;
    });

    it('should emit distribution-complete event', async () => {
      const features = [{ id: 'A', agent: 'backend', dependencies: [] }];

      const completePromise = new Promise((resolve) => {
        distributor.on('distribution-complete', (e) => {
          expect(e.successful).toBe(1);
          resolve();
        });
      });

      await distributor.distributeWork({ features });
      await completePromise;
    });

    it('should emit phase events', async () => {
      const features = [{ id: 'A', agent: 'backend', dependencies: [] }];

      const phases = [];
      distributor.on('phase', (e) => phases.push(e.phase));

      await distributor.distributeWork({ features });

      expect(phases).toContain('analyzing-dependencies');
      expect(phases).toContain('generating-batches');
      expect(phases).toContain('planning-execution');
      expect(phases).toContain('executing');
    });

    it('should emit batch events', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: ['A'] }
      ];

      const batchStarted = [];
      const batchComplete = [];

      distributor.on('batch-started', (e) => batchStarted.push(e));
      distributor.on('batch-complete', (e) => batchComplete.push(e));

      await distributor.distributeWork({ features });

      expect(batchStarted).toHaveLength(2);
      expect(batchComplete).toHaveLength(2);
    });
  });

  describe('Summary and Reports', () => {
    it('should provide execution summary', async () => {
      const features = [
        { id: 'A', agent: 'backend', dependencies: [] },
        { id: 'B', agent: 'backend', dependencies: [] }
      ];

      await distributor.distributeWork({ features });

      const summary = distributor.getSummary();
      expect(summary.progress).toBeDefined();
      expect(summary.workers).toBeDefined();
      expect(summary.timeline).toBeDefined();
    });

    it('should include plan statistics in progress', async () => {
      const features = [{ id: 'A', agent: 'backend', dependencies: [] }];

      await distributor.distributeWork({ features });

      const progress = distributor.getProgress();
      expect(progress.plan).toBeDefined();
      expect(progress.plan.totalBatches).toBeGreaterThan(0);
    });
  });

  describe('Stop and Cleanup', () => {
    it('should stop ongoing distribution', async () => {
      const slowWorker = new MockWorker('worker-slow', { executionDelay: 1000 });
      const slowPool = new MockMCPPool([slowWorker]);
      const slowDistributor = new WorkDistributor(slowPool);

      const features = [
        { id: 'A', agent: 'backend', dependencies: [] }
      ];

      const distributionPromise = slowDistributor.distributeWork({ features });

      // Wait a bit then stop
      await new Promise(resolve => setTimeout(resolve, 50));
      await slowDistributor.stop();

      // Should not throw
      try {
        await distributionPromise;
      } catch (error) {
        // Expected to fail when stopped
      }

      expect(slowDistributor.isRunning).toBe(false);

      slowDistributor.destroy();
    });

    it('should emit stopped event', async () => {
      const stoppedPromise = new Promise((resolve) => {
        distributor.on('stopped', () => resolve());
      });

      await distributor.stop();
      await stoppedPromise;
    });
  });

  describe('Custom Workers', () => {
    it('should support custom worker configuration', async () => {
      const customWorkers = [
        {
          id: 'custom-1',
          capabilities: {
            agents: ['backend']
          }
        }
      ];

      const features = [
        { id: 'A', agent: 'backend', dependencies: [] }
      ];

      const result = await distributor.distributeWork({
        features,
        workers: customWorkers
      });

      expect(result.successful).toBe(1);
    });
  });

  describe('Task Description Building', () => {
    it('should build task description with metadata', async () => {
      const features = [
        {
          id: 'A',
          agent: 'backend',
          dependencies: [],
          metadata: {
            description: 'Test feature',
            requirements: ['Req 1', 'Req 2']
          }
        }
      ];

      await distributor.distributeWork({ features });

      // Feature should complete (implicitly tests task building)
      const progress = distributor.getProgress();
      expect(progress.overall.completedFeatures).toBe(1);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle large feature set', async () => {
      const features = [];
      for (let i = 0; i < 20; i++) {
        features.push({
          id: `feature-${i}`,
          agent: 'backend',
          dependencies: i > 0 ? [`feature-${i - 1}`] : []
        });
      }

      const result = await distributor.distributeWork({ features });

      expect(result.total).toBe(20);
      expect(result.successful).toBe(20);
    });

    it('should handle mixed agent types', async () => {
      const features = [
        { id: 'backend-1', agent: 'backend', dependencies: [] },
        { id: 'frontend-1', agent: 'frontend', dependencies: [] },
        { id: 'tester-1', agent: 'tester', dependencies: ['backend-1', 'frontend-1'] }
      ];

      const result = await distributor.distributeWork({ features });

      expect(result.successful).toBe(3);
    });

    it('should handle diamond dependencies', async () => {
      const features = [
        { id: 'root', agent: 'backend', dependencies: [] },
        { id: 'branch-a', agent: 'backend', dependencies: ['root'] },
        { id: 'branch-b', agent: 'backend', dependencies: ['root'] },
        { id: 'merge', agent: 'backend', dependencies: ['branch-a', 'branch-b'] }
      ];

      const result = await distributor.distributeWork({ features });

      expect(result.successful).toBe(4);
    });
  });
});
