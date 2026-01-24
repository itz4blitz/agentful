/**
 * Work Queue
 *
 * Queues pending MCP tool calls, distributes work to available servers,
 * retries failed calls, and tracks execution status.
 *
 * @module mcp/client/work-queue
 */

import { EventEmitter } from 'events';

/**
 * Task status
 */
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying'
};

/**
 * Work Queue
 */
export class WorkQueue extends EventEmitter {
  constructor(options = {}) {
    super();

    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.taskTimeout = options.taskTimeout || 300000; // 5 minutes
    this.concurrentTasks = options.concurrentTasks || 10;

    this.tasks = new Map(); // taskId -> task
    this.pendingQueue = []; // Array of task IDs waiting to execute
    this.activeTasks = new Map(); // taskId -> serverId
    this.completedTasks = new Map(); // taskId -> result
    this.failedTasks = new Map(); // taskId -> error

    this.taskIdCounter = 0;
    this.processing = false;
  }

  /**
   * Enqueue a new task
   *
   * @param {string} type - Task type ('tool_call' or 'resource_read')
   * @param {Object} params - Task parameters
   * @param {Object} [options] - Task options
   * @returns {Promise<Object>} Task result
   */
  async enqueue(type, params, options = {}) {
    const taskId = this._generateTaskId();
    const priority = options.priority || 0;

    const task = {
      id: taskId,
      type,
      params,
      priority,
      status: TaskStatus.PENDING,
      retryCount: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      serverId: null,
      error: null
    };

    this.tasks.set(taskId, task);

    // Insert into queue based on priority
    this._insertByPriority(taskId, priority);

    this.emit('task-queued', taskId, task);

    // Start processing if not already running
    if (!this.processing) {
      this._processQueue();
    }

    // Return promise that resolves when task completes
    return new Promise((resolve, reject) => {
      const checkComplete = () => {
        if (this.completedTasks.has(taskId)) {
          const result = this.completedTasks.get(taskId);
          this.completedTasks.delete(taskId);
          this.tasks.delete(taskId);
          resolve(result);
        } else if (this.failedTasks.has(taskId)) {
          const error = this.failedTasks.get(taskId);
          this.failedTasks.delete(taskId);
          this.tasks.delete(taskId);
          reject(error);
        } else {
          setTimeout(checkComplete, 100);
        }
      };

      checkComplete();
    });
  }

  /**
   * Execute a task on a specific server
   *
   * @param {string} taskId - Task ID
   * @param {Object} server - Server object with execute method
   * @returns {Promise<Object>} Task result
   */
  async executeTask(taskId, server) {
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === TaskStatus.IN_PROGRESS) {
      throw new Error(`Task already in progress: ${taskId}`);
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.startedAt = new Date();
    task.serverId = server.serverId;
    this.activeTasks.set(taskId, server.serverId);

    this.emit('task-started', taskId, server.serverId);

    try {
      // Setup timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.taskTimeout);
      });

      // Execute task
      let resultPromise;

      if (task.type === 'tool_call') {
        resultPromise = server.client.callTool(task.params.name, task.params.arguments);
      } else if (task.type === 'resource_read') {
        resultPromise = server.client.readResource(task.params.uri);
      } else {
        throw new Error(`Unknown task type: ${task.type}`);
      }

      const result = await Promise.race([resultPromise, timeoutPromise]);

      // Task completed successfully
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      this.activeTasks.delete(taskId);
      this.completedTasks.set(taskId, result);

      this.emit('task-completed', taskId, result);

