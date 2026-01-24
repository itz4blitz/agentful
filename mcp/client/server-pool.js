/**
 * MCP Server Pool
 *
 * Manages multiple MCP clients with load balancing, health checking,
 * and automatic failover.
 *
 * @module mcp/client/server-pool
 */

import { EventEmitter } from 'events';
import { MCPClient } from './mcp-client.js';
import { HealthMonitor, ServerStatus } from './health-monitor.js';
import { WorkQueue } from './work-queue.js';

/**
 * Load balancing strategies
 */
export const LoadBalanceStrategy = {
  ROUND_ROBIN: 'round_robin',
  LEAST_LOADED: 'least_loaded',
  PRIORITY: 'priority'
};

/**
 * MCP Server Pool
 */
export class MCPServerPool extends EventEmitter {
  constructor(options = {}) {
    super();

    this.strategy = options.strategy || LoadBalanceStrategy.ROUND_ROBIN;
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    this.maxRetries = options.maxRetries || 3;

    this.servers = new Map(); // serverId -> { client, priority, activeTasks }
    this.healthMonitor = new HealthMonitor({
      checkInterval: this.healthCheckInterval,
      reconnectAttempts: this.maxRetries
    });
    this.workQueue = new WorkQueue({
      maxRetries: this.maxRetries
    });

    this.roundRobinIndex = 0;
    this.initialized = false;

    this._setupEventHandlers();
  }

  /**
   * Initialize the server pool
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    this.healthMonitor.start();
    this.initialized = true;

    // Process work queue
    this.workQueue.on('queue-ready', () => {
      this._processWorkQueue();
    });

    this.emit('initialized');
  }

  /**
   * Shutdown the server pool
   */
  async shutdown() {
    if (!this.initialized) {
      return;
    }

    this.healthMonitor.stop();

    // Disconnect all clients
    for (const [serverId, server] of this.servers) {
      try {
        server.client.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
    }

    this.servers.clear();
    this.initialized = false;

    this.emit('shutdown');
  }

  /**
   * Add a server to the pool
   *
   * @param {string} serverId - Unique server identifier
   * @param {string} baseUrl - Server base URL
   * @param {string} [authToken] - OAuth token for authentication
   * @param {Object} [options] - Additional options
   * @returns {Promise<void>}
   */
  async addServer(serverId, baseUrl, authToken = null, options = {}) {
    if (this.servers.has(serverId)) {
      throw new Error(`Server already exists: ${serverId}`);
    }

    const priority = options.priority || 0;

    // Create client
    const client = new MCPClient({
      serverId,
      baseUrl,
      authToken,
      timeout: options.timeout,
      retryAttempts: this.maxRetries
    });

    // Connect to server
    await client.connect();

    // Add to pool
    this.servers.set(serverId, {
      client,
      priority,
      activeTasks: 0
    });

    // Add to health monitor
    this.healthMonitor.addServer(client);

    this.emit('server-added', serverId);
  }

  /**
   * Remove a server from the pool
   *
   * @param {string} serverId - Server ID
   */
  async removeServer(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    // Remove from health monitor
    this.healthMonitor.removeServer(serverId);

    // Disconnect client
    server.client.disconnect();

    // Remove from pool
    this.servers.delete(serverId);

    this.emit('server-removed', serverId);
  }

  /**
   * Call a tool (automatically load balanced)
   *
   * @param {string} toolName - Tool name
   * @param {Object} args - Tool arguments
   * @param {Object} [options] - Call options
   * @returns {Promise<Object>} Tool result
   */
  async callTool(toolName, args = {}, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.workQueue.enqueue('tool_call', {
      name: toolName,
      arguments: args
    }, options);
  }

  /**
   * Read a resource (automatically load balanced)
   *
   * @param {string} uri - Resource URI
   * @param {Object} [options] - Read options
   * @returns {Promise<Object>} Resource contents
   */
  async readResource(uri, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.workQueue.enqueue('resource_read', {
      uri
    }, options);
  }

  /**
   * Get pool statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    const healthyServers = this.healthMonitor.getHealthyServers();
    const degradedServers = this.healthMonitor.getDegradedServers();
    const offlineServers = this.healthMonitor.getOfflineServers();

    let totalActiveTasks = 0;
    for (const server of this.servers.values()) {
      totalActiveTasks += server.activeTasks;
    }

    return {
      servers: this.servers.size,
      healthy: healthyServers.length,
      degraded: degradedServers.length,
      offline: offlineServers.length,
      tasks: totalActiveTasks,
      queue: this.workQueue.getStats(),
      strategy: this.strategy
    };
  }

  /**
   * Get detailed server information
   *
   * @returns {Array<Object>} Array of server info
   */
  getServers() {
    const servers = [];
    const healthStatuses = this.healthMonitor.getAllStatuses();

    for (const [serverId, server] of this.servers) {
      servers.push({
        id: serverId,
        url: server.client.baseUrl,
        priority: server.priority,
        activeTasks: server.activeTasks,
        status: healthStatuses[serverId]?.status || ServerStatus.OFFLINE,
        health: healthStatuses[serverId] || {},
        stats: server.client.getStats()
      });
    }

    return servers;
  }

  /**
   * Get healthy servers only
   *
   * @returns {Array<Object>} Array of healthy servers
   */
  getHealthyServers() {
    const healthyIds = this.healthMonitor.getHealthyServers();
    return healthyIds
      .map(serverId => this.servers.get(serverId))
      .filter(server => server !== undefined);
  }

  /**
   * Select a server based on load balancing strategy
   *
   * @private
   * @returns {Object|null} Selected server or null if none available
   */
  _selectServer() {
    const healthyServers = this.getHealthyServers();

    if (healthyServers.length === 0) {
      return null;
    }

    switch (this.strategy) {
      case LoadBalanceStrategy.ROUND_ROBIN:
        return this._selectRoundRobin(healthyServers);

      case LoadBalanceStrategy.LEAST_LOADED:
        return this._selectLeastLoaded(healthyServers);

      case LoadBalanceStrategy.PRIORITY:
        return this._selectPriority(healthyServers);

      default:
        return this._selectRoundRobin(healthyServers);
    }
  }

  /**
   * Round-robin server selection
   *
   * @private
   * @param {Array<Object>} servers - Available servers
   * @returns {Object} Selected server
   */
  _selectRoundRobin(servers) {
    if (servers.length === 0) {
      return null;
    }

    const server = servers[this.roundRobinIndex % servers.length];
    this.roundRobinIndex++;

    return server;
  }

  /**
   * Least-loaded server selection
   *
   * @private
   * @param {Array<Object>} servers - Available servers
   * @returns {Object} Selected server
   */
  _selectLeastLoaded(servers) {
    if (servers.length === 0) {
      return null;
    }

    // Sort by active tasks (ascending)
    const sorted = [...servers].sort((a, b) => a.activeTasks - b.activeTasks);
    return sorted[0];
  }

  /**
   * Priority-based server selection
   *
   * @private
   * @param {Array<Object>} servers - Available servers
   * @returns {Object} Selected server
   */
  _selectPriority(servers) {
    if (servers.length === 0) {
      return null;
    }

    // Sort by priority (descending), then by active tasks (ascending)
    const sorted = [...servers].sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.activeTasks - b.activeTasks;
    });

