import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionPlanner } from '../../orchestrator/execution-planner.js';
import { DependencyAnalyzer } from '../../orchestrator/dependency-analyzer.js';

describe('ExecutionPlanner', () => {
  let planner;
  let analyzer;
  let workers;

  beforeEach(() => {
    planner = new ExecutionPlanner();
    analyzer = new DependencyAnalyzer();

    // Setup default workers
    workers = [
      {
        id: 'worker-1',
        capabilities: {
          memory: 1024,
          cpu: 2,
          agents: ['backend', 'frontend', 'tester']
        }
      },
      {
        id: 'worker-2',
        capabilities: {
          memory: 2048,
          cpu: 4,
          agents: ['backend', 'frontend', 'tester']
        }
      },
      {
        id: 'worker-3',
        capabilities: {
          memory: 512,
          cpu: 1,
          agents: ['reviewer', 'fixer']
        }
      }
    ];
  });

  describe('Plan Creation', () => {
    it('should create execution plan from batches', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'frontend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      expect(plan).toBeDefined();
      expect(plan.batches).toHaveLength(1);
      expect(plan.totalFeatures).toBe(2);
      expect(plan.totalEstimatedTime).toBeGreaterThan(0);
    });

    it('should throw with no batches', () => {
      expect(() => {
        planner.createExecutionPlan([], workers);
      }).toThrow('No batches provided');
    });

    it('should throw with no workers', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      const batches = analyzer.generateBatches();

      expect(() => {
        planner.createExecutionPlan(batches, []);
      }).toThrow('No workers available');
    });

    it('should assign features to workers', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const assignments = plan.batches[0].assignments;
      expect(assignments).toHaveLength(2);
      expect(assignments[0].workerId).toBeDefined();
      expect(assignments[1].workerId).toBeDefined();
    });

    it('should track worker utilization', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'frontend', dependencies: ['A'] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      expect(plan.workerUtilization).toBeDefined();
      expect(Object.keys(plan.workerUtilization)).toHaveLength(workers.length);

      for (const workerId of Object.keys(plan.workerUtilization)) {
        expect(plan.workerUtilization[workerId].assignedFeatures).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Priority-Based Scheduling', () => {
    it('should prioritize critical features', () => {
      analyzer.addFeature({
        id: 'low-priority',
        agent: 'backend',
        priority: 'low',
        dependencies: []
      });
      analyzer.addFeature({
        id: 'critical-priority',
        agent: 'backend',
        priority: 'critical',
        dependencies: []
      });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, [workers[0]]);

      const assignments = plan.batches[0].assignments;

      // Critical should be assigned first (assuming single worker)
      expect(assignments[0].featureId).toBe('critical-priority');
    });

    it('should handle mixed priorities', () => {
      analyzer.addFeature({
        id: 'low',
        agent: 'backend',
        priority: 'low',
        dependencies: []
      });
      analyzer.addFeature({
        id: 'medium',
        agent: 'backend',
        priority: 'medium',
        dependencies: []
      });
      analyzer.addFeature({
        id: 'high',
        agent: 'backend',
        priority: 'high',
        dependencies: []
      });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      expect(plan.batches[0].assignments).toHaveLength(3);
    });
  });

  describe('Worker Compatibility', () => {
    it('should assign features to compatible workers', () => {
      analyzer.addFeature({ id: 'backend-task', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'review-task', agent: 'reviewer', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const backendAssignment = plan.batches[0].assignments.find(a => a.featureId === 'backend-task');
      const reviewAssignment = plan.batches[0].assignments.find(a => a.featureId === 'review-task');

      // worker-3 only supports reviewer and fixer
      expect(reviewAssignment.workerId).toBe('worker-3');

      // worker-1 or worker-2 should get backend task
      expect(['worker-1', 'worker-2']).toContain(backendAssignment.workerId);
    });

    it('should handle workers without capability restrictions', () => {
      const unrestricted = [
        { id: 'worker-any', capabilities: {} }
      ];

      analyzer.addFeature({ id: 'test', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, unrestricted);

      expect(plan.batches[0].assignments[0].workerId).toBe('worker-any');
    });
  });

  describe('Resource Estimation', () => {
    it('should estimate time for backend features', () => {
      analyzer.addFeature({ id: 'backend', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const assignment = plan.batches[0].assignments[0];
      expect(assignment.estimatedTime).toBeGreaterThan(0);
    });

    it('should adjust estimates based on priority', () => {
      analyzer.addFeature({
        id: 'low',
        agent: 'backend',
        priority: 'low',
        dependencies: []
      });
      analyzer.addFeature({
        id: 'critical',
        agent: 'backend',
        priority: 'critical',
        dependencies: []
      });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const lowAssignment = plan.batches[0].assignments.find(a => a.featureId === 'low');
      const criticalAssignment = plan.batches[0].assignments.find(a => a.featureId === 'critical');

      // Critical tasks take longer
      expect(criticalAssignment.estimatedTime).toBeGreaterThan(lowAssignment.estimatedTime);
    });

    it('should estimate different times for different agents', () => {
      analyzer.addFeature({ id: 'backend', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'reviewer', agent: 'reviewer', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const backendTime = plan.batches[0].assignments.find(a => a.agent === 'backend').estimatedTime;
      const reviewerTime = plan.batches[0].assignments.find(a => a.agent === 'reviewer').estimatedTime;

      expect(backendTime).not.toBe(reviewerTime);
    });
  });

  describe('Load Balancing', () => {
    it('should distribute features across workers', () => {
      // Add more features than workers
      for (let i = 0; i < 6; i++) {
        analyzer.addFeature({
          id: `feature-${i}`,
          agent: 'backend',
          dependencies: []
        });
      }

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers.slice(0, 2)); // Use 2 workers

      const workerAssignments = {};
      for (const assignment of plan.batches[0].assignments) {
        workerAssignments[assignment.workerId] = (workerAssignments[assignment.workerId] || 0) + 1;
      }

      // Both workers should get some features
      expect(Object.keys(workerAssignments)).toHaveLength(2);
    });

    it('should respect max concurrent tasks per worker', () => {
      const limitedPlanner = new ExecutionPlanner({
        maxConcurrentPerWorker: 1
      });

      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = limitedPlanner.createExecutionPlan(batches, [workers[0]]);

      const assignments = plan.batches[0].assignments.filter(a => a.workerId === 'worker-1');

      // Should only assign 1 task per worker per batch
      expect(assignments.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Plan Optimization', () => {
    it('should optimize existing plan', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const optimized = planner.optimizePlan(plan, workers);

      expect(optimized).toBeDefined();
      expect(optimized.batches).toBeDefined();
    });

    it('should not modify original plan during optimization', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const original = planner.createExecutionPlan(batches, workers);
      const originalJSON = JSON.stringify(original);

      planner.optimizePlan(original, workers);

      expect(JSON.stringify(original)).toBe(originalJSON);
    });
  });

  describe('Plan Statistics', () => {
    it('should calculate plan statistics', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'frontend', dependencies: ['A'] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const stats = planner.getPlanStatistics(plan);

      expect(stats.totalBatches).toBe(2);
      expect(stats.totalFeatures).toBe(2);
      expect(stats.totalEstimatedTime).toBeGreaterThan(0);
      expect(stats.avgBatchTime).toBeGreaterThan(0);
      expect(stats.maxBatchTime).toBeGreaterThan(0);
      expect(stats.workerStats).toBeDefined();
    });

    it('should include worker-specific statistics', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      const stats = planner.getPlanStatistics(plan);

      for (const workerId of Object.keys(stats.workerStats)) {
        const workerStat = stats.workerStats[workerId];
        expect(workerStat.features).toBeGreaterThanOrEqual(0);
        expect(workerStat.estimatedTime).toBeGreaterThanOrEqual(0);
        expect(workerStat.utilizationPercent).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Event Emission', () => {
    it('should emit plan-created event', (done) => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });

      planner.on('plan-created', (stats) => {
        expect(stats.batches).toBeDefined();
        done();
      });

      const batches = analyzer.generateBatches();
      planner.createExecutionPlan(batches, workers);
    });

    it('should emit plan-optimized event', (done) => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });

      planner.on('plan-optimized', () => {
        done();
      });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);
      planner.optimizePlan(plan, workers);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle large number of features', () => {
      // Create 20 features with dependencies
      for (let i = 0; i < 20; i++) {
        const deps = i > 0 ? [`feature-${i - 1}`] : [];
        analyzer.addFeature({
          id: `feature-${i}`,
          agent: 'backend',
          dependencies: deps
        });
      }

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      expect(plan.totalFeatures).toBe(20);
      expect(plan.batches.length).toBeGreaterThan(0);
    });

    it('should handle mixed agent types', () => {
      analyzer.addFeature({ id: 'backend-1', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'frontend-1', agent: 'frontend', dependencies: [] });
      analyzer.addFeature({ id: 'tester-1', agent: 'tester', dependencies: [] });
      analyzer.addFeature({ id: 'reviewer-1', agent: 'reviewer', dependencies: [] });

      const batches = analyzer.generateBatches();
      const plan = planner.createExecutionPlan(batches, workers);

      expect(plan.batches[0].assignments).toHaveLength(4);

      // Check all agent types are present
      const agents = plan.batches[0].assignments.map(a => a.agent);
      expect(agents).toContain('backend');
      expect(agents).toContain('frontend');
      expect(agents).toContain('tester');
      expect(agents).toContain('reviewer');
    });
  });
});
