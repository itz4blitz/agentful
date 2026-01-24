# Work Distribution Strategy

## Overview

This document outlines the intelligent work distribution strategy for the distributed MCP architecture, ensuring optimal task allocation, resource utilization, and fault tolerance across multiple worker nodes.

## Distribution Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Work Orchestrator                       │
├────────────────────────────────────────────────────────────┤
│  Task Queue │ Scheduler │ Distributor │ Monitor │ Metrics  │
└──────┬──────┴─────┬─────┴──────┬──────┴────┬────┴──────┬───┘
       │            │            │           │           │
       ▼            ▼            ▼           ▼           ▼
┌──────────────────────────────────────────────────────────────┐
│                      Distribution Engine                      │
├──────────────────────────────────────────────────────────────┤
│  Load Balancer │ Affinity Manager │ Resource Tracker │ Retry │
└────────┬────────┴─────────┬────────┴─────────┬────────┴──────┘
         │                  │                  │
         ▼                  ▼                  ▼
    ┌─────────┐       ┌─────────┐       ┌─────────┐
    │Worker 1│       │Worker 2│       │Worker N│
    └─────────┘       └─────────┘       └─────────┘
```

## Core Components

### Task Queue Manager

```javascript
import { EventEmitter } from 'events';
import PQueue from 'p-queue';