      return result;

    } catch (error) {
      this.activeTasks.delete(taskId);

      // Check if should retry
      if (task.retryCount < this.maxRetries) {
        task.retryCount++;
        task.status = TaskStatus.RETRYING;
        task.error = error;

        this.emit('task-retry', taskId, task.retryCount, error);

        // Re-queue with exponential backoff
        const delay = this.retryDelay * Math.pow(2, task.retryCount - 1);

        setTimeout(() => {
          task.status = TaskStatus.PENDING;
          this._insertByPriority(taskId, task.priority);
          this._processQueue();
        }, delay);

        throw error;

      } else {
        // Max retries exceeded
        task.status = TaskStatus.FAILED;
        task.completedAt = new Date();
        task.error = error;
        this.failedTasks.set(taskId, error);

        this.emit('task-failed', taskId, error);

        throw error;
      }
    }
  }

  /**
   * Cancel a pending or active task
   *
   * @param {string} taskId - Task ID
   */
  cancelTask(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) {
      return;
    }

    // Remove from pending queue
    const queueIndex = this.pendingQueue.indexOf(taskId);
    if (queueIndex !== -1) {
      this.pendingQueue.splice(queueIndex, 1);
    }

    // Mark as failed
    task.status = TaskStatus.FAILED;
    task.completedAt = new Date();
    task.error = new Error('Task cancelled');
    this.activeTasks.delete(taskId);
    this.failedTasks.set(taskId, task.error);

    this.emit('task-cancelled', taskId);
  }

  /**
   * Get task status
   *
   * @param {string} taskId - Task ID
   * @returns {Object|null} Task status or null if not found
   */
  getTaskStatus(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) {
      return null;
    }

    return {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      retryCount: task.retryCount,
      serverId: task.serverId,
      createdAt: task.createdAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      error: task.error?.message
    };
  }

  /**
   * Get queue statistics
   *
   * @returns {Object} Queue statistics
   */
  getStats() {
    const stats = {
      pending: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      retrying: 0
    };

    for (const task of this.tasks.values()) {
      if (task.status === TaskStatus.PENDING) stats.pending++;
      else if (task.status === TaskStatus.IN_PROGRESS) stats.inProgress++;
      else if (task.status === TaskStatus.COMPLETED) stats.completed++;
      else if (task.status === TaskStatus.FAILED) stats.failed++;
      else if (task.status === TaskStatus.RETRYING) stats.retrying++;
    }

    return {
      ...stats,
      total: this.tasks.size,
      queueLength: this.pendingQueue.length,
      activeTasks: this.activeTasks.size
    };
  }

  /**
   * Get pending tasks
   *
   * @returns {Array<Object>} Array of pending tasks
   */
  getPendingTasks() {
    return this.pendingQueue.map(taskId => {
      const task = this.tasks.get(taskId);
      return {
        id: task.id,
        type: task.type,
        priority: task.priority,
        retryCount: task.retryCount,
        createdAt: task.createdAt
      };
    });
  }

  /**
   * Get active tasks
   *
   * @returns {Array<Object>} Array of active tasks
   */
  getActiveTasks() {
    const active = [];

    for (const [taskId, serverId] of this.activeTasks) {
      const task = this.tasks.get(taskId);
      if (task) {
        active.push({
          id: task.id,
          type: task.type,
          serverId,
          startedAt: task.startedAt
        });
      }
    }

    return active;
  }

  /**
   * Clear completed and failed tasks
   */
  clearCompleted() {
    this.completedTasks.clear();
    this.failedTasks.clear();
  }

  /**
   * Process queue (internal)
   *
   * @private
   */
  _processQueue() {
    this.processing = true;

    // This will be called by the server pool to pull tasks
    // The actual execution is delegated to the pool
    this.emit('queue-ready');
  }

  /**
   * Get next task from queue
   *
   * @returns {string|null} Task ID or null if queue is empty
   */
  getNextTask() {
    if (this.pendingQueue.length === 0) {
      this.processing = false;
      return null;
    }

    if (this.activeTasks.size >= this.concurrentTasks) {
      return null; // At capacity
    }

    return this.pendingQueue.shift();
  }

  /**
   * Insert task into queue by priority
   *
   * @private
   * @param {string} taskId - Task ID
   * @param {number} priority - Task priority (higher = more important)
   */
  _insertByPriority(taskId, priority) {
    // Find insertion point
    let insertIndex = this.pendingQueue.length;

    for (let i = 0; i < this.pendingQueue.length; i++) {
      const queuedTaskId = this.pendingQueue[i];
      const queuedTask = this.tasks.get(queuedTaskId);

      if (queuedTask && priority > queuedTask.priority) {
        insertIndex = i;
        break;
      }
    }

    this.pendingQueue.splice(insertIndex, 0, taskId);
  }

  /**
   * Generate unique task ID
   *
   * @private
   * @returns {string} Task ID
   */
  _generateTaskId() {
    return `task-${Date.now()}-${++this.taskIdCounter}`;
  }
}

export default WorkQueue;
