# MCP Client Pool Architecture

## Overview

This document details the client pool architecture for managing multiple MCP server connections, enabling intelligent routing, health monitoring, and fault tolerance across distributed workers.

## Architecture Components

```
┌──────────────────────────────────────────────────────┐
│                    Client Pool Manager                │
├──────────────────────────────────────────────────────┤
│  Connection Management │ Health Monitoring │ Metrics  │
├────────────┬──────────┴────────┬────────┴───────────┤
│            │                    │                     │
│  ┌─────────▼────────┐ ┌────────▼────────┐ ┌─────────▼────────┐
│  │ Active Clients   │ │ Health Checker  │ │ Load Balancer   │
│  │ ┌──────────────┐ │ │ ┌─────────────┐ │ │ ┌──────────────┐│
│  │ │ Client 1     │ │ │ │ Ping Tests  │ │ │ │ Least Load   ││
│  │ │ Client 2     │ │ │ │ Latency     │ │ │ │ Round Robin  ││
│  │ │ Client 3     │ │ │ │ Capacity    │ │ │ │ Affinity     ││
│  │ │ ...          │ │ │ └─────────────┘ │ │ └──────────────┘│
│  │ └──────────────┘ │ └─────────────────┘ └──────────────────┘
│  └──────────────────┘                                          │
└────────────────────────────────────────────────────────────────┘
```

## Core Implementation

### Client Pool Manager

