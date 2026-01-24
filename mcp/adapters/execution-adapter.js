/**
 * MCP Execution Adapter
 *
 * Bridges MCP server to agentful's agent execution pipeline.
 * Reuses existing execution logic from lib/pipeline/executor.js and lib/server/executor.js.
 *
 * @module mcp/adapters/execution-adapter
 */

import { AgentExecutor } from '../../lib/pipeline/executor.js';
import { ClaudeExecutor, ExecutionMode, ExecutionState } from '../../lib/core/claude-executor.js';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Execution Adapter
 *
 * Provides MCP-compatible interface to agentful's execution systems.
 * Uses ClaudeExecutor for subprocess execution and AgentExecutor for pipeline jobs.
 */
export class ExecutionAdapter {
  /**
   * Create execution adapter
   *
   * @param {Object} config - Adapter configuration
   * @param {string} [config.agentsDir='.claude/agents'] - Agents directory
   * @param {string} [config.tempDir='.agentful/temp'] - Temporary files directory
   * @param {string} [config.projectRoot=process.cwd()] - Project root directory
   * @param {string} [config.claudeCommand='claude'] - Claude CLI command
   * @param {number} [config.timeout=600000] - Default timeout in ms (10 minutes)
   * @param {boolean} [config.streamOutput=true] - Stream output as chunks
   */
  constructor(config = {}) {
    this.config = {
      agentsDir: config.agentsDir || '.claude/agents',
      tempDir: config.tempDir || '.agentful/temp',
      projectRoot: config.projectRoot || process.cwd(),
      claudeCommand: config.claudeCommand || 'claude',
      timeout: config.timeout || 600000,
      streamOutput: config.streamOutput !== false,
      ...config,
    };

    // Initialize executors
    this.pipelineExecutor = new AgentExecutor({
      agentsDir: this.config.agentsDir,
      tempDir: this.config.tempDir,
      claudeCommand: this.config.claudeCommand,
      streamLogs: this.config.streamOutput,
    });

    this.claudeExecutor = new ClaudeExecutor({
      mode: ExecutionMode.SUBPROCESS,
      projectRoot: this.config.projectRoot,
      agentsDir: this.config.agentsDir,
      claudeCommand: this.config.claudeCommand,
      timeout: this.config.timeout,
      streamOutput: this.config.streamOutput,
    });

    // Store active executions for MCP polling
    this.executions = new Map();
  }

  /**
   * Execute an agent with a task
   *
   * @param {string} agentName - Name of the agent
   * @param {string} task - Task description
   * @param {Object} [context={}] - Execution context
   * @param {Object} [context.files] - Relevant files
   * @param {Object} [context.requirements] - Requirements
   * @param {Object} [context.variables] - Variables for interpolation
   * @param {Object} [options={}] - Execution options
   * @param {boolean} [options.async=false] - Return immediately with executionId
   * @param {number} [options.timeout] - Override timeout
   * @param {Function} [options.onChunk] - Streaming chunk callback
   * @param {Function} [options.onProgress] - Progress callback
   * @returns {Promise<Object>} Execution result or { executionId, state: 'pending' }
   */
  async executeAgent(agentName, task, context = {}, options = {}) {
    const { async = false, onChunk, onProgress, ...execOptions } = options;
    const executionId = randomUUID();

    // Build execution record for tracking
    const execution = {
      id: executionId,
      agent: agentName,
      task,
      context,
      state: ExecutionState.PENDING,
      startTime: Date.now(),
      endTime: null,
      output: null,
      error: null,
      progress: 0,
    };

    this.executions.set(executionId, execution);

    // If async mode, start in background
    if (async) {
      this._executeInBackground(executionId, agentName, task, context, execOptions);

      return {
        executionId,
        state: ExecutionState.PENDING,
        message: 'Execution started in background. Use getExecutionStatus() to poll.',
      };
    }

    // Synchronous mode - wait for completion
    return this._executeSynchronous(executionId, agentName, task, context, execOptions);
  }

  /**
   * Execute agent synchronously (internal method)
   *
   * @private
   */
  async _executeSynchronous(executionId, agentName, task, context, options) {
    const execution = this.executions.get(executionId);

    try {
      execution.state = ExecutionState.RUNNING;

      // Register streaming callbacks if provided
      if (options.onChunk) {
        this.claudeExecutor.on('chunk', (event) => {
          if (event.executionId === executionId) {
            options.onChunk(event.text);
          }
        });
      }

      if (options.onProgress) {
        this.claudeExecutor.on('progress', (event) => {
          if (event.executionId === executionId) {
            execution.progress = event.percentage;
            options.onProgress(event.percentage, event.message);
          }
        });
      }

      // Execute using ClaudeExecutor
      const result = await this.claudeExecutor.execute(agentName, task, context, {
        timeout: options.timeout || this.config.timeout,
      });

      // Update execution record
      execution.state = ExecutionState.COMPLETED;
      execution.endTime = Date.now();
      execution.output = result.output;
      execution.progress = 100;

      return {
        executionId,
        state: ExecutionState.COMPLETED,
        output: result.output,
        duration: execution.endTime - execution.startTime,
        success: true,
      };

    } catch (error) {
      // Update execution record with error
      execution.state = ExecutionState.FAILED;
      execution.endTime = Date.now();
      execution.error = error.message;

      return {
        executionId,
        state: ExecutionState.FAILED,
        error: error.message,
        duration: execution.endTime - execution.startTime,
        success: false,
      };
    } finally {
      // Cleanup execution after delay to allow status polling
      setTimeout(() => {
        this.executions.delete(executionId);
      }, 60000); // Keep for 1 minute
    }
  }