export class TaskQueueManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxConcurrent: config.maxConcurrent || 100,
      maxQueued: config.maxQueued || 1000,
      timeout: config.timeout || 300000, // 5 minutes
      priorityLevels: config.priorityLevels || 5,
      ...config
    };

    // Priority queues
    this.queues = new Map();
    for (let priority = 0; priority < this.config.priorityLevels; priority++) {
      this.queues.set(priority, new PQueue({
        concurrency: Math.ceil(this.config.maxConcurrent / this.config.priorityLevels),
        timeout: this.config.timeout,
        throwOnTimeout: true
      }));
    }

    // Task tracking
    this.activeTasks = new Map();
    this.completedTasks = new Map();
    this.failedTasks = new Map();
    this.taskDependencies = new Map();

    // Metrics
    this.metrics = {
      totalQueued: 0,
      totalActive: 0,
      totalCompleted: 0,
      totalFailed: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0
    };
  }

  /**
   * Submit a task to the queue
   */
  async submitTask(task) {
    // Validate task
    this.validateTask(task);

    // Check queue limits
    if (this.getTotalQueued() >= this.config.maxQueued) {
      throw new Error('Queue is full');
    }

    // Assign unique ID if not present
    task.id = task.id || this.generateTaskId();
    task.submittedAt = Date.now();
    task.status = 'queued';

    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      await this.waitForDependencies(task);
    }

    // Get priority queue
    const priority = task.priority || 2; // Default medium priority
    const queue = this.queues.get(Math.min(priority, this.config.priorityLevels - 1));

    // Add to queue with tracking
    const promise = queue.add(async () => {
      task.startedAt = Date.now();
      task.status = 'active';
      task.waitTime = task.startedAt - task.submittedAt;

      this.activeTasks.set(task.id, task);
      this.emit('task:started', task);

      try {
        const result = await this.executeTask(task);
        task.completedAt = Date.now();
        task.executionTime = task.completedAt - task.startedAt;
        task.status = 'completed';
        task.result = result;

        this.completedTasks.set(task.id, task);
        this.activeTasks.delete(task.id);
        this.updateMetrics(task);
        this.emit('task:completed', task);

        return result;

      } catch (error) {
        task.failedAt = Date.now();
        task.executionTime = task.failedAt - task.startedAt;
        task.status = 'failed';
        task.error = error.message;

        this.failedTasks.set(task.id, task);
        this.activeTasks.delete(task.id);
        this.emit('task:failed', task);

        throw error;
      }
    });

    this.metrics.totalQueued++;
    this.emit('task:queued', task);

    return { taskId: task.id, promise };
  }

  /**
   * Execute task (to be overridden by distributor)
   */
  async executeTask(task) {
    throw new Error('executeTask must be implemented by subclass');
  }

  /**
   * Wait for task dependencies
   */
  async waitForDependencies(task) {
    const pendingDeps = [];

    for (const depId of task.dependencies) {
      // Check if dependency is completed
      if (!this.completedTasks.has(depId)) {
        // Check if dependency exists
        if (!this.activeTasks.has(depId) && !this.taskDependencies.has(depId)) {
          throw new Error(`Dependency not found: ${depId}`);
        }

        pendingDeps.push(depId);
      }
    }

    if (pendingDeps.length > 0) {
      // Store task as waiting for dependencies
      this.taskDependencies.set(task.id, {
        task,
        waiting: pendingDeps
      });

      // Wait for dependencies to complete
      await new Promise((resolve) => {
        const checkDeps = () => {
          const allCompleted = pendingDeps.every(id =>
            this.completedTasks.has(id)
          );

          if (allCompleted) {
            this.taskDependencies.delete(task.id);
            resolve();
          } else {
            setTimeout(checkDeps, 100);
          }
        };

        checkDeps();
      });
    }
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.status = 'cancelled';
      this.activeTasks.delete(taskId);
      this.emit('task:cancelled', task);
      return true;
    }
    return false;
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId) {
    if (this.completedTasks.has(taskId)) {
      return this.completedTasks.get(taskId);
    }
    if (this.activeTasks.has(taskId)) {
      return this.activeTasks.get(taskId);
    }
    if (this.failedTasks.has(taskId)) {
      return this.failedTasks.get(taskId);
    }
    if (this.taskDependencies.has(taskId)) {
      return this.taskDependencies.get(taskId).task;
    }
    return null;
  }

  /**
   * Validate task structure
   */
  validateTask(task) {
    if (!task.type) {
      throw new Error('Task type is required');
    }

    if (!task.payload) {
      throw new Error('Task payload is required');
    }

    if (task.priority !== undefined &&
        (task.priority < 0 || task.priority >= this.config.priorityLevels)) {
      throw new Error(`Invalid priority: ${task.priority}`);
    }
  }

  /**
   * Update metrics
   */
  updateMetrics(task) {
    this.metrics.totalCompleted++;
    this.metrics.totalActive = this.activeTasks.size;

    // Update moving averages
    const alpha = 0.1;
    this.metrics.averageWaitTime =
      alpha * task.waitTime + (1 - alpha) * this.metrics.averageWaitTime;
    this.metrics.averageExecutionTime =
      alpha * task.executionTime + (1 - alpha) * this.metrics.averageExecutionTime;
  }

  /**
   * Get total queued tasks
   */
  getTotalQueued() {
    let total = 0;
    for (const queue of this.queues.values()) {
      total += queue.pending;
    }
    return total;
  }

  /**
   * Generate unique task ID
   */
  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Work Distributor