```javascript
import { EventEmitter } from 'events';
import { HttpSseTransport } from './transports/http-sse.js';
import { OAuthClient } from './auth/oauth-client.js';

export class MCPClientPool extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      minSize: config.minSize || 2,
      maxSize: config.maxSize || 10,
      connectionTimeout: config.connectionTimeout || 10000,
      requestTimeout: config.requestTimeout || 30000,
      healthCheckInterval: config.healthCheckInterval || 30000,
      healthCheckTimeout: config.healthCheckTimeout || 5000,
      unhealthyThreshold: config.unhealthyThreshold || 3,
      healthyThreshold: config.healthyThreshold || 2,
      loadBalancingAlgorithm: config.loadBalancingAlgorithm || 'least-load',
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    // Client management
    this.clients = new Map();           // id -> MCPClient
    this.healthStatus = new Map();      // id -> HealthStatus
    this.loadMetrics = new Map();       // id -> LoadMetrics
    this.affinityMap = new Map();       // key -> client_id

    // Connection state
    this.connectionQueue = [];
    this.pendingConnections = new Set();
    this.isStarted = false;

    // Health checking
    this.healthCheckTimers = new Map();
    this.failureCounts = new Map();

    // Metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      totalRequests: 0,
      failedRequests: 0,
      averageLatency: 0
    };
  }

  /**
   * Start the client pool
   */
  async start() {
    if (this.isStarted) return;

    this.isStarted = true;
    this.emit('starting');

    // Create initial connections
    const connectionPromises = [];
    for (let i = 0; i < this.config.minSize; i++) {
      connectionPromises.push(this.createClient());
    }

    // Wait for minimum connections
    const results = await Promise.allSettled(connectionPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    if (successful < 1) {
      throw new Error('Failed to establish minimum connections');
    }

    this.emit('started', {
      successful,
      failed: results.length - successful,
      total: this.clients.size
    });

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Create a new MCP client
   */
  async createClient(endpoint = null) {
    const clientId = this.generateClientId();

    try {
      // Get endpoint from config or discovery
      if (!endpoint) {
        endpoint = await this.discoverEndpoint();
      }

      // Create OAuth client for authentication
      const authClient = new OAuthClient({
        tokenEndpoint: `${endpoint.auth}/oauth/token`,
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret
      });

      // Get initial token
      const token = await authClient.getAccessToken();

      // Create transport
      const transport = new HttpSseTransport({
        baseUrl: endpoint.url,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        requestTimeout: this.config.requestTimeout,
        reconnectDelay: this.config.retryDelay
      });

      // Connect transport
      await this.withTimeout(
        transport.connect(),
        this.config.connectionTimeout,
        'Connection timeout'
      );

      // Create MCP client wrapper
      const client = new MCPClient({
        id: clientId,
        transport,
        authClient,
        endpoint
      });

      // Setup event handlers
      this.setupClientEventHandlers(client);

      // Store client
      this.clients.set(clientId, client);
      this.healthStatus.set(clientId, {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0
      });
      this.loadMetrics.set(clientId, {
        activeRequests: 0,
        totalRequests: 0,
        averageLatency: 0,
        cpuUsage: 0,
        memoryUsage: 0
      });

      this.metrics.totalConnections++;
      this.metrics.activeConnections++;

      this.emit('client:connected', { clientId, endpoint: endpoint.url });

      return client;

    } catch (error) {
      this.metrics.failedConnections++;
      this.emit('client:error', { clientId, error });
      throw error;
    }
  }

  /**
   * Setup client event handlers
   */
  setupClientEventHandlers(client) {
    client.on('error', (error) => {
      this.handleClientError(client.id, error);
    });

    client.on('disconnected', () => {
      this.handleClientDisconnection(client.id);
    });

    client.on('metrics', (metrics) => {
      this.updateLoadMetrics(client.id, metrics);
    });

    client.on('notification', (notification) => {
      this.emit('notification', { clientId: client.id, notification });
    });
  }

  /**
   * Get an available client based on load balancing
   */
  async getClient(options = {}) {
    const { affinity, requirements } = options;

    // Check affinity first
    if (affinity) {
      const affinityClient = this.getAffinityClient(affinity);
      if (affinityClient && this.isHealthy(affinityClient.id)) {
        return affinityClient;
      }
    }

    // Get healthy clients
    const healthyClients = this.getHealthyClients();

    if (healthyClients.length === 0) {
      // Try to create new client if under max
      if (this.clients.size < this.config.maxSize) {
        return await this.createClient();
      }
      throw new Error('No healthy clients available');
    }

    // Apply load balancing
    const client = this.selectClient(healthyClients, requirements);

    // Set affinity if requested
    if (affinity) {
      this.affinityMap.set(affinity, client.id);
    }

    return client;
  }

  /**
   * Select client based on load balancing algorithm
   */
  selectClient(clients, requirements) {
    switch (this.config.loadBalancingAlgorithm) {
      case 'least-load':
        return this.selectLeastLoadedClient(clients);

      case 'round-robin':
        return this.selectRoundRobinClient(clients);

      case 'weighted':
        return this.selectWeightedClient(clients, requirements);

      case 'random':
        return clients[Math.floor(Math.random() * clients.length)];

      default:
        return clients[0];
    }
  }

  /**
   * Select least loaded client
   */
  selectLeastLoadedClient(clients) {
    let minLoad = Infinity;
    let selectedClient = null;

    for (const client of clients) {
      const load = this.calculateClientLoad(client.id);
      if (load < minLoad) {
        minLoad = load;
        selectedClient = client;
      }
    }

    return selectedClient || clients[0];
  }

  /**
   * Select client using round-robin
   */
  selectRoundRobinClient(clients) {
    if (!this.roundRobinIndex) {
      this.roundRobinIndex = 0;
    }

    const client = clients[this.roundRobinIndex % clients.length];
    this.roundRobinIndex++;

    return client;
  }

  /**
   * Select client based on weights and requirements
   */
  selectWeightedClient(clients, requirements) {
    const weights = clients.map(client => {
      const metrics = this.loadMetrics.get(client.id);
      const health = this.healthStatus.get(client.id);

      let weight = 100;

      // Reduce weight based on load
      weight -= metrics.activeRequests * 10;
      weight -= metrics.cpuUsage;
      weight -= metrics.memoryUsage / 10;

      // Reduce weight for unhealthy connections
      if (health.consecutiveFailures > 0) {
        weight -= health.consecutiveFailures * 20;
      }

      // Boost weight if client meets specific requirements
      if (requirements) {
        if (requirements.lowLatency && metrics.averageLatency < 100) {
          weight += 20;
        }
        if (requirements.highThroughput && metrics.activeRequests < 5) {
          weight += 15;
        }
      }

      return Math.max(weight, 1);
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < clients.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return clients[i];
      }
    }

    return clients[clients.length - 1];
  }

  /**
   * Calculate client load score
   */
  calculateClientLoad(clientId) {
    const metrics = this.loadMetrics.get(clientId);
    if (!metrics) return Infinity;

    return (
      metrics.activeRequests * 100 +
      metrics.cpuUsage +
      metrics.memoryUsage / 10 +
      metrics.averageLatency / 10
    );
  }

  /**
   * Get healthy clients
   */
  getHealthyClients() {
    const healthy = [];

    for (const [id, client] of this.clients) {
      if (this.isHealthy(id)) {
        healthy.push(client);
      }
    }

    return healthy;
  }

  /**
   * Check if client is healthy
   */
  isHealthy(clientId) {
    const health = this.healthStatus.get(clientId);
    return health && health.status === 'healthy';
  }

  /**
   * Get affinity client
   */
  getAffinityClient(affinityKey) {
    const clientId = this.affinityMap.get(affinityKey);
    return clientId ? this.clients.get(clientId) : null;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    for (const [id, client] of this.clients) {
      this.startHealthCheck(id);
    }
  }

  /**
   * Start health check for a client
   */
  startHealthCheck(clientId) {
    // Clear existing timer
    if (this.healthCheckTimers.has(clientId)) {
      clearInterval(this.healthCheckTimers.get(clientId));
    }

    // Setup new health check timer
    const timer = setInterval(async () => {
      await this.performHealthCheck(clientId);
    }, this.config.healthCheckInterval);

    this.healthCheckTimers.set(clientId, timer);

    // Perform immediate health check
    this.performHealthCheck(clientId);
  }

  /**
   * Perform health check
   */
  async performHealthCheck(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const start = Date.now();

      // Perform health check with timeout
      const health = await this.withTimeout(
        client.healthCheck(),
        this.config.healthCheckTimeout,
        'Health check timeout'
      );

      const latency = Date.now() - start;

      // Update health status
      const currentHealth = this.healthStatus.get(clientId) || {};
      const newHealth = {
        status: 'healthy',
        lastCheck: Date.now(),
        latency,
        consecutiveFailures: 0,
        ...health
      };

      // Check if transitioning to healthy
      if (currentHealth.status === 'unhealthy' &&
          currentHealth.consecutiveFailures >= this.config.healthyThreshold) {
        this.emit('client:healthy', { clientId });
      }

      this.healthStatus.set(clientId, newHealth);

      // Update metrics
      this.updateLoadMetrics(clientId, health.metrics || {});

    } catch (error) {
      this.handleHealthCheckFailure(clientId, error);
    }
  }

  /**
   * Handle health check failure
   */
  handleHealthCheckFailure(clientId, error) {
    const health = this.healthStatus.get(clientId) || {
      consecutiveFailures: 0
    };

    health.consecutiveFailures++;
    health.lastCheck = Date.now();
    health.lastError = error.message;

    if (health.consecutiveFailures >= this.config.unhealthyThreshold) {
      health.status = 'unhealthy';
      this.emit('client:unhealthy', { clientId, error: error.message });

      // Try to recover
      this.attemptClientRecovery(clientId);
    }

    this.healthStatus.set(clientId, health);
  }

  /**
   * Attempt to recover unhealthy client
   */
  async attemptClientRecovery(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.emit('client:recovering', { clientId });

    try {
      // Try to reconnect
      await client.reconnect();

      // Reset health status
      this.healthStatus.set(clientId, {
        status: 'healthy',
        lastCheck: Date.now(),
        consecutiveFailures: 0
      });

      this.emit('client:recovered', { clientId });

    } catch (error) {
      this.emit('client:recovery-failed', { clientId, error: error.message });

      // Remove client if recovery fails
      if (this.clients.size > this.config.minSize) {
        await this.removeClient(clientId);
      }
    }
  }

  /**
   * Handle client error
   */
  handleClientError(clientId, error) {
    this.emit('client:error', { clientId, error });

    // Increment failure count
    const failures = (this.failureCounts.get(clientId) || 0) + 1;
    this.failureCounts.set(clientId, failures);

    // Mark unhealthy if too many failures
    if (failures >= this.config.unhealthyThreshold) {
      const health = this.healthStatus.get(clientId);
      if (health) {
        health.status = 'unhealthy';
        this.healthStatus.set(clientId, health);
      }
    }
  }

  /**
   * Handle client disconnection
   */
  async handleClientDisconnection(clientId) {
    this.emit('client:disconnected', { clientId });

    const health = this.healthStatus.get(clientId);
    if (health) {
      health.status = 'disconnected';
      this.healthStatus.set(clientId, health);
    }

    // Try to reconnect or replace
    if (this.clients.size < this.config.minSize) {
      try {
        await this.createClient();
      } catch (error) {
        this.emit('client:replacement-failed', { clientId, error });
      }
    }
  }

  /**
   * Update load metrics
   */
  updateLoadMetrics(clientId, metrics) {
    const current = this.loadMetrics.get(clientId) || {};
    this.loadMetrics.set(clientId, {
      ...current,
      ...metrics,
      lastUpdate: Date.now()
    });
  }

  /**
   * Remove a client
   */
  async removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Stop health check
    if (this.healthCheckTimers.has(clientId)) {
      clearInterval(this.healthCheckTimers.get(clientId));
      this.healthCheckTimers.delete(clientId);
    }

    // Disconnect client
    try {
      await client.disconnect();
    } catch (error) {
      this.emit('client:disconnect-error', { clientId, error });
    }

    // Clean up maps
    this.clients.delete(clientId);
    this.healthStatus.delete(clientId);
    this.loadMetrics.delete(clientId);
    this.failureCounts.delete(clientId);

    // Clean up affinity
    for (const [key, id] of this.affinityMap) {
      if (id === clientId) {
        this.affinityMap.delete(key);
      }
    }

    this.metrics.activeConnections--;
    this.emit('client:removed', { clientId });

    // Ensure minimum connections
    if (this.isStarted && this.clients.size < this.config.minSize) {
      this.createClient().catch(error => {
        this.emit('client:creation-failed', { error });
      });
    }
  }

  /**
   * Execute with timeout
   */
  async withTimeout(promise, timeout, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), timeout)
      )
    ]);
  }

  /**
   * Discover available endpoint
   */
  async discoverEndpoint() {
    // This would integrate with service discovery
    // For now, return from config
    const endpoints = this.config.endpoints || [];
    if (endpoints.length === 0) {
      throw new Error('No endpoints configured');
    }

    // Simple round-robin selection
    if (!this.endpointIndex) {
      this.endpointIndex = 0;
    }

    const endpoint = endpoints[this.endpointIndex % endpoints.length];
    this.endpointIndex++;

    return endpoint;
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get pool statistics
   */
  getStatistics() {
    const stats = {
      pool: {
        size: this.clients.size,
        minSize: this.config.minSize,
        maxSize: this.config.maxSize,
        healthy: this.getHealthyClients().length,
        unhealthy: this.clients.size - this.getHealthyClients().length
      },
      metrics: this.metrics,
      clients: []
    };

    for (const [id, client] of this.clients) {
      const health = this.healthStatus.get(id);
      const load = this.loadMetrics.get(id);

      stats.clients.push({
        id,
        endpoint: client.endpoint.url,
        health: health ? health.status : 'unknown',
        load: this.calculateClientLoad(id),
        metrics: load
      });
    }

    return stats;
  }

  /**
   * Shutdown the pool
   */
  async shutdown() {
    this.isStarted = false;
    this.emit('shutting-down');

    // Stop all health checks
    for (const timer of this.healthCheckTimers.values()) {
      clearInterval(timer);
    }
    this.healthCheckTimers.clear();

    // Disconnect all clients
    const disconnectPromises = [];
    for (const [id, client] of this.clients) {
      disconnectPromises.push(client.disconnect());
    }

    await Promise.allSettled(disconnectPromises);

    // Clear all maps
    this.clients.clear();
    this.healthStatus.clear();
    this.loadMetrics.clear();
    this.failureCounts.clear();
    this.affinityMap.clear();

    this.emit('shutdown');
  }
}

/**
 * MCP Client Wrapper
 */
class MCPClient extends EventEmitter {
  constructor(options) {
    super();

    this.id = options.id;
    this.transport = options.transport;
    this.authClient = options.authClient;
    this.endpoint = options.endpoint;

    this.setupTransportHandlers();
  }

  setupTransportHandlers() {
    this.transport.on('error', (error) => {
      this.emit('error', error);
    });

    this.transport.on('disconnected', () => {
      this.emit('disconnected');
    });

    this.transport.on('notification', (data) => {
      this.emit('notification', data);
    });
  }

  async healthCheck() {
    const start = Date.now();
    const result = await this.transport.send({
      jsonrpc: '2.0',
      method: 'health',
      params: {},
      id: `health-${Date.now()}`
    });

    return {
      latency: Date.now() - start,
      ...result
    };
  }

  async reconnect() {
    // Refresh auth token
    const token = await this.authClient.getAccessToken();
    this.transport.headers['Authorization'] = `Bearer ${token}`;

    // Reconnect transport
    await this.transport.disconnect();
    await this.transport.connect();
  }

  async disconnect() {
    await this.transport.disconnect();
    await this.authClient.revoke();
  }

  async send(message) {
    return await this.transport.send(message);
  }
}
```