    return sorted[0];
  }

  /**
   * Process work queue
   *
   * @private
   */
  async _processWorkQueue() {
    let taskId;

    while ((taskId = this.workQueue.getNextTask()) !== null) {
      const server = this._selectServer();

      if (!server) {
        // No healthy servers available, stop processing
        this.emit('error', new Error('No healthy servers available'));
        break;
      }

      // Execute task
      this._executeTask(taskId, server).catch(error => {
        // Error is already handled by work queue
      });
    }
  }

  /**
   * Execute a task on a server
   *
   * @private
   * @param {string} taskId - Task ID
   * @param {Object} server - Server object
   */
  async _executeTask(taskId, server) {
    server.activeTasks++;

    try {
      await this.workQueue.executeTask(taskId, server);
    } finally {
      server.activeTasks--;

      // Continue processing queue
      if (this.workQueue.pendingQueue.length > 0) {
        this._processWorkQueue();
      }
    }
  }

  /**
   * Setup event handlers
   *
   * @private
   */
  _setupEventHandlers() {
    // Forward health monitor events
    this.healthMonitor.on('server-offline', (serverId, error) => {
      this.emit('server-offline', serverId, error);
    });

    this.healthMonitor.on('server-recovered', (serverId) => {
      this.emit('server-recovered', serverId);
    });

    this.healthMonitor.on('server-degraded', (serverId, error) => {
      this.emit('server-degraded', serverId, error);
    });

    // Forward work queue events
    this.workQueue.on('task-completed', (taskId, result) => {
      this.emit('task-completed', taskId, result);
    });

    this.workQueue.on('task-failed', (taskId, error) => {
      this.emit('task-failed', taskId, error);
    });

    this.workQueue.on('task-retry', (taskId, retryCount, error) => {
      this.emit('task-retry', taskId, retryCount, error);
    });
  }
}

export default MCPServerPool;