```javascript
export class WorkDistributor extends TaskQueueManager {
  constructor(clientPool, config = {}) {
    super(config);

    this.clientPool = clientPool;
    this.config = {
      ...this.config,
      algorithm: config.algorithm || 'smart',
      affinityEnabled: config.affinityEnabled !== false,
      batchSize: config.batchSize || 1,
      batchTimeout: config.batchTimeout || 100,
      ...config
    };

    // Task routing
    this.affinityMap = new Map();      // taskType -> clientId
    this.clientLoads = new Map();      // clientId -> load
    this.taskHistory = new Map();      // clientId -> task performance

    // Batching
    this.batchQueues = new Map();      // clientId -> batch queue
    this.batchTimers = new Map();      // clientId -> batch timer
  }

  /**
   * Execute task by distributing to appropriate worker
   */
  async executeTask(task) {
    const startTime = Date.now();

    try {
      // Select client based on distribution algorithm
      const client = await this.selectClient(task);

      // Track task assignment
      this.trackAssignment(client.id, task);

      // Execute based on batching configuration
      let result;
      if (this.config.batchSize > 1 && task.batchable) {
        result = await this.executeBatched(client, task);
      } else {
        result = await this.executeImmediate(client, task);
      }

      // Track completion
      this.trackCompletion(client.id, task, Date.now() - startTime, true);

      return result;

    } catch (error) {
      // Track failure
      if (task.clientId) {
        this.trackCompletion(task.clientId, task, Date.now() - startTime, false);
      }

      // Retry with different client if possible
      if (task.retryCount < (task.maxRetries || 3)) {
        task.retryCount = (task.retryCount || 0) + 1;
        task.excludeClients = task.excludeClients || [];
        task.excludeClients.push(task.clientId);

        this.emit('task:retrying', task);
        return await this.executeTask(task);
      }

      throw error;
    }
  }

  /**
   * Select client based on distribution algorithm
   */
  async selectClient(task) {
    switch (this.config.algorithm) {
      case 'round-robin':
        return await this.selectRoundRobin(task);

      case 'least-load':
        return await this.selectLeastLoad(task);

      case 'affinity':
        return await this.selectWithAffinity(task);

      case 'resource-based':
        return await this.selectResourceBased(task);

      case 'smart':
      default:
        return await this.selectSmart(task);
    }
  }

  /**
   * Smart selection combining multiple strategies
   */
  async selectSmart(task) {
    // 1. Check for affinity
    if (this.config.affinityEnabled && task.affinityKey) {
      const affinityClient = await this.getAffinityClient(task);
      if (affinityClient && this.isClientSuitable(affinityClient, task)) {
        return affinityClient;
      }
    }

    // 2. Get available clients
    const clients = await this.getAvailableClients(task);

    if (clients.length === 0) {
      throw new Error('No suitable clients available');
    }

    // 3. Score clients based on multiple factors
    const scores = clients.map(client => {
      let score = 100;

      // Load factor (lower load = higher score)
      const load = this.getClientLoad(client.id);
      score -= load * 0.5;

      // Performance history (better history = higher score)
      const history = this.getClientHistory(client.id, task.type);
      if (history) {
        score += history.successRate * 20;
        score -= history.averageLatency / 100;
      }

      // Resource availability
      const resources = this.clientPool.loadMetrics.get(client.id);
      if (resources) {
        score -= resources.cpuUsage * 0.3;
        score -= resources.memoryUsage * 0.2;
      }

      // Task type specialization
      if (client.capabilities && client.capabilities.includes(task.type)) {
        score += 10;
      }

      return { client, score };
    });

    // 4. Select best client
    scores.sort((a, b) => b.score - a.score);
    const selected = scores[0].client;

    // 5. Update affinity if enabled
    if (this.config.affinityEnabled && task.affinityKey) {
      this.affinityMap.set(task.affinityKey, selected.id);
    }

    return selected;
  }

  /**
   * Select using round-robin
   */
  async selectRoundRobin(task) {
    const clients = await this.getAvailableClients(task);

    if (clients.length === 0) {
      throw new Error('No clients available');
    }

    if (!this.roundRobinIndex) {
      this.roundRobinIndex = 0;
    }

    const client = clients[this.roundRobinIndex % clients.length];
    this.roundRobinIndex++;

    return client;
  }

  /**
   * Select least loaded client
   */
  async selectLeastLoad(task) {
    const clients = await this.getAvailableClients(task);

    if (clients.length === 0) {
      throw new Error('No clients available');
    }

    let minLoad = Infinity;
    let selectedClient = null;

    for (const client of clients) {
      const load = this.getClientLoad(client.id);
      if (load < minLoad) {
        minLoad = load;
        selectedClient = client;
      }
    }

    return selectedClient || clients[0];
  }

  /**
   * Select with affinity
   */
  async selectWithAffinity(task) {
    if (!task.affinityKey) {
      return await this.selectLeastLoad(task);
    }

    const clientId = this.affinityMap.get(task.affinityKey);
    if (clientId) {
      const client = await this.clientPool.getClient({ clientId });
      if (client && this.isClientSuitable(client, task)) {
        return client;
      }
    }

    // No affinity found, select new client
    const client = await this.selectLeastLoad(task);
    this.affinityMap.set(task.affinityKey, client.id);
    return client;
  }

  /**
   * Select based on resource requirements
   */
  async selectResourceBased(task) {
    const requirements = task.requirements || {};
    const clients = await this.getAvailableClients(task);

    // Filter clients that meet requirements
    const suitable = clients.filter(client => {
      const metrics = this.clientPool.loadMetrics.get(client.id);
      if (!metrics) return true;

      if (requirements.maxCpu && metrics.cpuUsage > requirements.maxCpu) {
        return false;
      }

      if (requirements.maxMemory && metrics.memoryUsage > requirements.maxMemory) {
        return false;
      }

      if (requirements.maxLoad && this.getClientLoad(client.id) > requirements.maxLoad) {
        return false;
      }

      return true;
    });

    if (suitable.length === 0) {
      throw new Error('No clients meet resource requirements');
    }

    // Select least loaded from suitable clients
    return await this.selectLeastLoad({ ...task, _clients: suitable });
  }

  /**
   * Execute task immediately
   */
  async executeImmediate(client, task) {
    task.clientId = client.id;

    const message = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: task.type,
        arguments: task.payload
      },
      id: task.id
    };

    const result = await client.send(message);

    if (result.error) {
      throw new Error(result.error.message || 'Task execution failed');
    }

    return result.content;
  }

  /**
   * Execute task in batch
   */
  async executeBatched(client, task) {
    return new Promise((resolve, reject) => {
      // Add to batch queue
      if (!this.batchQueues.has(client.id)) {
        this.batchQueues.set(client.id, []);
      }

      const batch = this.batchQueues.get(client.id);
      batch.push({ task, resolve, reject });

      // Check if batch is full
      if (batch.length >= this.config.batchSize) {
        this.flushBatch(client.id);
      } else {
        // Set timer for batch timeout
        if (!this.batchTimers.has(client.id)) {
          const timer = setTimeout(() => {
            this.flushBatch(client.id);
          }, this.config.batchTimeout);

          this.batchTimers.set(client.id, timer);
        }
      }
    });
  }

  /**
   * Flush batch for client
   */
  async flushBatch(clientId) {
    const batch = this.batchQueues.get(clientId);
    if (!batch || batch.length === 0) return;

    // Clear timer
    const timer = this.batchTimers.get(clientId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(clientId);
    }

    // Clear queue
    this.batchQueues.set(clientId, []);

    // Execute batch
    const client = await this.clientPool.getClient({ clientId });
    const batchRequest = {
      jsonrpc: '2.0',
      method: 'batch/execute',
      params: {
        tasks: batch.map(item => ({
          id: item.task.id,
          type: item.task.type,
          payload: item.task.payload
        }))
      },
      id: `batch-${Date.now()}`
    };

    try {
      const result = await client.send(batchRequest);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Resolve individual tasks
      const results = result.content;
      batch.forEach((item, index) => {
        if (results[index].error) {
          item.reject(new Error(results[index].error));
        } else {
          item.resolve(results[index].result);
        }
      });

    } catch (error) {
      // Reject all tasks in batch
      batch.forEach(item => item.reject(error));
    }
  }

  /**
   * Get available clients for task
   */
  async getAvailableClients(task) {
    // Override clients if provided (for recursion)
    if (task._clients) {
      return task._clients;
    }

    const allClients = await this.clientPool.getHealthyClients();

    // Filter out excluded clients
    if (task.excludeClients && task.excludeClients.length > 0) {
      return allClients.filter(c => !task.excludeClients.includes(c.id));
    }

    return allClients;
  }

  /**
   * Get affinity client
   */
  async getAffinityClient(task) {
    const clientId = this.affinityMap.get(task.affinityKey);
    if (!clientId) return null;

    try {
      return await this.clientPool.getClient({ clientId });
    } catch {
      // Client no longer available, clear affinity
      this.affinityMap.delete(task.affinityKey);
      return null;
    }
  }

  /**
   * Check if client is suitable for task
   */
  isClientSuitable(client, task) {
    // Check if client is healthy
    if (!this.clientPool.isHealthy(client.id)) {
      return false;
    }

    // Check if client is not overloaded
    const load = this.getClientLoad(client.id);
    if (load > 80) {
      return false;
    }

    // Check requirements
    if (task.requirements) {
      const metrics = this.clientPool.loadMetrics.get(client.id);
      if (!metrics) return true;

      if (task.requirements.maxLatency &&
          metrics.averageLatency > task.requirements.maxLatency) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get client load percentage
   */
  getClientLoad(clientId) {
    const tracked = this.clientLoads.get(clientId) || { active: 0 };
    const metrics = this.clientPool.loadMetrics.get(clientId) || {};

    // Combine tracked active tasks with reported metrics
    const load = (
      tracked.active * 10 +
      (metrics.activeRequests || 0) * 10 +
      (metrics.cpuUsage || 0) * 0.5 +
      (metrics.memoryUsage || 0) * 0.3
    );

    return Math.min(load, 100);
  }

  /**
   * Get client performance history
   */
  getClientHistory(clientId, taskType) {
    const history = this.taskHistory.get(clientId);
    if (!history) return null;

    return history[taskType] || history.overall;
  }

  /**
   * Track task assignment
   */
  trackAssignment(clientId, task) {
    const load = this.clientLoads.get(clientId) || { active: 0, total: 0 };
    load.active++;
    load.total++;
    this.clientLoads.set(clientId, load);
  }

  /**
   * Track task completion
   */
  trackCompletion(clientId, task, latency, success) {
    // Update load
    const load = this.clientLoads.get(clientId);
    if (load) {
      load.active = Math.max(0, load.active - 1);
    }

    // Update history
    let history = this.taskHistory.get(clientId);
    if (!history) {
      history = {};
      this.taskHistory.set(clientId, history);
    }

    if (!history[task.type]) {
      history[task.type] = {
        totalTasks: 0,
        successfulTasks: 0,
        successRate: 0,
        totalLatency: 0,
        averageLatency: 0
      };
    }

    const typeHistory = history[task.type];
    typeHistory.totalTasks++;
    if (success) {
      typeHistory.successfulTasks++;
    }
    typeHistory.totalLatency += latency;
    typeHistory.successRate = typeHistory.successfulTasks / typeHistory.totalTasks;
    typeHistory.averageLatency = typeHistory.totalLatency / typeHistory.totalTasks;

    // Update overall history
    if (!history.overall) {
      history.overall = {
        totalTasks: 0,
        successfulTasks: 0,
        successRate: 0,
        totalLatency: 0,
        averageLatency: 0
      };
    }

    history.overall.totalTasks++;
    if (success) {
      history.overall.successfulTasks++;
    }
    history.overall.totalLatency += latency;
    history.overall.successRate = history.overall.successfulTasks / history.overall.totalTasks;
    history.overall.averageLatency = history.overall.totalLatency / history.overall.totalTasks;
  }

  /**
   * Get distribution statistics
   */
  getStatistics() {
    const stats = {
      queue: super.getStatistics(),
      distribution: {
        algorithm: this.config.algorithm,
        affinityEnabled: this.config.affinityEnabled,
        batchSize: this.config.batchSize
      },
      clients: [],
      taskTypes: {}
    };

    // Client statistics
    for (const [clientId, load] of this.clientLoads) {
      const history = this.taskHistory.get(clientId) || {};
      stats.clients.push({
        id: clientId,
        load: this.getClientLoad(clientId),
        activeTasks: load.active,
        totalTasks: load.total,
        performance: history.overall || {}
      });
    }

    // Task type statistics
    for (const [clientId, history] of this.taskHistory) {
      for (const [taskType, perf] of Object.entries(history)) {
        if (taskType === 'overall') continue;

        if (!stats.taskTypes[taskType]) {
          stats.taskTypes[taskType] = {
            totalTasks: 0,
            successRate: 0,
            averageLatency: 0
          };
        }

        const typeStats = stats.taskTypes[taskType];
        typeStats.totalTasks += perf.totalTasks;
        typeStats.successRate = (typeStats.successRate + perf.successRate) / 2;
        typeStats.averageLatency = (typeStats.averageLatency + perf.averageLatency) / 2;
      }
    }

    return stats;
  }
}
```

