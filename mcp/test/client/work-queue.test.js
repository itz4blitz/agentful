import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkQueue, TaskStatus } from '../../client/work-queue.js';

/**
 * Work Queue Tests
 *
 * Tests the work queue functionality:
 * - Task enqueueing
 * - Priority handling
 * - Task execution
 * - Retry logic
 * - Status tracking
 */
describe('WorkQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new WorkQueue({
      maxRetries: 3,
      retryDelay: 100,
      taskTimeout: 5000,
      concurrentTasks: 5
    });
  });

  afterEach(() => {
    queue.clearCompleted();
  });

  describe('Queue Initialization', () => {
    it('should create queue with default options', () => {
      const q = new WorkQueue();

      expect(q.maxRetries).toBe(3);
      expect(q.concurrentTasks).toBe(10);
      expect(q.processing).toBe(false);
    });

    it('should create queue with custom options', () => {
      const q = new WorkQueue({
        maxRetries: 5,
        concurrentTasks: 20
      });

      expect(q.maxRetries).toBe(5);
      expect(q.concurrentTasks).toBe(20);
    });
  });

  describe('Task Enqueueing', () => {
    it('should enqueue a task', async () => {
      const taskPromise = queue.enqueue('tool_call', {
        name: 'test-tool',
        arguments: { arg1: 'value1' }
      });

      expect(queue.tasks.size).toBe(1);
      expect(queue.pendingQueue.length).toBe(1);

      // Don't wait for completion
      taskPromise.catch(() => {}); // Prevent unhandled rejection
    });

    it('should enqueue task with priority', async () => {
      const task1Promise = queue.enqueue('tool_call', { name: 'tool1' }, { priority: 1 });
      const task2Promise = queue.enqueue('tool_call', { name: 'tool2' }, { priority: 10 });
      const task3Promise = queue.enqueue('tool_call', { name: 'tool3' }, { priority: 5 });

      // Higher priority should be first
      const firstTaskId = queue.pendingQueue[0];
      const firstTask = queue.tasks.get(firstTaskId);

      expect(firstTask.priority).toBe(10);

      // Prevent unhandled rejections
      task1Promise.catch(() => {});
      task2Promise.catch(() => {});
      task3Promise.catch(() => {});
    });

    it('should emit task-queued event', (done) => {
      queue.once('task-queued', (taskId, task) => {
        expect(taskId).toBeDefined();
        expect(task.type).toBe('tool_call');
        done();
      });

      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});
    });
  });

  describe('Task Execution', () => {
    it('should execute a task', async () => {
      const taskPromise = queue.enqueue('tool_call', {
        name: 'test-tool',
        arguments: {}
      });

      const taskId = queue.getNextTask();
      expect(taskId).toBeDefined();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockResolvedValue({ success: true })
        }
      };

      const result = await queue.executeTask(taskId, mockServer);

      expect(result).toEqual({ success: true });
      expect(mockServer.client.callTool).toHaveBeenCalledWith('test-tool', {});
    });

    it('should execute resource read task', async () => {
      const taskPromise = queue.enqueue('resource_read', {
        uri: 'agentful://state/current'
      });

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          readResource: vi.fn().mockResolvedValue({ contents: 'resource-data' })
        }
      };

      const result = await queue.executeTask(taskId, mockServer);

      expect(result).toEqual({ contents: 'resource-data' });
      expect(mockServer.client.readResource).toHaveBeenCalledWith('agentful://state/current');
    });

    it('should track active tasks', async () => {
      const taskPromise = queue.enqueue('tool_call', { name: 'test-tool' });

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockImplementation(() => {
            // Check active tasks during execution
            expect(queue.activeTasks.has(taskId)).toBe(true);
            return Promise.resolve({ success: true });
          })
        }
      };

      await queue.executeTask(taskId, mockServer);

      expect(queue.activeTasks.has(taskId)).toBe(false);
    });

    it('should emit task-started event', async () => {
      const startedPromise = new Promise((resolve) => {
        queue.once('task-started', (taskId, serverId) => {
          expect(taskId).toBeDefined();
          expect(serverId).toBe('test-server');
          resolve();
        });
      });

      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockResolvedValue({ success: true })
        }
      };

      await queue.executeTask(taskId, mockServer);
      await startedPromise;
    });

    it('should emit task-completed event', async () => {
      const completedPromise = new Promise((resolve) => {
        queue.once('task-completed', (taskId, result) => {
          expect(taskId).toBeDefined();
          expect(result).toEqual({ success: true });
          resolve();
        });
      });

      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockResolvedValue({ success: true })
        }
      };

      await queue.executeTask(taskId, mockServer);
      await completedPromise;
    });
  });

  describe('Task Retry Logic', () => {
    it('should retry failed task', async () => {
      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockRejectedValue(new Error('Task failed'))
        }
      };

      await expect(queue.executeTask(taskId, mockServer)).rejects.toThrow('Task failed');

      const task = queue.tasks.get(taskId);
      expect(task.retryCount).toBe(1);
      expect(task.status).toBe(TaskStatus.RETRYING);
    });

    it('should emit task-retry event', async () => {
      const retryPromise = new Promise((resolve) => {
        queue.once('task-retry', (taskId, retryCount, error) => {
          expect(retryCount).toBe(1);
          expect(error).toBeDefined();
          resolve();
        });
      });

      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockRejectedValue(new Error('Task failed'))
        }
      };

      try {
        await queue.executeTask(taskId, mockServer);
      } catch {
        // Expected
      }

      await retryPromise;
    });

    it('should fail after max retries', async () => {
      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockRejectedValue(new Error('Task failed'))
        }
      };

      // Execute multiple times to exceed retry limit
      for (let i = 0; i <= queue.maxRetries; i++) {
        try {
          await queue.executeTask(taskId, mockServer);
        } catch {
          // Expected
        }

        // Re-queue if still retrying
        if (i < queue.maxRetries) {
          const task = queue.tasks.get(taskId);
          task.status = TaskStatus.PENDING;
          queue.pendingQueue.push(taskId);
        }
      }

      const task = queue.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.FAILED);
    });
  });

  describe('Task Cancellation', () => {
    it('should cancel pending task', () => {
      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = Array.from(queue.tasks.keys())[0];

      queue.cancelTask(taskId);

      const task = queue.tasks.get(taskId);
      expect(task.status).toBe(TaskStatus.FAILED);
      expect(task.error.message).toBe('Task cancelled');
      expect(queue.pendingQueue).not.toContain(taskId);
    });

    it('should emit task-cancelled event', (done) => {
      queue.once('task-cancelled', (taskId) => {
        expect(taskId).toBeDefined();
        done();
      });

      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = Array.from(queue.tasks.keys())[0];
      queue.cancelTask(taskId);
    });
  });

  describe('Queue Management', () => {
    it('should get next task from queue', () => {
      queue.enqueue('tool_call', { name: 'tool1' }).catch(() => {});
      queue.enqueue('tool_call', { name: 'tool2' }).catch(() => {});

      const taskId1 = queue.getNextTask();
      const taskId2 = queue.getNextTask();

      expect(taskId1).toBeDefined();
      expect(taskId2).toBeDefined();
      expect(taskId1).not.toBe(taskId2);
    });

    it('should return null when queue is empty', () => {
      const taskId = queue.getNextTask();
      expect(taskId).toBeNull();
    });

    it('should respect concurrent task limit', () => {
      queue.concurrentTasks = 2;

      // Enqueue 3 tasks
      queue.enqueue('tool_call', { name: 'tool1' }).catch(() => {});
      queue.enqueue('tool_call', { name: 'tool2' }).catch(() => {});
      queue.enqueue('tool_call', { name: 'tool3' }).catch(() => {});

      // Get 2 tasks (at capacity)
      queue.getNextTask();
      queue.getNextTask();

      // Should return null (at capacity)
      const nextTask = queue.getNextTask();
      expect(nextTask).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should get queue statistics', () => {
      queue.enqueue('tool_call', { name: 'tool1' }).catch(() => {});
      queue.enqueue('tool_call', { name: 'tool2' }).catch(() => {});

      const stats = queue.getStats();

      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('inProgress');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
      expect(stats).toHaveProperty('total');
      expect(stats.total).toBe(2);
    });

    it('should get pending tasks', () => {
      queue.enqueue('tool_call', { name: 'tool1' }, { priority: 5 }).catch(() => {});
      queue.enqueue('tool_call', { name: 'tool2' }, { priority: 10 }).catch(() => {});

      const pending = queue.getPendingTasks();

      expect(pending).toHaveLength(2);
      expect(pending[0]).toHaveProperty('type', 'tool_call');
      expect(pending[0]).toHaveProperty('priority');
    });

    it('should get active tasks', async () => {
      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockImplementation(async () => {
            // Check active tasks during execution
            const active = queue.getActiveTasks();
            expect(active).toHaveLength(1);
            expect(active[0].id).toBe(taskId);
            expect(active[0].serverId).toBe('test-server');
            return { success: true };
          })
        }
      };

      await queue.executeTask(taskId, mockServer);
    });
  });

  describe('Task Status', () => {
    it('should get task status', () => {
      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = Array.from(queue.tasks.keys())[0];
      const status = queue.getTaskStatus(taskId);

      expect(status).toBeDefined();
      expect(status.id).toBe(taskId);
      expect(status.type).toBe('tool_call');
      expect(status.status).toBe(TaskStatus.PENDING);
    });

    it('should return null for non-existent task', () => {
      const status = queue.getTaskStatus('non-existent');
      expect(status).toBeNull();
    });
  });

  describe('Clear Completed', () => {
    it('should clear completed tasks', async () => {
      queue.enqueue('tool_call', { name: 'test-tool' }).catch(() => {});

      const taskId = queue.getNextTask();

      const mockServer = {
        serverId: 'test-server',
        client: {
          callTool: vi.fn().mockResolvedValue({ success: true })
        }
      };

      await queue.executeTask(taskId, mockServer);

      expect(queue.completedTasks.size).toBeGreaterThan(0);

      queue.clearCompleted();

      expect(queue.completedTasks.size).toBe(0);
    });
  });
});