## Advanced Features

### Circuit Breaker Integration

```javascript
class CircuitBreakerPool extends MCPClientPool {
  constructor(config) {
    super(config);

    this.circuitBreakers = new Map();
    this.breakerConfig = {
      threshold: config.breakerThreshold || 5,
      timeout: config.breakerTimeout || 60000,
      resetTimeout: config.breakerResetTimeout || 30000
    };
  }

  async getClient(options = {}) {
    const client = await super.getClient(options);

    // Get or create circuit breaker
    if (!this.circuitBreakers.has(client.id)) {
      this.circuitBreakers.set(client.id, new CircuitBreaker(this.breakerConfig));
    }

    const breaker = this.circuitBreakers.get(client.id);

    // Wrap client with circuit breaker
    return new Proxy(client, {
      get(target, prop) {
        if (typeof target[prop] === 'function') {
          return async (...args) => {
            return breaker.execute(() => target[prop](...args));
          };
        }
        return target[prop];
      }
    });
  }

  handleClientError(clientId, error) {
    super.handleClientError(clientId, error);

    // Record failure in circuit breaker
    const breaker = this.circuitBreakers.get(clientId);
    if (breaker) {
      breaker.recordFailure();
    }
  }
}
```

### Adaptive Load Balancing

```javascript
class AdaptiveLoadBalancer {
  constructor(pool) {
    this.pool = pool;
    this.performanceHistory = new Map();
    this.learningRate = 0.1;
  }

  async selectClient(task) {
    const clients = this.pool.getHealthyClients();
    if (clients.length === 0) return null;

    // Calculate performance scores
    const scores = clients.map(client => {
      const history = this.performanceHistory.get(client.id) || {
        successRate: 0.5,
        averageLatency: 1000,
        taskCount: 0
      };

      // Calculate score based on historical performance
      const score = (
        history.successRate * 100 -
        history.averageLatency / 10 -
        this.pool.calculateClientLoad(client.id) / 10
      );

      return { client, score, history };
    });

    // Select client with best score (with exploration)
    if (Math.random() < this.learningRate) {
      // Exploration: random selection
      return clients[Math.floor(Math.random() * clients.length)];
    } else {
      // Exploitation: best score
      scores.sort((a, b) => b.score - a.score);
      return scores[0].client;
    }
  }

  recordResult(clientId, success, latency) {
    const history = this.performanceHistory.get(clientId) || {
      successRate: 0.5,
      averageLatency: 1000,
      taskCount: 0
    };

    // Update with exponential moving average
    const alpha = 0.2;
    history.successRate = alpha * (success ? 1 : 0) + (1 - alpha) * history.successRate;
    history.averageLatency = alpha * latency + (1 - alpha) * history.averageLatency;
    history.taskCount++;

    this.performanceHistory.set(clientId, history);

    // Decay learning rate over time
    this.learningRate = Math.max(0.01, this.learningRate * 0.999);
  }
}
```