### Specialized Distribution Strategies

#### Geographic Distribution

```javascript
class GeographicDistributor extends WorkDistributor {
  constructor(clientPool, config) {
    super(clientPool, config);

    this.regionMap = new Map();  // clientId -> region
    this.latencyMap = new Map(); // region -> region -> latency
  }

  async selectClient(task) {
    // Get task origin region
    const taskRegion = task.region || 'default';

    // Get clients by region
    const regionalClients = this.getClientsByRegion(taskRegion);

    if (regionalClients.length > 0) {
      // Select from same region
      return super.selectLeastLoad({ ...task, _clients: regionalClients });
    }

    // Find nearest region
    const nearestRegion = this.findNearestRegion(taskRegion);
    const nearbyClients = this.getClientsByRegion(nearestRegion);

    if (nearbyClients.length > 0) {
      return super.selectLeastLoad({ ...task, _clients: nearbyClients });
    }

    // Fall back to global selection
    return super.selectClient(task);
  }

  getClientsByRegion(region) {
    const clients = [];
    for (const [clientId, clientRegion] of this.regionMap) {
      if (clientRegion === region) {
        const client = this.clientPool.clients.get(clientId);
        if (client && this.clientPool.isHealthy(clientId)) {
          clients.push(client);
        }
      }
    }
    return clients;
  }

  findNearestRegion(region) {
    const latencies = this.latencyMap.get(region);
    if (!latencies) return 'default';

    let minLatency = Infinity;
    let nearestRegion = 'default';

    for (const [otherRegion, latency] of latencies) {
      if (latency < minLatency && this.hasClientsInRegion(otherRegion)) {
        minLatency = latency;
        nearestRegion = otherRegion;
      }
    }

    return nearestRegion;
  }

  hasClientsInRegion(region) {
    return this.getClientsByRegion(region).length > 0;
  }
}
```

