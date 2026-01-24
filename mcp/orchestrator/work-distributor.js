/**
 * Work Distributor
 *
 * High-level orchestrator that coordinates the entire distributed work execution process.
 * Analyzes product specifications, creates execution plans, distributes work to MCP servers,
 * tracks progress, and handles failures with retry logic.
 *
 * @module mcp/orchestrator/work-distributor
 */

import { EventEmitter } from 'events';
import { DependencyAnalyzer } from './dependency-analyzer.js';
import { ExecutionPlanner } from './execution-planner.js';
import { ProgressAggregator } from './progress-aggregator.js';

/**
 * WorkDistributor - Orchestrates distributed work execution
 *
 * Main orchestration flow:
 * 1. Analyze feature dependencies
 * 2. Create execution plan
 * 3. Distribute batches to workers
 * 4. Track progress
 * 5. Handle failures and retries
 * 6. Aggregate results
 *
 * @extends EventEmitter
 */
export class WorkDistributor extends EventEmitter {
  constructor(mcpPool, options = {}) {
    super();

    if (!mcpPool) {
      throw new Error('MCP server pool is required');
    }

    this.mcpPool = mcpPool;

    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 5000, // 5 seconds
      progressPath: options.progressPath || null,
      autoOptimize: options.autoOptimize !== false,
      backpressureThreshold: options.backpressureThreshold || 0.8, // 80% utilization
      ...options
    };

    // Core components
    this.analyzer = new DependencyAnalyzer();
    this.planner = new ExecutionPlanner(options);
    this.aggregator = new ProgressAggregator({
      persistencePath: this.options.progressPath,
      autoSave: true
    });

    /** @type {Object|null} */
    this.currentPlan = null;

    /** @type {Map<string, number>} */
    this.retryCount = new Map();

    /** @type {boolean} */
    this.isRunning = false;

    /** @type {Map<string, Promise>} */
    this.activeExecutions = new Map();