### Connection Pooling with Priorities

```javascript
class PriorityClientPool extends MCPClientPool {
  constructor(config) {
    super(config);
    this.priorityQueues = {
      high: [],
      normal: [],
      low: []
    };
  }

  async getClient(options = {}) {
    const priority = options.priority || 'normal';

    // Try to get client immediately
    try {
      return await super.getClient(options);
    } catch (error) {
      // Queue request if no clients available
      return await this.queueRequest(priority, options);
    }
  }

  async queueRequest(priority, options) {
    return new Promise((resolve, reject) => {
      const request = {
        options,
        resolve,
        reject,
        timestamp: Date.now(),
        timeout: setTimeout(() => {
          reject(new Error('Request timeout in queue'));
        }, options.queueTimeout || 30000)
      };

      this.priorityQueues[priority].push(request);
      this.processQueues();
    });
  }

  async processQueues() {
    const queues = ['high', 'normal', 'low'];

    for (const priority of queues) {
      const queue = this.priorityQueues[priority];

      while (queue.length > 0) {
        try {
          const client = await super.getClient(queue[0].options);
          const request = queue.shift();
          clearTimeout(request.timeout);
          request.resolve(client);
          return;
        } catch (error) {
          break; // No clients available
        }
      }
    }
  }

  handleClientRecovered(clientId) {
    super.handleClientRecovered(clientId);
    this.processQueues(); // Process waiting requests
  }
}
```