#### Cost-Optimized Distribution

```javascript
class CostOptimizedDistributor extends WorkDistributor {
  constructor(clientPool, config) {
    super(clientPool, config);

    this.costMap = new Map();     // clientId -> cost per task
    this.budgetTracker = new Map(); // project -> spent amount
  }

  async selectClient(task) {
    const budget = task.budget || Infinity;
    const project = task.project || 'default';

    // Get current spend
    const spent = this.budgetTracker.get(project) || 0;
    const remaining = budget - spent;

    if (remaining <= 0) {
      throw new Error('Budget exceeded for project');
    }

    // Get clients within budget
    const affordableClients = [];
    for (const [clientId, client] of this.clientPool.clients) {
      const cost = this.costMap.get(clientId) || 1;
      if (cost <= remaining && this.clientPool.isHealthy(clientId)) {
        affordableClients.push({ client, cost });
      }
    }

    if (affordableClients.length === 0) {
      throw new Error('No clients within budget');
    }

    // Sort by cost-effectiveness (performance/cost ratio)
    affordableClients.sort((a, b) => {
      const perfA = this.getClientPerformance(a.client.id);
      const perfB = this.getClientPerformance(b.client.id);
      const ratioA = perfA / a.cost;
      const ratioB = perfB / b.cost;
      return ratioB - ratioA;
    });

    const selected = affordableClients[0];

    // Track spend
    this.budgetTracker.set(project, spent + selected.cost);

    return selected.client;
  }

  getClientPerformance(clientId) {
    const history = this.taskHistory.get(clientId);
    if (!history || !history.overall) return 0.5;

    return history.overall.successRate * (1000 / history.overall.averageLatency);
  }
}
```

