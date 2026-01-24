/**
 * Execution Planner
 *
 * Creates optimal execution plans for distributed work across VPS workers.
 * Considers resource requirements, VPS capabilities, and execution strategies
 * to minimize total completion time.
 *
 * @module mcp/orchestrator/execution-planner
 */

import { EventEmitter } from 'events';

/**
 * ExecutionPlanner - Creates optimized execution plans
 *
 * Features:
 * - Resource estimation
 * - Worker capability matching
 * - Priority-based scheduling
 * - Load balancing
 * - Execution time estimation
 *
 * @extends EventEmitter
 */
export class ExecutionPlanner extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      // Default resource estimates per agent type
      resourceEstimates: {
        backend: { time: 300000, memory: 512, cpu: 1 },    // 5 min
        frontend: { time: 240000, memory: 768, cpu: 1 },   // 4 min
        tester: { time: 180000, memory: 256, cpu: 1 },     // 3 min
        reviewer: { time: 120000, memory: 256, cpu: 1 },   // 2 min
        fixer: { time: 180000, memory: 256, cpu: 1 },      // 3 min
        architect: { time: 240000, memory: 512, cpu: 1 },  // 4 min
        orchestrator: { time: 60000, memory: 128, cpu: 1 } // 1 min
      },
      // Maximum concurrent tasks per worker
      maxConcurrentPerWorker: options.maxConcurrentPerWorker || 1,
      // Priority weights for scheduling
      priorityWeights: {
        critical: 1000,
        high: 100,
        medium: 10,
        low: 1
      },
      ...options
    };
  }

  /**
   * Create an execution plan from dependency batches
   *
   * @param {Object[][]} batches - Array of batches from DependencyAnalyzer
   * @param {Object[]} workers - Array of available VPS workers
   * @param {string} workers[].id - Worker ID
   * @param {Object} workers[].capabilities - Worker capabilities
   * @param {number} workers[].capabilities.memory - Available memory (MB)
   * @param {number} workers[].capabilities.cpu - Available CPU cores
   * @param {string[]} workers[].capabilities.agents - Supported agent types
   * @returns {Object} Execution plan
   */
  createExecutionPlan(batches, workers) {
    if (!batches || batches.length === 0) {
      throw new Error('No batches provided');
    }

    if (!workers || workers.length === 0) {
      throw new Error('No workers available');
    }

    const plan = {
      batches: [],
      totalEstimatedTime: 0,
      totalFeatures: 0,
      workerUtilization: {},
      metadata: {
        createdAt: new Date().toISOString(),
        batchCount: batches.length,
        workerCount: workers.length
      }
    };

    // Initialize worker utilization tracking
    for (const worker of workers) {
      plan.workerUtilization[worker.id] = {
        assignedFeatures: 0,
        estimatedTime: 0,
        currentLoad: 0
      };
    }

    let currentTime = 0;

    // Process each batch sequentially
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const assignments = this._assignBatchToWorkers(batch, workers, plan.workerUtilization);

      // Calculate batch completion time (max time of all parallel tasks)
      const batchTime = Math.max(...assignments.map(a => a.estimatedTime));

      plan.batches.push({
        batchNumber: batchIndex + 1,
        features: batch.length,
        assignments: assignments,
        estimatedTime: batchTime,
        startTime: currentTime,
        endTime: currentTime + batchTime
      });

      currentTime += batchTime;
      plan.totalFeatures += batch.length;
    }

    plan.totalEstimatedTime = currentTime;

    this.emit('plan-created', {
      batches: plan.batches.length,
      features: plan.totalFeatures,
      estimatedTime: plan.totalEstimatedTime
    });

    return plan;
  }

  /**
   * Assign features in a batch to workers optimally
   *
   * @private
   * @param {Object[]} batch - Features in this batch
   * @param {Object[]} workers - Available workers
   * @param {Object} utilization - Current worker utilization
   * @returns {Object[]} Array of assignments
   */
  _assignBatchToWorkers(batch, workers, utilization) {
    const assignments = [];

    // Sort features by priority (highest first)
    const sortedFeatures = [...batch].sort((a, b) => {
      const priorityA = this.options.priorityWeights[a.priority] || 1;
      const priorityB = this.options.priorityWeights[b.priority] || 1;
      return priorityB - priorityA;
    });

    // Assign each feature to the best available worker
    for (const feature of sortedFeatures) {
      const worker = this._selectWorkerForFeature(feature, workers, utilization);

      if (!worker) {
        // No suitable worker found - this shouldn't happen but handle gracefully
        this.emit('assignment-warning', {
          feature: feature.id,
          reason: 'No suitable worker found'
        });
        continue;
      }

      const estimate = this._estimateResourceRequirements(feature);

      assignments.push({
        featureId: feature.id,
        workerId: worker.id,
        agent: feature.agent,
        priority: feature.priority,
        estimatedTime: estimate.time,
        estimatedMemory: estimate.memory,
        estimatedCpu: estimate.cpu
      });

      // Update worker utilization
      utilization[worker.id].assignedFeatures++;
      utilization[worker.id].estimatedTime += estimate.time;
      utilization[worker.id].currentLoad++;
    }

    return assignments;
  }

  /**
   * Select the best worker for a feature
   *
   * Considers:
   * - Agent compatibility
   * - Current load
   * - Resource availability
   * - Past performance (if available)
   *
   * @private
   * @param {Object} feature - Feature to assign
   * @param {Object[]} workers - Available workers
   * @param {Object} utilization - Current utilization
   * @returns {Object|null} Selected worker or null
   */
  _selectWorkerForFeature(feature, workers, utilization) {
    const estimate = this._estimateResourceRequirements(feature);
    const candidates = [];

    for (const worker of workers) {
      // Check agent compatibility
      if (!this._isWorkerCompatible(worker, feature.agent)) {
        continue;
      }

      // Check resource availability
      if (!this._hasResourceCapacity(worker, estimate)) {
        continue;
      }

      // Check concurrent task limit
      if (utilization[worker.id].currentLoad >= this.options.maxConcurrentPerWorker) {
        continue;
      }

      // Calculate worker score (lower is better)
      const score = this._calculateWorkerScore(worker, feature, utilization[worker.id]);
      candidates.push({ worker, score });
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by score (ascending) and return best
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0].worker;
  }

  /**
   * Check if worker supports the required agent type
   *
   * @private
   * @param {Object} worker - Worker to check
   * @param {string} agentType - Required agent type
   * @returns {boolean} True if compatible
   */
  _isWorkerCompatible(worker, agentType) {
    if (!worker.capabilities || !worker.capabilities.agents) {
      // If no agent restrictions, assume compatible
      return true;
    }

    return worker.capabilities.agents.includes(agentType);
  }

  /**
   * Check if worker has sufficient resources
   *
   * @private
   * @param {Object} worker - Worker to check
   * @param {Object} requirements - Resource requirements
   * @returns {boolean} True if has capacity
   */
  _hasResourceCapacity(worker, requirements) {
    if (!worker.capabilities) {
      return true; // Assume capacity if not specified
    }

    const { memory, cpu } = worker.capabilities;

    if (memory && requirements.memory > memory) {
      return false;
    }

    if (cpu && requirements.cpu > cpu) {
      return false;
    }

    return true;
  }

  /**
   * Calculate worker suitability score
   *
   * Lower score = better fit
   *
   * @private
   * @param {Object} worker - Worker to score
   * @param {Object} feature - Feature to assign
   * @param {Object} utilization - Worker utilization
   * @returns {number} Score
   */
  _calculateWorkerScore(worker, feature, utilization) {
    let score = 0;

    // Prefer workers with lower current load
    score += utilization.currentLoad * 100;

    // Prefer workers with lower total estimated time
    score += utilization.estimatedTime / 1000;

    // Add randomness to prevent always picking the same worker
    score += Math.random() * 10;

    return score;
  }

  /**
   * Estimate resource requirements for a feature
   *
   * @private
   * @param {Object} feature - Feature to estimate
   * @returns {Object} Resource estimates
   */
  _estimateResourceRequirements(feature) {
    const baseEstimate = this.options.resourceEstimates[feature.agent] || {
      time: 300000,
      memory: 512,
      cpu: 1
    };

    // Adjust based on priority (higher priority might need more resources)
    const priorityMultiplier = this._getPriorityMultiplier(feature.priority);

    return {
      time: Math.round(baseEstimate.time * priorityMultiplier),
      memory: baseEstimate.memory,
      cpu: baseEstimate.cpu
    };
  }

  /**
   * Get time multiplier based on priority
   *
   * @private
   * @param {string} priority - Priority level
   * @returns {number} Multiplier
   */
  _getPriorityMultiplier(priority) {
    const multipliers = {
      critical: 1.5, // Critical tasks might take longer
      high: 1.2,
      medium: 1.0,
      low: 0.8
    };

    return multipliers[priority] || 1.0;
  }

  /**
   * Optimize an existing plan
   *
   * Re-balances worker assignments to reduce total time
   *
   * @param {Object} plan - Existing execution plan
   * @param {Object[]} workers - Available workers
   * @returns {Object} Optimized plan
   */
  optimizePlan(plan, workers) {
    // Simple optimization: redistribute load more evenly
    const optimized = JSON.parse(JSON.stringify(plan)); // Deep clone

    for (const batch of optimized.batches) {
      // Calculate load per worker in this batch
      const workerLoads = {};
      for (const worker of workers) {
        workerLoads[worker.id] = 0;
      }

      for (const assignment of batch.assignments) {
        workerLoads[assignment.workerId] += assignment.estimatedTime;
      }

      // Find overloaded and underloaded workers
      const avgLoad = Object.values(workerLoads).reduce((s, l) => s + l, 0) / workers.length;

      // Simple rebalancing: move tasks from overloaded to underloaded workers
      const overloaded = Object.entries(workerLoads)
        .filter(([_, load]) => load > avgLoad * 1.2)
        .map(([id]) => id);

      const underloaded = Object.entries(workerLoads)
        .filter(([_, load]) => load < avgLoad * 0.8)
        .map(([id]) => id);

      // Reassign tasks
      if (overloaded.length > 0 && underloaded.length > 0) {
        for (const assignment of batch.assignments) {
          if (overloaded.includes(assignment.workerId)) {
            const newWorker = underloaded[0];
            assignment.workerId = newWorker;
            break; // Only move one task per iteration
          }
        }
      }
    }

    this.emit('plan-optimized');
    return optimized;
  }

  /**
   * Get plan statistics
   *
   * @param {Object} plan - Execution plan
   * @returns {Object} Statistics
   */
  getPlanStatistics(plan) {
    const stats = {
      totalBatches: plan.batches.length,
      totalFeatures: plan.totalFeatures,
      totalEstimatedTime: plan.totalEstimatedTime,
      avgBatchTime: plan.batches.reduce((s, b) => s + b.estimatedTime, 0) / plan.batches.length,
      maxBatchTime: Math.max(...plan.batches.map(b => b.estimatedTime)),
      workerStats: {}
    };

    // Calculate per-worker statistics
    for (const [workerId, util] of Object.entries(plan.workerUtilization)) {
      stats.workerStats[workerId] = {
        features: util.assignedFeatures,
        estimatedTime: util.estimatedTime,
        utilizationPercent: (util.estimatedTime / plan.totalEstimatedTime) * 100
      };
    }

    return stats;
  }
}

export default ExecutionPlanner;