## Testing

```javascript
import { describe, it, expect } from '@jest/globals';

describe('MCP Client Pool', () => {
  let pool;
  let mockEndpoints;

  beforeEach(() => {
    mockEndpoints = [
      { url: 'http://localhost:8001', auth: 'http://localhost:3001' },
      { url: 'http://localhost:8002', auth: 'http://localhost:3001' },
      { url: 'http://localhost:8003', auth: 'http://localhost:3001' }
    ];

    pool = new MCPClientPool({
      minSize: 2,
      maxSize: 5,
      endpoints: mockEndpoints,
      clientId: 'test-client',
      clientSecret: 'test-secret'
    });
  });

  afterEach(async () => {
    await pool.shutdown();
  });

  it('should create minimum connections on start', async () => {
    await pool.start();
    expect(pool.clients.size).toBeGreaterThanOrEqual(2);
  });

  it('should select least loaded client', async () => {
    await pool.start();

    // Set different loads
    const clientIds = Array.from(pool.clients.keys());
    pool.loadMetrics.set(clientIds[0], { activeRequests: 5 });
    pool.loadMetrics.set(clientIds[1], { activeRequests: 2 });

    pool.config.loadBalancingAlgorithm = 'least-load';
    const client = await pool.getClient();

    expect(client.id).toBe(clientIds[1]);
  });

  it('should handle client failures', async () => {
    await pool.start();
    const clientId = Array.from(pool.clients.keys())[0];

    // Simulate failures
    for (let i = 0; i < 3; i++) {
      pool.handleHealthCheckFailure(clientId, new Error('Test failure'));
    }

    const health = pool.healthStatus.get(clientId);
    expect(health.status).toBe('unhealthy');
  });

  it('should maintain minimum pool size', async () => {
    await pool.start();
    const initialSize = pool.clients.size;

    // Remove a client
    const clientId = Array.from(pool.clients.keys())[0];
    await pool.removeClient(clientId);

    // Wait for replacement
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(pool.clients.size).toBeGreaterThanOrEqual(pool.config.minSize);
  });

  it('should respect affinity', async () => {
    await pool.start();

    const client1 = await pool.getClient({ affinity: 'project-123' });
    const client2 = await pool.getClient({ affinity: 'project-123' });

    expect(client1.id).toBe(client2.id);
  });
});
```