## Advanced Features

### Predictive Scaling

```javascript
class PredictiveScaler {
  constructor(distributor, clientPool) {
    this.distributor = distributor;
    this.clientPool = clientPool;
    this.history = [];
    this.predictions = {};
  }

  startPrediction() {
    // Collect metrics every minute
    setInterval(() => {
      this.collectMetrics();
      this.makePredictions();
      this.adjustCapacity();
    }, 60000);
  }

  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      queueDepth: this.distributor.getTotalQueued(),
      activeClients: this.clientPool.getHealthyClients().length,
      averageLoad: this.calculateAverageLoad(),
      taskRate: this.calculateTaskRate()
    };

    this.history.push(metrics);

    // Keep last 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.history = this.history.filter(m => m.timestamp > cutoff);
  }

  makePredictions() {
    // Simple moving average prediction
    const recentHistory = this.history.slice(-10);
    if (recentHistory.length < 5) return;

    const avgQueueDepth = recentHistory.reduce((sum, m) => sum + m.queueDepth, 0) / recentHistory.length;
    const avgLoad = recentHistory.reduce((sum, m) => sum + m.averageLoad, 0) / recentHistory.length;

    // Predict 5 minutes ahead
    this.predictions = {
      queueDepth: avgQueueDepth * 1.1, // Assume 10% growth
      load: avgLoad * 1.1,
      timestamp: Date.now() + 300000
    };
  }

  adjustCapacity() {
    if (!this.predictions.queueDepth) return;

    const currentClients = this.clientPool.clients.size;
    const targetClients = Math.ceil(this.predictions.queueDepth / 10);

    if (targetClients > currentClients && currentClients < this.clientPool.config.maxSize) {
      // Scale up
      this.clientPool.createClient().catch(err => {
        console.error('Failed to scale up:', err);
      });
    } else if (targetClients < currentClients && currentClients > this.clientPool.config.minSize) {
      // Scale down
      const idleClient = this.findIdleClient();
      if (idleClient) {
        this.clientPool.removeClient(idleClient.id).catch(err => {
          console.error('Failed to scale down:', err);
        });
      }
    }
  }

  findIdleClient() {
    for (const [clientId, client] of this.clientPool.clients) {
      const load = this.distributor.getClientLoad(clientId);
      if (load < 10) {
        return client;
      }
    }
    return null;
  }

  calculateAverageLoad() {
    const loads = [];
    for (const clientId of this.clientPool.clients.keys()) {
      loads.push(this.distributor.getClientLoad(clientId));
    }
    return loads.length > 0 ? loads.reduce((a, b) => a + b) / loads.length : 0;
  }

  calculateTaskRate() {
    if (this.history.length < 2) return 0;

    const recent = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];
    const timeDiff = (recent.timestamp - previous.timestamp) / 1000;

    return (recent.queueDepth - previous.queueDepth) / timeDiff;
  }
}
```

