import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';
import yaml from 'js-yaml';
import { atomicWrite, atomicUpdate } from '../atomic.js';

/**
 * Pipeline Orchestration Engine
 *
 * Manages async, long-running AI agent workflows with:
 * - Dependency graph resolution
 * - Parallel and sequential execution
 * - State persistence and recovery
 * - Resource management
 * - Progress tracking
 */

/**
 * Job Status States
 */
export const JobStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  SKIPPED: 'skipped'
};

/**
 * Pipeline Status States
 */
export const PipelineStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Pipeline Orchestration Engine
 *
 * @extends EventEmitter
 *
 * Events emitted:
 * - 'pipeline:started' - Pipeline execution started
 * - 'pipeline:completed' - Pipeline completed successfully
 * - 'pipeline:failed' - Pipeline failed
 * - 'pipeline:cancelled' - Pipeline was cancelled
 * - 'job:started' - Job started execution
 * - 'job:completed' - Job completed successfully
 * - 'job:failed' - Job failed
 * - 'job:progress' - Job progress update
 * - 'job:log' - Job log output
 */
export class PipelineEngine extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      maxConcurrentJobs: options.maxConcurrentJobs || 3,
      stateDir: options.stateDir || '.agentful/pipelines',
      defaultTimeout: options.defaultTimeout || 30 * 60 * 1000, // 30 minutes
      retryDelayMs: options.retryDelayMs || 2000,
      enablePersistence: options.enablePersistence !== false,
      ...options
    };

    // Runtime state
    this.pipelines = new Map(); // pipelineId -> PipelineState
    this.runningJobs = new Map(); // jobId -> JobExecution
    this.jobQueue = []; // Array of QueuedJob

    // Resource tracking
    this.activeJobCount = 0;
  }

  /**
   * Load pipeline definition from YAML file
   *
   * @param {string} pipelineFile - Path to pipeline YAML file
   * @returns {Promise<Object>} Pipeline definition
   */
  async loadPipeline(pipelineFile) {
    const content = await fs.readFile(pipelineFile, 'utf-8');
    const pipeline = yaml.load(content);

    // Validate pipeline definition
    this._validatePipeline(pipeline);

    return pipeline;
  }

  /**
   * Start pipeline execution
   *
   * @param {Object|string} pipelineOrFile - Pipeline definition object or path to YAML file
   * @param {Object} context - Initial execution context (variables, inputs)
   * @returns {Promise<string>} Pipeline run ID
   */
  async startPipeline(pipelineOrFile, context = {}) {
    // Load pipeline if file path provided
    const pipeline = typeof pipelineOrFile === 'string'
      ? await this.loadPipeline(pipelineOrFile)
      : pipelineOrFile;

    // Generate unique run ID
    const runId = this._generateRunId(pipeline.name);

    // Initialize pipeline state
    const pipelineState = {
      runId,
      pipeline,
      status: PipelineStatus.RUNNING,
      startedAt: new Date().toISOString(),
      completedAt: null,
      context: { ...context },
      jobs: this._initializeJobStates(pipeline.jobs),
      dependencyGraph: this._buildDependencyGraph(pipeline.jobs),
      errors: [],
      metadata: {
        pipelineName: pipeline.name,
        pipelineVersion: pipeline.version || '1.0',
        triggeredBy: context.triggeredBy || 'manual'
      }
    };

    this.pipelines.set(runId, pipelineState);

    // Persist initial state
    if (this.options.enablePersistence) {
      await this._persistPipelineState(runId, pipelineState);
    }

    // Emit start event
    this.emit('pipeline:started', {
      runId,
      pipeline: pipeline.name,
      context
    });

    // Begin execution (non-blocking)
    this._executePipeline(runId).catch(error => {
      console.error(`Pipeline ${runId} execution failed:`, error);
      this.emit('pipeline:failed', { runId, error: error.message });
    });

    return runId;
  }

  /**
   * Get pipeline execution status
   *
   * @param {string} runId - Pipeline run ID
   * @returns {Object|null} Pipeline state or null if not found
   */
  getPipelineStatus(runId) {
    const state = this.pipelines.get(runId);
    if (!state) return null;

    return {
      runId: state.runId,
      pipeline: state.pipeline.name,
      status: state.status,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      progress: this._calculateProgress(state),
      jobs: Object.entries(state.jobs).map(([jobId, job]) => ({
        id: jobId,
        name: job.name,
        status: job.status,
        progress: job.progress,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error
      })),
      errors: state.errors
    };
  }

  /**
   * Cancel pipeline execution
   *
   * @param {string} runId - Pipeline run ID
   * @returns {Promise<boolean>} True if cancelled, false if not found
   */
  async cancelPipeline(runId) {
    const state = this.pipelines.get(runId);
    if (!state) return false;

    // Mark pipeline as cancelled
    state.status = PipelineStatus.CANCELLED;
    state.completedAt = new Date().toISOString();

    // Cancel all running and queued jobs
    for (const [jobId, job] of Object.entries(state.jobs)) {
      if (job.status === JobStatus.RUNNING || job.status === JobStatus.QUEUED) {
        job.status = JobStatus.CANCELLED;
        job.completedAt = new Date().toISOString();

        // Cancel active job execution
        const execution = this.runningJobs.get(jobId);
        if (execution) {
          await this._cancelJobExecution(execution);
          this.runningJobs.delete(jobId);
          this.activeJobCount--;
        }
      }
    }

    // Remove from queue
    this.jobQueue = this.jobQueue.filter(q => q.runId !== runId);

    // Persist state
    if (this.options.enablePersistence) {
      await this._persistPipelineState(runId, state);
    }

    this.emit('pipeline:cancelled', { runId });
    return true;
  }

  /**
   * Resume a previously interrupted pipeline
   *
   * @param {string} runId - Pipeline run ID to resume
   * @returns {Promise<boolean>} True if resumed, false if not found or not resumable
   */
  async resumePipeline(runId) {
    // Try to load from persistence
    const state = await this._loadPipelineState(runId);
    if (!state) return false;

    // Only resume if pipeline was interrupted
    if (state.status !== PipelineStatus.RUNNING && state.status !== PipelineStatus.PAUSED) {
      return false;
    }

    // Restore state
    this.pipelines.set(runId, state);

    // Reset failed/running jobs to pending
    for (const [jobId, job] of Object.entries(state.jobs)) {
      if (job.status === JobStatus.RUNNING || job.status === JobStatus.FAILED) {
        job.status = JobStatus.PENDING;
        job.error = null;
        job.attemptCount = 0;
      }
    }

    // Resume execution
    this.emit('pipeline:resumed', { runId });
    this._executePipeline(runId).catch(error => {
      console.error(`Pipeline ${runId} execution failed:`, error);
      this.emit('pipeline:failed', { runId, error: error.message });
    });

    return true;
  }

  /**
   * Internal: Execute pipeline
   *
   * @private
   */
  async _executePipeline(runId) {
    const state = this.pipelines.get(runId);
    if (!state) return;

    try {
      // Execute jobs based on dependency graph
      await this._executeJobsInOrder(state);

      // Check if pipeline completed successfully
      const allCompleted = Object.values(state.jobs).every(
        job => job.status === JobStatus.COMPLETED || job.status === JobStatus.SKIPPED
      );

      if (allCompleted) {
        state.status = PipelineStatus.COMPLETED;
        state.completedAt = new Date().toISOString();
        this.emit('pipeline:completed', { runId, duration: this._calculateDuration(state) });
      } else {
        state.status = PipelineStatus.FAILED;
        state.completedAt = new Date().toISOString();
        this.emit('pipeline:failed', {
          runId,
          error: 'Some jobs did not complete successfully'
        });
      }
    } catch (error) {
      state.status = PipelineStatus.FAILED;
      state.completedAt = new Date().toISOString();
      state.errors.push({
        type: 'pipeline_execution',
        message: error.message,
        timestamp: new Date().toISOString()
      });

      this.emit('pipeline:failed', { runId, error: error.message });
    } finally {
      // Persist final state
      if (this.options.enablePersistence) {
        await this._persistPipelineState(runId, state);
      }
    }
  }

  /**
   * Internal: Execute jobs in dependency order
   *
   * @private
   */
  async _executeJobsInOrder(state) {
    const { jobs, dependencyGraph } = state;

    while (true) {
      // Find jobs ready to execute (dependencies met)
      const readyJobs = this._findReadyJobs(jobs, dependencyGraph);

      if (readyJobs.length === 0) {
        // Check if all jobs are done
        const pendingJobs = Object.values(jobs).filter(
          job => job.status === JobStatus.PENDING || job.status === JobStatus.QUEUED
        );

        if (pendingJobs.length === 0) {
          break; // All done
        }

        // Wait for running jobs to complete
        await this._waitForJobSlot();
        continue;
      }

      // Queue ready jobs
      for (const jobId of readyJobs) {
        jobs[jobId].status = JobStatus.QUEUED;
        this.jobQueue.push({
          runId: state.runId,
          jobId,
          queuedAt: Date.now()
        });
      }

      // Process job queue (respecting concurrency limits)
      await this._processJobQueue(state);

      // Small delay to prevent tight loop
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for all remaining jobs to complete
    while (this.activeJobCount > 0) {
      await this._waitForJobSlot();
    }
  }

  /**
   * Internal: Find jobs ready to execute
   *
   * @private
   */
  _findReadyJobs(jobs, dependencyGraph) {
    const ready = [];

    for (const [jobId, job] of Object.entries(jobs)) {
      if (job.status !== JobStatus.PENDING) continue;

      // Check if all dependencies are completed
      const dependencies = dependencyGraph[jobId] || [];
      const allDepsCompleted = dependencies.every(depId => {
        const depJob = jobs[depId];
        return depJob.status === JobStatus.COMPLETED || depJob.status === JobStatus.SKIPPED;
      });

      if (allDepsCompleted) {
        // Check conditional execution
        if (job.when && !this._evaluateCondition(job.when, jobs)) {
          job.status = JobStatus.SKIPPED;
          job.completedAt = new Date().toISOString();
          continue;
        }

        ready.push(jobId);
      }
    }

    return ready;
  }

  /**
   * Internal: Process job queue
   *
   * @private
   */
  async _processJobQueue(state) {
    while (this.jobQueue.length > 0 && this.activeJobCount < this.options.maxConcurrentJobs) {
      const queuedJob = this.jobQueue.shift();
      if (!queuedJob) break;

      // Verify job still needs to run
      const job = state.jobs[queuedJob.jobId];
      if (!job || job.status !== JobStatus.QUEUED) continue;

      // Start job execution
      this.activeJobCount++;
      this._executeJob(state, queuedJob.jobId).finally(() => {
        this.activeJobCount--;
      });
    }
  }

  /**
   * Internal: Execute a single job
   *
   * @private
   */
  async _executeJob(state, jobId) {
    const job = state.jobs[jobId];
    const jobDef = state.pipeline.jobs.find(j => j.id === jobId);

    job.status = JobStatus.RUNNING;
    job.startedAt = new Date().toISOString();
    job.attemptCount = (job.attemptCount || 0) + 1;

    this.emit('job:started', {
      runId: state.runId,
      jobId,
      jobName: job.name,
      attempt: job.attemptCount
    });

    try {
      // Build job context (includes outputs from dependencies)
      const jobContext = await this._buildJobContext(state, jobId);

      // Execute agent
      const result = await this._executeAgent(jobDef, jobContext, {
        onProgress: (progress) => {
          job.progress = progress;
          this.emit('job:progress', { runId: state.runId, jobId, progress });
        },
        onLog: (message) => {
          job.logs = job.logs || [];
          job.logs.push({ timestamp: new Date().toISOString(), message });
          this.emit('job:log', { runId: state.runId, jobId, message });
        },
        timeout: jobDef.timeout || this.options.defaultTimeout
      });

      // Store result
      job.status = JobStatus.COMPLETED;
      job.completedAt = new Date().toISOString();
      job.output = result.output;
      job.duration = Date.now() - new Date(job.startedAt).getTime();

      this.emit('job:completed', {
        runId: state.runId,
        jobId,
        jobName: job.name,
        duration: job.duration,
        output: result.output
      });

    } catch (error) {
      job.error = error.message;
      job.errorStack = error.stack;

      // Check if should retry
      const maxRetries = jobDef.retry?.maxAttempts || 0;
      if (job.attemptCount <= maxRetries) {
        // Retry job
        job.status = JobStatus.PENDING;
        job.error = null;

        const delay = this._calculateRetryDelay(job.attemptCount, jobDef.retry);
        await new Promise(resolve => setTimeout(resolve, delay));

        this.emit('job:retry', {
          runId: state.runId,
          jobId,
          jobName: job.name,
          attempt: job.attemptCount
        });
      } else {
        // Job failed
        job.status = JobStatus.FAILED;
        job.completedAt = new Date().toISOString();

        state.errors.push({
          type: 'job_execution',
          jobId,
          jobName: job.name,
          message: error.message,
          timestamp: new Date().toISOString()
        });

        this.emit('job:failed', {
          runId: state.runId,
          jobId,
          jobName: job.name,
          error: error.message,
          attempts: job.attemptCount
        });

        // Check if should continue or fail fast
        if (jobDef.continueOnError !== true) {
          throw new Error(`Job ${jobId} failed: ${error.message}`);
        }
      }
    } finally {
      // Persist state after each job
      if (this.options.enablePersistence) {
        await this._persistPipelineState(state.runId, state);
      }
    }
  }

  /**
   * Internal: Execute agent for a job
   *
   * @private
   */
  async _executeAgent(jobDef, context, options) {
    // This is the integration point with agentful's agent system
    // For now, we'll create a placeholder that can be overridden

    if (this.options.agentExecutor) {
      return await this.options.agentExecutor(jobDef, context, options);
    }

    // Default implementation - would integrate with Claude Code Task API
    throw new Error('Agent executor not configured. Set options.agentExecutor');
  }

  /**
   * Internal: Build job context from dependencies
   *
   * @private
   */
  async _buildJobContext(state, jobId) {
    const jobDef = state.pipeline.jobs.find(j => j.id === jobId);
    const context = { ...state.context };

    // Add outputs from dependencies
    const dependencies = state.dependencyGraph[jobId] || [];
    for (const depId of dependencies) {
      const depJob = state.jobs[depId];
      if (depJob.status === JobStatus.COMPLETED && depJob.output) {
        context[depId] = depJob.output;
      }
    }

    // Add job-specific inputs
    if (jobDef.inputs) {
      context.inputs = jobDef.inputs;
    }

    return context;
  }

  /**
   * Internal: Validate pipeline definition
   *
   * @private
   */
  _validatePipeline(pipeline) {
    if (!pipeline.name) {
      throw new Error('Pipeline must have a name');
    }

    if (!pipeline.jobs || !Array.isArray(pipeline.jobs) || pipeline.jobs.length === 0) {
      throw new Error('Pipeline must have at least one job');
    }

    // Validate each job
    const jobIds = new Set();
    for (const job of pipeline.jobs) {
      if (!job.id) {
        throw new Error('Each job must have an id');
      }

      if (jobIds.has(job.id)) {
        throw new Error(`Duplicate job id: ${job.id}`);
      }
      jobIds.add(job.id);

      if (!job.agent) {
        throw new Error(`Job ${job.id} must specify an agent`);
      }

      // Validate dependencies exist
      if (job.dependsOn) {
        const deps = Array.isArray(job.dependsOn) ? job.dependsOn : [job.dependsOn];
        for (const depId of deps) {
          if (!jobIds.has(depId)) {
            throw new Error(`Job ${job.id} depends on unknown job: ${depId}`);
          }
        }
      }
    }

    // Check for circular dependencies
    this._detectCircularDependencies(pipeline.jobs);
  }

  /**
   * Internal: Build dependency graph
   *
   * @private
   */
  _buildDependencyGraph(jobs) {
    const graph = {};

    for (const job of jobs) {
      const deps = job.dependsOn
        ? (Array.isArray(job.dependsOn) ? job.dependsOn : [job.dependsOn])
        : [];

      graph[job.id] = deps;
    }

    return graph;
  }

  /**
   * Internal: Initialize job states
   *
   * @private
   */
  _initializeJobStates(jobs) {
    const states = {};

    for (const job of jobs) {
      states[job.id] = {
        id: job.id,
        name: job.name || job.id,
        status: JobStatus.PENDING,
        progress: 0,
        startedAt: null,
        completedAt: null,
        duration: null,
        output: null,
        error: null,
        errorStack: null,
        attemptCount: 0,
        logs: []
      };
    }

    return states;
  }

  /**
   * Internal: Detect circular dependencies
   *
   * @private
   */
  _detectCircularDependencies(jobs) {
    const graph = this._buildDependencyGraph(jobs);
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (jobId) => {
      visited.add(jobId);
      recursionStack.add(jobId);

      const dependencies = graph[jobId] || [];
      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(jobId);
      return false;
    };

    for (const job of jobs) {
      if (!visited.has(job.id)) {
        if (hasCycle(job.id)) {
          throw new Error('Circular dependency detected in pipeline');
        }
      }
    }
  }

  /**
   * Internal: Evaluate conditional expression
   *
   * @private
   */
  _evaluateCondition(condition, jobs) {
    // Simple condition evaluation
    // Supports: "job.status == 'completed'", "job.output.success == true"

    try {
      // Replace job references with actual values
      const conditionStr = condition.replace(/(\w+)\.(\w+)/g, (match, jobId, prop) => {
        const job = jobs[jobId];
        if (!job) return 'undefined';

        if (prop === 'status') return `'${job.status}'`;
        if (prop === 'output' && job.output) return JSON.stringify(job.output);

        return 'undefined';
      });

      // Evaluate (using Function to avoid eval)
      return new Function(`return ${conditionStr}`)();
    } catch (error) {
      console.error(`Failed to evaluate condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Internal: Calculate retry delay
   *
   * @private
   */
  _calculateRetryDelay(attemptCount, retryConfig) {
    if (!retryConfig) return this.options.retryDelayMs;

    const strategy = retryConfig.backoff || 'exponential';
    const baseDelay = retryConfig.delayMs || this.options.retryDelayMs;

    if (strategy === 'exponential') {
      return baseDelay * Math.pow(2, attemptCount - 1);
    } else if (strategy === 'linear') {
      return baseDelay * attemptCount;
    } else {
      return baseDelay;
    }
  }

  /**
   * Internal: Calculate pipeline progress
   *
   * @private
   */
  _calculateProgress(state) {
    const jobs = Object.values(state.jobs);
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(
      j => j.status === JobStatus.COMPLETED || j.status === JobStatus.SKIPPED
    ).length;

    return Math.round((completedJobs / totalJobs) * 100);
  }

  /**
   * Internal: Calculate pipeline duration
   *
   * @private
   */
  _calculateDuration(state) {
    if (!state.startedAt) return 0;

    const endTime = state.completedAt ? new Date(state.completedAt) : new Date();
    const startTime = new Date(state.startedAt);

    return endTime - startTime;
  }

  /**
   * Internal: Generate unique run ID
   *
   * @private
   */
  _generateRunId(pipelineName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${pipelineName}-${timestamp}-${random}`;
  }

  /**
   * Internal: Persist pipeline state to disk
   *
   * @private
   */
  async _persistPipelineState(runId, state) {
    const stateFile = path.join(this.options.stateDir, 'runs', `${runId}.json`);
    await fs.mkdir(path.dirname(stateFile), { recursive: true });
    await atomicWrite(stateFile, JSON.stringify(state, null, 2));
  }

  /**
   * Internal: Load pipeline state from disk
   *
   * @private
   */
  async _loadPipelineState(runId) {
    const stateFile = path.join(this.options.stateDir, 'runs', `${runId}.json`);

    try {
      const content = await fs.readFile(stateFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  /**
   * Internal: Wait for a job slot to become available
   *
   * @private
   */
  async _waitForJobSlot() {
    return new Promise(resolve => {
      const check = () => {
        if (this.activeJobCount < this.options.maxConcurrentJobs) {
          resolve();
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }

  /**
   * Internal: Cancel job execution
   *
   * @private
   */
  async _cancelJobExecution(execution) {
    // Implementation depends on agent executor
    // For now, just mark as cancelled
    if (execution.cancel) {
      await execution.cancel();
    }
  }
}

export default PipelineEngine;