## Configuration

### Basic Configuration

```javascript
const pool = new MCPClientPool({
  // Pool sizing
  minSize: 2,
  maxSize: 10,

  // Timeouts
  connectionTimeout: 10000,
  requestTimeout: 30000,
  healthCheckInterval: 30000,

  // Health thresholds
  unhealthyThreshold: 3,
  healthyThreshold: 2,

  // Load balancing
  loadBalancingAlgorithm: 'least-load',

  // Retry
  retryAttempts: 3,
  retryDelay: 1000,

  // Endpoints
  endpoints: [
    { url: 'https://mcp1.example.com', auth: 'https://auth.example.com' },
    { url: 'https://mcp2.example.com', auth: 'https://auth.example.com' }
  ],

  // Authentication
  clientId: process.env.MCP_CLIENT_ID,
  clientSecret: process.env.MCP_CLIENT_SECRET
});
```

### Advanced Configuration

```javascript
const pool = new CircuitBreakerPool({
  // Circuit breaker settings
  breakerThreshold: 5,
  breakerTimeout: 60000,
  breakerResetTimeout: 30000,

  // Adaptive load balancing
  enableAdaptiveBalancing: true,
  learningRate: 0.1,

  // Priority queues
  enablePriorityQueues: true,
  queueTimeout: 30000,

  // Service discovery
  serviceDiscovery: {
    type: 'consul',
    consulUrl: 'http://consul:8500',
    serviceName: 'mcp-server'
  },

  // Metrics collection
  metrics: {
    enabled: true,
    interval: 10000,
    endpoint: 'http://metrics:9090'
  }
});
```

