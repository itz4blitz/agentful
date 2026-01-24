import { EventEmitter } from 'events';

/**
 * Mock Executor for Testing
 *
 * Simulates the AgentExecutor from lib/pipeline/executor.js
 * without actually spawning processes or making real API calls
 */
export class MockExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.executions = new Map();
    this.shouldFail = options.shouldFail || false;
    this.executionDelay = options.executionDelay || 10;
  }

  async execute(jobDef, context, options = {}) {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const execution = {
      id: executionId,
      jobId: jobDef.id,
      agent: jobDef.agent,
      task: jobDef.task,
      status: 'running',
      output: '',
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null
    };

    this.executions.set(executionId, execution);
    this.emit('execution:started', execution);

    // Simulate async execution
    setTimeout(() => {
      if (this.shouldFail) {
        execution.status = 'failed';
        execution.error = 'Mock execution failed';
        execution.completedAt = new Date().toISOString();
        this.emit('execution:failed', execution);
      } else {
        execution.status = 'completed';
        execution.output = `Mock output for ${jobDef.task}`;
        execution.completedAt = new Date().toISOString();

        if (options.onProgress) {
          options.onProgress(100);
        }

        this.emit('execution:completed', execution);
      }
    }, this.executionDelay);

    return {
      success: !this.shouldFail,
      executionId,
      output: execution.output,
      duration: this.executionDelay
    };
  }

  getExecutionStatus(executionId) {
    return this.executions.get(executionId) || null;
  }

  async cancel(executionId) {
    const execution = this.executions.get(executionId);
    if (!execution) return false;

    execution.status = 'cancelled';
    execution.completedAt = new Date().toISOString();
    this.emit('execution:cancelled', execution);

    return true;
  }

  reset() {
    this.executions.clear();
    this.removeAllListeners();
    this.mockResults = new Map();
    this.mockError = null;
    this.mockDelay = 0;
  }

  /**
   * Set a mock result for a specific operation
   * @param {string} operation - Operation name (e.g., 'launched', 'status')
   * @param {*} result - Result to return
   */
  setMockResult(operation, result) {
    if (!this.mockResults) {
      this.mockResults = new Map();
    }
    this.mockResults.set(operation, result);
  }

  /**
   * Set a mock error to be thrown
   * @param {Error} error - Error to throw
   */
  setMockError(error) {
    this.mockError = error;
  }

  /**
   * Set a mock delay for operations
   * @param {number} delay - Delay in milliseconds
   */
  setMockDelay(delay) {
    this.mockDelay = delay;
  }

  /**
   * Get mock result for an operation
   * @param {string} operation - Operation name
   * @returns {*} Mock result
   */
  getMockResult(operation) {
    if (this.mockError) {
      throw this.mockError;
    }

    if (this.mockResults && this.mockResults.has(operation)) {
      return this.mockResults.get(operation);
    }

    return null;
  }
}