  /**
   * Execute agent in background (internal method)
   *
   * @private
   */
  async _executeInBackground(executionId, agentName, task, context, options) {
    // Run execution asynchronously and update tracked state
    this._executeSynchronous(executionId, agentName, task, context, options)
      .catch((error) => {
        // Error already handled in _executeSynchronous
        console.error(`Background execution ${executionId} failed:`, error.message);
      });
  }

  /**
   * Get execution status
   *
   * @param {string} executionId - Execution ID
   * @returns {Object|null} Execution status or null if not found
   *
   * Returns:
   * {
   *   id: string,
   *   agent: string,
   *   task: string,
   *   state: 'pending' | 'running' | 'completed' | 'failed',
   *   startTime: number,
   *   endTime: number | null,
   *   duration: number,
   *   progress: number (0-100),
   *   output: string | null,
   *   error: string | null
   * }
   */
  getExecutionStatus(executionId) {
    const execution = this.executions.get(executionId);

    if (!execution) {
      return null;
    }

    const duration = execution.endTime
      ? execution.endTime - execution.startTime
      : Date.now() - execution.startTime;

    return {
      id: execution.id,
      agent: execution.agent,
      task: execution.task,
      state: execution.state,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration,
      progress: execution.progress,
      output: execution.output,
      error: execution.error,
    };
  }

  /**
   * Cancel an active execution
   *
   * @param {string} executionId - Execution ID to cancel
   * @returns {boolean} True if cancelled, false if not found or already completed
   */
  async cancelExecution(executionId) {
    const execution = this.executions.get(executionId);

    if (!execution) {
      return false;
    }

    // Can't cancel completed/failed executions
    if (execution.state === ExecutionState.COMPLETED || execution.state === ExecutionState.FAILED) {
      return false;
    }

    // Try to cancel in ClaudeExecutor
    const cancelled = this.claudeExecutor.cancel(executionId);

    if (cancelled) {
      execution.state = ExecutionState.CANCELLED;
      execution.endTime = Date.now();
      execution.error = 'Execution cancelled by user';
      return true;
    }

    return false;
  }

  /**
   * List all active executions
   *
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.agent] - Filter by agent name
   * @param {string} [filters.state] - Filter by state
   * @param {number} [filters.limit=100] - Maximum results
   * @returns {Object[]} Array of execution statuses
   */
  listExecutions(filters = {}) {
    const { agent, state, limit = 100 } = filters;

    let results = Array.from(this.executions.values());

    // Apply filters
    if (agent) {
      results = results.filter((e) => e.agent === agent);
    }

    if (state) {
      results = results.filter((e) => e.state === state);
    }

    // Sort by start time (newest first)
    results.sort((a, b) => b.startTime - a.startTime);

    // Limit results
    results = results.slice(0, limit);

    // Return summary
    return results.map((e) => this.getExecutionStatus(e.id));
  }

  /**
   * Execute a pipeline job (for complex multi-step workflows)
   *
   * @param {Object} jobDef - Job definition
   * @param {string} jobDef.id - Job ID
   * @param {string} jobDef.agent - Agent name
   * @param {string} jobDef.task - Task description
   * @param {string} [jobDef.prompt] - Custom prompt
   * @param {Object} [context={}] - Execution context
   * @param {Object} [options={}] - Execution options
   * @returns {Promise<Object>} Execution result
   */
  async executePipelineJob(jobDef, context = {}, options = {}) {
    try {
      const result = await this.pipelineExecutor.execute(jobDef, context, options);
      return {
        success: result.success,
        output: result.output,
        duration: result.duration,
        jobId: jobDef.id,
      };
    } catch (error) {
      throw new Error(`Pipeline job execution failed: ${error.message}`);
    }
  }

  /**
   * Get pipeline executor for advanced use cases
   *
   * @returns {AgentExecutor} Pipeline executor instance
   */
  getPipelineExecutor() {
    return this.pipelineExecutor;
  }

  /**
   * Get Claude executor for advanced use cases
   *
   * @returns {ClaudeExecutor} Claude executor instance
   */
  getClaudeExecutor() {
    return this.claudeExecutor;
  }

  /**
   * Cleanup old executions (prevent memory leak)
   *
   * @param {number} [maxAge=3600000] - Maximum age in ms (default: 1 hour)
   * @returns {number} Number of executions cleaned up
   */
  cleanupExecutions(maxAge = 3600000) {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [id, execution] of this.executions.entries()) {
      if (execution.endTime && execution.endTime < cutoff) {
        this.executions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }
}

/**
 * Create execution adapter instance
 *
 * @param {Object} config - Adapter configuration
 * @returns {ExecutionAdapter} Adapter instance
 */
export function createExecutionAdapter(config = {}) {
  return new ExecutionAdapter(config);
}

export default ExecutionAdapter;