## Monitoring

### Metrics Collection

```javascript
class MetricsCollector {
  constructor(pool) {
    this.pool = pool;
    this.metrics = {
      // Pool metrics
      'mcp_pool_size': new Gauge(),
      'mcp_pool_healthy_clients': new Gauge(),
      'mcp_pool_unhealthy_clients': new Gauge(),

      // Request metrics
      'mcp_pool_requests_total': new Counter(),
      'mcp_pool_requests_failed': new Counter(),
      'mcp_pool_request_duration': new Histogram(),

      // Connection metrics
      'mcp_pool_connections_created': new Counter(),
      'mcp_pool_connections_failed': new Counter(),
      'mcp_pool_connections_closed': new Counter(),

      // Health check metrics
      'mcp_pool_health_checks_total': new Counter(),
      'mcp_pool_health_checks_failed': new Counter(),
      'mcp_pool_health_check_duration': new Histogram()
    };

    this.startCollection();
  }

  startCollection() {
    setInterval(() => {
      const stats = this.pool.getStatistics();

      this.metrics['mcp_pool_size'].set(stats.pool.size);
      this.metrics['mcp_pool_healthy_clients'].set(stats.pool.healthy);
      this.metrics['mcp_pool_unhealthy_clients'].set(stats.pool.unhealthy);
    }, 10000);
  }
}
```

## Conclusion

The MCP Client Pool provides robust connection management with intelligent load balancing, health monitoring, and fault tolerance. It enables efficient resource utilization across distributed MCP servers while maintaining high availability and performance.