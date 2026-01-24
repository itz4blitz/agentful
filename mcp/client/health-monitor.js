/**
 * Health Monitor
 *
 * Performs periodic health checks on MCP servers and tracks their status.
 * Automatically removes dead servers and attempts reconnections.
 *
 * @module mcp/client/health-monitor
 */

import { EventEmitter } from 'events';

/**
 * Server health status
 */
export const ServerStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  DEGRADED: 'degraded',
  RECONNECTING: 'reconnecting'
};

/**
 * Health Monitor
 */
export class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.degradedThreshold = options.degradedThreshold || 2; // 2 failed checks before degraded
    this.offlineThreshold = options.offlineThreshold || 3; // 3 failed checks before offline
    this.reconnectAttempts = options.reconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 5000;

    this.servers = new Map(); // serverId -> { client, status, failedChecks, lastCheck, reconnectAttempts }
    this.intervalId = null;
    this.running = false;
  }

  /**
   * Start health monitoring
   */
  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this._scheduleNextCheck();
    this.emit('started');
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    this.emit('stopped');
  }

  /**
   * Add server to monitor
   *
   * @param {MCPClient} client - MCP client instance
   */
  addServer(client) {
    if (this.servers.has(client.serverId)) {
      throw new Error(`Server already monitored: ${client.serverId}`);
    }

    this.servers.set(client.serverId, {
      client,
      status: ServerStatus.ONLINE,
      failedChecks: 0,
      lastCheck: null,
      reconnectAttempts: 0,
      lastError: null
    });

    // Listen for client events
    client.on('disconnected', () => this._handleDisconnection(client.serverId));
    client.on('reconnected', () => this._handleReconnection(client.serverId));
    client.on('error', (error) => this._handleError(client.serverId, error));

    this.emit('server-added', client.serverId);
  }

  /**
   * Remove server from monitoring
   *
   * @param {string} serverId - Server ID
   */
  removeServer(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    // Remove listeners
    server.client.removeAllListeners();

    this.servers.delete(serverId);
    this.emit('server-removed', serverId);
  }

  /**
   * Get server status
   *
   * @param {string} serverId - Server ID
   * @returns {string|null} Server status or null if not found
   */
  getServerStatus(serverId) {
    const server = this.servers.get(serverId);
    return server ? server.status : null;
  }

  /**
   * Get all server statuses
   *
   * @returns {Object} Map of serverId -> status
   */
  getAllStatuses() {
    const statuses = {};

    for (const [serverId, server] of this.servers) {
      statuses[serverId] = {
        status: server.status,
        failedChecks: server.failedChecks,
        lastCheck: server.lastCheck,
        lastError: server.lastError?.message,
        reconnectAttempts: server.reconnectAttempts
      };
    }

    return statuses;
  }

  /**
   * Get healthy servers
   *
   * @returns {Array<string>} Array of server IDs
   */
  getHealthyServers() {
    const healthy = [];

    for (const [serverId, server] of this.servers) {
      if (server.status === ServerStatus.ONLINE) {
        healthy.push(serverId);
      }
    }

    return healthy;
  }

  /**
   * Get degraded servers
   *
   * @returns {Array<string>} Array of server IDs
   */
  getDegradedServers() {
    const degraded = [];

    for (const [serverId, server] of this.servers) {
      if (server.status === ServerStatus.DEGRADED) {
        degraded.push(serverId);
      }
    }

    return degraded;
  }

  /**
   * Get offline servers
   *
   * @returns {Array<string>} Array of server IDs
   */
  getOfflineServers() {
    const offline = [];

    for (const [serverId, server] of this.servers) {
      if (server.status === ServerStatus.OFFLINE) {
        offline.push(serverId);
      }
    }

    return offline;
  }

  /**
   * Force health check on all servers
   *
   * @returns {Promise<void>}
   */
  async checkAll() {
    const checks = [];

    for (const [serverId] of this.servers) {
      checks.push(this._checkServer(serverId));
    }

    await Promise.allSettled(checks);
  }

  /**
   * Force health check on specific server
   *
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} True if healthy
   */
  async checkServer(serverId) {
    return this._checkServer(serverId);
  }

  /**
   * Schedule next health check
   *
   * @private
   */
  _scheduleNextCheck() {
    if (!this.running) {
      return;
    }

    this.intervalId = setTimeout(async () => {
      await this.checkAll();
      this._scheduleNextCheck();
    }, this.checkInterval);
  }

  /**
   * Check server health
   *
   * @private
   * @param {string} serverId - Server ID
   * @returns {Promise<boolean>} True if healthy
   */
  async _checkServer(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return false;
    }

    server.lastCheck = new Date();

    try {
      const isHealthy = await server.client.ping();

      if (isHealthy) {
        this._handleHealthyCheck(serverId);
        return true;
      } else {
        this._handleFailedCheck(serverId, new Error('Ping returned false'));
        return false;
      }

    } catch (error) {
      this._handleFailedCheck(serverId, error);
      return false;
    }
  }

  /**
   * Handle successful health check
   *
   * @private
   * @param {string} serverId - Server ID
   */
  _handleHealthyCheck(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    const wasUnhealthy = server.status !== ServerStatus.ONLINE;

    server.failedChecks = 0;
    server.reconnectAttempts = 0;
    server.lastError = null;

    if (server.status !== ServerStatus.ONLINE) {
      server.status = ServerStatus.ONLINE;
      this.emit('server-recovered', serverId);
    }

    if (wasUnhealthy) {
      this.emit('status-change', serverId, ServerStatus.ONLINE);
    }
  }

  /**
   * Handle failed health check
   *
   * @private
   * @param {string} serverId - Server ID
   * @param {Error} error - Error that occurred
   */
  _handleFailedCheck(serverId, error) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    server.failedChecks++;
    server.lastError = error;

    const previousStatus = server.status;
    let newStatus = previousStatus;

    if (server.failedChecks >= this.offlineThreshold) {
      newStatus = ServerStatus.OFFLINE;
    } else if (server.failedChecks >= this.degradedThreshold) {
      newStatus = ServerStatus.DEGRADED;
    }

    if (newStatus !== previousStatus) {
      server.status = newStatus;
      this.emit('status-change', serverId, newStatus);

      if (newStatus === ServerStatus.DEGRADED) {
        this.emit('server-degraded', serverId, error);
      } else if (newStatus === ServerStatus.OFFLINE) {
        this.emit('server-offline', serverId, error);
        this._attemptReconnection(serverId);
      }
    }
  }

  /**
   * Handle server disconnection
   *
   * @private
   * @param {string} serverId - Server ID
   */
  _handleDisconnection(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    const previousStatus = server.status;
    server.status = ServerStatus.OFFLINE;

    if (previousStatus !== ServerStatus.OFFLINE) {
      this.emit('status-change', serverId, ServerStatus.OFFLINE);
      this.emit('server-offline', serverId, new Error('Client disconnected'));
    }

    this._attemptReconnection(serverId);
  }

  /**
   * Handle server reconnection
   *
   * @private
   * @param {string} serverId - Server ID
   */
  _handleReconnection(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    server.failedChecks = 0;
    server.reconnectAttempts = 0;
    server.lastError = null;
    server.status = ServerStatus.ONLINE;

    this.emit('status-change', serverId, ServerStatus.ONLINE);
    this.emit('server-recovered', serverId);
  }

  /**
   * Handle client error
   *
   * @private
   * @param {string} serverId - Server ID
   * @param {Error} error - Error that occurred
   */
  _handleError(serverId, error) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    server.lastError = error;
    this.emit('server-error', serverId, error);
  }

  /**
   * Attempt to reconnect to server
   *
   * @private
   * @param {string} serverId - Server ID
   */
  async _attemptReconnection(serverId) {
    const server = this.servers.get(serverId);

    if (!server) {
      return;
    }

    if (server.reconnectAttempts >= this.reconnectAttempts) {
      this.emit('reconnect-failed', serverId);
      return;
    }

    server.reconnectAttempts++;
    server.status = ServerStatus.RECONNECTING;
    this.emit('status-change', serverId, ServerStatus.RECONNECTING);

    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, server.reconnectAttempts - 1);

    setTimeout(async () => {
      try {
        await server.client.connect();
        // Reconnection successful - will be handled by 'reconnected' event
      } catch (error) {
        server.lastError = error;

        if (server.reconnectAttempts < this.reconnectAttempts) {
          // Try again
          this._attemptReconnection(serverId);
        } else {
          server.status = ServerStatus.OFFLINE;
          this.emit('status-change', serverId, ServerStatus.OFFLINE);
          this.emit('reconnect-failed', serverId);
        }
      }
    }, delay);
  }
}

export default HealthMonitor;