## Testing

```javascript
import { describe, it, expect } from '@jest/globals';

describe('Work Distribution', () => {
  let clientPool;
  let distributor;

  beforeEach(() => {
    clientPool = new MockClientPool();
    distributor = new WorkDistributor(clientPool, {
      algorithm: 'smart',
      batchSize: 3,
      batchTimeout: 100
    });
  });

  it('should distribute tasks evenly', async () => {
    // Add mock clients
    await clientPool.addMockClient('client1');
    await clientPool.addMockClient('client2');
    await clientPool.addMockClient('client3');

    // Submit tasks
    const tasks = [];
    for (let i = 0; i < 9; i++) {
      tasks.push(distributor.submitTask({
        type: 'test',
        payload: { index: i },
        priority: 2
      }));
    }

    await Promise.all(tasks);

    // Check distribution
    const stats = distributor.getStatistics();
    expect(stats.clients).toHaveLength(3);

    // Each client should have processed ~3 tasks
    for (const client of stats.clients) {
      expect(client.totalTasks).toBeGreaterThanOrEqual(2);
      expect(client.totalTasks).toBeLessThanOrEqual(4);
    }
  });

  it('should respect task affinity', async () => {
    await clientPool.addMockClient('client1');
    await clientPool.addMockClient('client2');

    // Submit tasks with same affinity
    const task1 = await distributor.submitTask({
      type: 'test',
      payload: { data: 'test1' },
      affinityKey: 'project-123'
    });

    const task2 = await distributor.submitTask({
      type: 'test',
      payload: { data: 'test2' },
      affinityKey: 'project-123'
    });

    // Both should go to same client
    expect(task1.clientId).toBe(task2.clientId);
  });

  it('should batch tasks', async () => {
    await clientPool.addMockClient('client1');

    const tasks = [];
    for (let i = 0; i < 3; i++) {
      tasks.push(distributor.submitTask({
        type: 'test',
        payload: { index: i },
        batchable: true
      }));
    }

    // Wait for batch timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Check that tasks were batched
    const client = clientPool.clients.get('client1');
    expect(client.receivedBatch).toBe(true);
    expect(client.batchSize).toBe(3);
  });

  it('should retry failed tasks', async () => {
    const failingClient = await clientPool.addMockClient('failing', {
      failRate: 1.0 // Always fails
    });

    const successClient = await clientPool.addMockClient('success', {
      failRate: 0 // Always succeeds
    });

    const result = await distributor.submitTask({
      type: 'test',
      payload: { data: 'retry-test' },
      maxRetries: 1
    });

    // Should succeed on retry with different client
    expect(result).toBeDefined();
  });
});
```