    this._setupEventForwarding();
  }

  /**
   * Setup event forwarding from components
   *
   * @private
   */
  _setupEventForwarding() {
    // Forward dependency analyzer events
    this.analyzer.on('cycles-detected', (cycles) => {
      this.emit('error', new Error(`Circular dependencies: ${cycles.map(c => c.join(' -> ')).join('; ')}`));
    });

    // Forward planner events
    this.planner.on('plan-created', (stats) => {
      this.emit('plan-created', stats);
    });

    // Forward aggregator events
    this.aggregator.on('feature-updated', (update) => {
      this.emit('feature-progress', update);
    });

    this.aggregator.on('save-error', (error) => {
      this.emit('warning', { message: 'Failed to save progress', error });
    });
  }

  /**
   * Distribute work across MCP servers
   *
   * @param {Object} config - Distribution configuration
   * @param {Object[]} config.features - Array of features to execute
   * @param {Object} [config.workers] - Optional worker pool (uses mcpPool if not provided)
   * @param {boolean} [config.sequential=false] - Force sequential execution
   * @returns {Promise<Object>} Execution results
   */
  async distributeWork(config) {
    if (this.isRunning) {
      throw new Error('Distribution already in progress');
    }

    if (!config.features || config.features.length === 0) {
      throw new Error('No features provided');
    }

    this.isRunning = true;
    this.emit('distribution-started', {
      features: config.features.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Step 1: Analyze dependencies
      this.emit('phase', { phase: 'analyzing-dependencies' });
      this.analyzer.reset();
      this.analyzer.addFeatures(config.features);

      const validation = this.analyzer.validate();
      if (!validation.valid) {
        throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
      }

      const { hasCycles } = this.analyzer.detectCycles();
      if (hasCycles) {
        throw new Error('Circular dependencies detected');
      }

      // Step 2: Generate execution batches
      this.emit('phase', { phase: 'generating-batches' });
      const batches = this.analyzer.generateBatches();

      this.emit('batches-generated', {
        count: batches.length,
        features: config.features.length
      });

      // Step 3: Create execution plan
      this.emit('phase', { phase: 'planning-execution' });
      const workers = config.workers || await this._getAvailableWorkers();

      this.currentPlan = this.planner.createExecutionPlan(batches, workers);

      // Optimize plan if enabled
      if (this.options.autoOptimize) {
        this.currentPlan = this.planner.optimizePlan(this.currentPlan, workers);
      }

      const stats = this.planner.getPlanStatistics(this.currentPlan);
      this.emit('plan-ready', stats);

      // Step 4: Initialize progress tracking
      this.aggregator.initialize(config.features, this.currentPlan);

      // Step 5: Execute plan
      this.emit('phase', { phase: 'executing' });
      const results = await this._executePlan(this.currentPlan, config.sequential);

      // Step 6: Final results
      this.emit('distribution-complete', {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        duration: Date.now() - new Date(this.aggregator.overallProgress.startTime).getTime()
      });

      return results;

    } catch (error) {
      this.emit('distribution-failed', { error: error.message });
      throw error;

    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute the plan batch by batch
   *
   * @private
   * @param {Object} plan - Execution plan
   * @param {boolean} sequential - Force sequential execution
   * @returns {Promise<Object>} Execution results
   */
  async _executePlan(plan, sequential = false) {
    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      retried: 0,
      features: {}
    };

    for (const batch of plan.batches) {
      this.emit('batch-started', {
        batchNumber: batch.batchNumber,
        features: batch.features
      });

      // Execute batch (parallel or sequential)
      const batchResults = sequential
        ? await this._executeBatchSequential(batch)
        : await this._executeBatchParallel(batch);

      // Aggregate batch results
      for (const [featureId, result] of Object.entries(batchResults)) {
        results.total++;
        results.features[featureId] = result;

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }

        if (result.retried) {
          results.retried++;
        }
      }

      this.emit('batch-complete', {
        batchNumber: batch.batchNumber,
        successful: Object.values(batchResults).filter(r => r.success).length,
        failed: Object.values(batchResults).filter(r => !r.success).length
      });

      // Check backpressure
      if (this._isBackpressureHigh()) {
        await this._waitForBackpressureRelease();
      }
    }

    return results;
  }

  /**
   * Execute batch assignments in parallel
   *
   * @private
   * @param {Object} batch - Batch to execute
   * @returns {Promise<Object>} Batch results
   */
  async _executeBatchParallel(batch) {
    const executions = batch.assignments.map(assignment =>
      this._executeFeature(assignment)
    );

    const results = await Promise.allSettled(executions);
    const batchResults = {};

    for (let i = 0; i < batch.assignments.length; i++) {
      const assignment = batch.assignments[i];
      const result = results[i];

      batchResults[assignment.featureId] = {
        success: result.status === 'fulfilled' && result.value.success,
        result: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
        retried: this.retryCount.get(assignment.featureId) > 0
      };
    }

    return batchResults;
  }

  /**
   * Execute batch assignments sequentially
   *
   * @private
   * @param {Object} batch - Batch to execute
   * @returns {Promise<Object>} Batch results
   */
  async _executeBatchSequential(batch) {
    const batchResults = {};

    for (const assignment of batch.assignments) {
      try {
        const result = await this._executeFeature(assignment);
        batchResults[assignment.featureId] = {
          success: result.success,
          result,
          error: null,
          retried: this.retryCount.get(assignment.featureId) > 0
        };
      } catch (error) {
        batchResults[assignment.featureId] = {
          success: false,
          result: null,
          error,
          retried: this.retryCount.get(assignment.featureId) > 0
        };
      }
    }

    return batchResults;
  }

  /**
   * Execute a single feature with retry logic
   *
   * @private
   * @param {Object} assignment - Feature assignment
   * @returns {Promise<Object>} Execution result
   */
  async _executeFeature(assignment) {
    const { featureId, workerId, agent } = assignment;
    const feature = this.analyzer.features.get(featureId);

    // Update progress: in-progress
    this.aggregator.updateFeature(featureId, {
      status: 'in-progress',
      workerId,
      progress: 0
    });

    const retries = this.retryCount.get(featureId) || 0;

    try {
      // Get worker from pool
      const worker = await this.mcpPool.getWorker(workerId);

      if (!worker) {
        throw new Error(`Worker not found: ${workerId}`);
      }

      // Build task description
      const task = this._buildTaskDescription(feature);

      // Execute on worker
      const executionPromise = worker.executeAgent(agent, task, {
        context: {
          featureId,
          ...feature.metadata
        },
        async: true,
        timeout: assignment.estimatedTime
      });

      // Track active execution
      this.activeExecutions.set(featureId, executionPromise);

      const result = await executionPromise;

      // Remove from active executions
      this.activeExecutions.delete(featureId);

      // Update progress: complete
      this.aggregator.updateFeature(featureId, {
        status: 'complete',
        progress: 100
      });

      this.emit('feature-complete', {
        featureId,
        workerId,
        duration: result.duration || 0
      });

      return { success: true, result };

    } catch (error) {
      // Remove from active executions
      this.activeExecutions.delete(featureId);

      // Retry logic
      if (retries < this.options.maxRetries) {
        this.emit('feature-retry', {
          featureId,
          attempt: retries + 1,
          maxRetries: this.options.maxRetries,
          error: error.message
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));

        // Increment retry count
        this.retryCount.set(featureId, retries + 1);

        // Reset status to pending and try again
        this.aggregator.updateFeature(featureId, {
          status: 'pending',
          progress: 0
        });

        return this._executeFeature(assignment);
      }

      // Max retries exceeded
      this.aggregator.updateFeature(featureId, {
        status: 'failed',
        error: error.message
      });

      this.emit('feature-failed', {
        featureId,
        workerId,
        error: error.message,
        retries
      });

      throw error;
    }
  }

  /**
   * Build task description for feature
   *
   * @private
   * @param {Object} feature - Feature to describe
   * @returns {string} Task description
   */
  _buildTaskDescription(feature) {
    const parts = [
      `Feature: ${feature.id}`,
      `Priority: ${feature.priority}`,
      ''
    ];

    if (feature.metadata.description) {
      parts.push(feature.metadata.description);
    }

    if (feature.metadata.requirements) {
      parts.push('', 'Requirements:');
      parts.push(...feature.metadata.requirements.map(r => `- ${r}`));
    }

    if (feature.dependencies && feature.dependencies.length > 0) {
      parts.push('', `Dependencies: ${feature.dependencies.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Get available workers from pool
   *
   * @private
   * @returns {Promise<Object[]>} Array of workers
   */
  async _getAvailableWorkers() {
    return this.mcpPool.getAvailableWorkers();
  }

  /**
   * Check if backpressure is high
   *
   * @private
   * @returns {boolean} True if backpressure exceeds threshold
   */
  _isBackpressureHigh() {
    const activeCount = this.activeExecutions.size;
    const totalWorkers = this.mcpPool.size;
    const utilization = activeCount / totalWorkers;

    return utilization >= this.options.backpressureThreshold;
  }

  /**
   * Wait for backpressure to release
   *
   * @private
   * @returns {Promise<void>}
   */
  async _waitForBackpressureRelease() {
    this.emit('backpressure-wait');

    while (this._isBackpressureHigh()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.emit('backpressure-released');
  }

  /**
   * Get current progress
   *
   * @returns {Object} Progress information
   */
  getProgress() {
    return {
      overall: this.aggregator.getProgress(),
      workers: this.aggregator.getAllWorkerStatuses(),
      features: this.aggregator.getAllFeatureProgress(),
      plan: this.currentPlan ? this.planner.getPlanStatistics(this.currentPlan) : null
    };
  }

  /**
   * Get execution summary
   *
   * @returns {Object} Execution summary
   */
  getSummary() {
    return this.aggregator.getSummary();
  }

  /**
   * Stop ongoing distribution
   *
   * Cancels active executions and cleans up
   *
   * @returns {Promise<void>}
   */
  async stop() {
    this.emit('stopping');

    // Cancel active executions
    for (const [featureId, execution] of this.activeExecutions.entries()) {
      try {
        // Attempt to cancel (if supported by worker)
        if (execution.cancel) {
          await execution.cancel();
        }
      } catch (error) {
        this.emit('warning', {
          message: `Failed to cancel execution for ${featureId}`,
          error
        });
      }
    }

    this.activeExecutions.clear();
    this.isRunning = false;

    // Save final progress
    if (this.options.progressPath) {
      await this.aggregator.save();
    }

    this.emit('stopped');
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.aggregator.destroy();
    this.removeAllListeners();
  }
}

export default WorkDistributor;