## Configuration Examples

### Basic Configuration

```yaml
distribution:
  algorithm: smart
  affinityEnabled: true
  batchSize: 10
  batchTimeout: 100
  maxConcurrent: 100
  maxQueued: 1000
  priorityLevels: 5
```

### Advanced Configuration

```javascript
const distributor = new WorkDistributor(clientPool, {
  // Algorithm selection
  algorithm: 'smart', // smart, round-robin, least-load, affinity, resource-based

  // Batching
  batchSize: 10,
  batchTimeout: 100,

  // Affinity
  affinityEnabled: true,
  affinityTimeout: 3600000, // 1 hour

  // Queuing
  maxConcurrent: 100,
  maxQueued: 1000,
  queueTimeout: 300000,

  // Priority levels (0 = highest)
  priorityLevels: 5,

  // Retry
  defaultMaxRetries: 3,
  retryDelay: 1000,
  retryBackoff: 2,

  // Performance tracking
  trackHistory: true,
  historySize: 1000,

  // Custom scoring weights
  scoringWeights: {
    load: 0.4,
    performance: 0.3,
    resources: 0.2,
    capabilities: 0.1
  }
});
```

## Monitoring & Metrics

```javascript
class DistributionMetrics {
  constructor(distributor) {
    this.distributor = distributor;
    this.prometheus = new PrometheusClient();

    this.registerMetrics();
    this.startCollection();
  }

  registerMetrics() {
    // Queue metrics
    this.prometheus.register('distribution_queue_depth', 'gauge');
    this.prometheus.register('distribution_queue_wait_time', 'histogram');

    // Task metrics
    this.prometheus.register('distribution_tasks_total', 'counter');
    this.prometheus.register('distribution_tasks_failed', 'counter');
    this.prometheus.register('distribution_task_duration', 'histogram');

    // Client metrics
    this.prometheus.register('distribution_client_load', 'gauge');
    this.prometheus.register('distribution_client_tasks', 'counter');

    // Affinity metrics
    this.prometheus.register('distribution_affinity_hits', 'counter');
    this.prometheus.register('distribution_affinity_misses', 'counter');
  }

  startCollection() {
    setInterval(() => {
      const stats = this.distributor.getStatistics();

      // Update queue metrics
      this.prometheus.set('distribution_queue_depth', stats.queue.totalQueued);

      // Update client metrics
      for (const client of stats.clients) {
        this.prometheus.set('distribution_client_load', client.load, {
          client: client.id
        });
      }
    }, 10000);
  }
}
```

## Conclusion

The work distribution strategy provides intelligent, scalable task allocation across distributed MCP workers. With support for multiple algorithms, batching, affinity, and predictive scaling, it ensures optimal resource utilization and high performance.