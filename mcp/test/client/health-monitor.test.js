import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthMonitor, ServerStatus } from '../../client/health-monitor.js';
import { MCPClient } from '../../client/mcp-client.js';
import http from 'http';

/**
 * Health Monitor Tests
 *
 * Tests the health monitoring functionality:
 * - Periodic health checks
 * - Status tracking (online, offline, degraded)
 * - Automatic server removal
 * - Reconnection attempts
 */
describe('HealthMonitor', () => {
  let monitor;
  let mockServers = [];

  beforeEach(() => {
    monitor = new HealthMonitor({
      checkInterval: 500, // 500ms for testing
      degradedThreshold: 2,
      offlineThreshold: 3,
      reconnectAttempts: 2,
      reconnectDelay: 100
    });
  });

  afterEach(() => {
    if (monitor) {
      monitor.stop();
    }

    // Close all mock servers
    for (const server of mockServers) {
      closeMockServer(server);
    }
    mockServers = [];
  });

  describe('Monitor Initialization', () => {
    it('should create monitor with default options', () => {
      const m = new HealthMonitor();

      expect(m.checkInterval).toBe(30000); // 30 seconds
      expect(m.degradedThreshold).toBe(2);
      expect(m.offlineThreshold).toBe(3);
      expect(m.running).toBe(false);
    });

    it('should start monitoring', () => {
      monitor.start();

      expect(monitor.running).toBe(true);
    });

    it('should stop monitoring', () => {
      monitor.start();
      monitor.stop();

      expect(monitor.running).toBe(false);
    });

    it('should emit started event', (done) => {
      monitor.once('started', () => {
        expect(monitor.running).toBe(true);
        done();
      });

      monitor.start();
    });

    it('should emit stopped event', (done) => {
      monitor.start();

      monitor.once('stopped', () => {
        expect(monitor.running).toBe(false);
        done();
      });

      monitor.stop();
    });
  });

  describe('Server Management', () => {
    it('should add server to monitor', async () => {
      const server = await createMockMCPServer(3860);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3860',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);

      expect(monitor.servers.has('server-1')).toBe(true);
      expect(monitor.getServerStatus('server-1')).toBe(ServerStatus.ONLINE);

      client.disconnect();
    });

    it('should throw error when adding duplicate server', async () => {
      const server = await createMockMCPServer(3861);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3861',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);

      expect(() => {
        monitor.addServer(client);
      }).toThrow('Server already monitored');

      client.disconnect();
    });

    it('should remove server from monitoring', async () => {
      const server = await createMockMCPServer(3862);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3862',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);
      monitor.removeServer('server-1');

      expect(monitor.servers.has('server-1')).toBe(false);

      client.disconnect();
    });

    it('should emit server-added event', (done) => {
      monitor.once('server-added', (serverId) => {
        expect(serverId).toBe('server-1');
        done();
      });

      createMockMCPServer(3863).then(async (server) => {
        mockServers.push(server);

        const client = new MCPClient({
          serverId: 'server-1',
          baseUrl: 'http://localhost:3863',
          timeout: 2000
        });

        await client.connect();
        monitor.addServer(client);
        client.disconnect();
      });
    });
  });

  describe('Health Checks', () => {
    it('should perform health check on server', async () => {
      const server = await createMockMCPServer(3864);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3864',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);

      const healthy = await monitor.checkServer('server-1');
      expect(healthy).toBe(true);

      client.disconnect();
    });

    it('should detect unhealthy server', async () => {
      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:9999', // Non-existent
        timeout: 1000
      });

      // Don't connect (will fail health check)
      monitor.addServer(client);

      const healthy = await monitor.checkServer('server-1');
      expect(healthy).toBe(false);
    });

    it('should check all servers', async () => {
      const server1 = await createMockMCPServer(3865);
      const server2 = await createMockMCPServer(3866);
      mockServers.push(server1, server2);

      const client1 = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3865',
        timeout: 2000
      });

      const client2 = new MCPClient({
        serverId: 'server-2',
        baseUrl: 'http://localhost:3866',
        timeout: 2000
      });

      await client1.connect();
      await client2.connect();

      monitor.addServer(client1);
      monitor.addServer(client2);

      await monitor.checkAll();

      expect(monitor.getServerStatus('server-1')).toBeDefined();
      expect(monitor.getServerStatus('server-2')).toBeDefined();

      client1.disconnect();
      client2.disconnect();
    });
  });

  describe('Status Tracking', () => {
    it('should track healthy servers', async () => {
      const server = await createMockMCPServer(3867);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3867',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);
      await monitor.checkServer('server-1');

      const healthy = monitor.getHealthyServers();
      expect(healthy).toContain('server-1');

      client.disconnect();
    });

    it('should track degraded servers after failed checks', async () => {
      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:9999',
        timeout: 1000
      });

      monitor.addServer(client);

      // Fail multiple checks to reach degraded threshold
      await monitor.checkServer('server-1');
      await monitor.checkServer('server-1');

      const degraded = monitor.getDegradedServers();
      expect(degraded).toContain('server-1');
    });

    it('should track offline servers after max failed checks', async () => {
      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:9999',
        timeout: 1000
      });

      monitor.addServer(client);

      // Fail enough checks to reach offline threshold
      await monitor.checkServer('server-1');
      await monitor.checkServer('server-1');
      await monitor.checkServer('server-1');

      const offline = monitor.getOfflineServers();
      expect(offline).toContain('server-1');
    });

    it('should get all server statuses', async () => {
      const server = await createMockMCPServer(3868);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3868',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);
      await monitor.checkServer('server-1');

      const statuses = monitor.getAllStatuses();

      expect(statuses).toHaveProperty('server-1');
      expect(statuses['server-1']).toHaveProperty('status');
      expect(statuses['server-1']).toHaveProperty('failedChecks');
      expect(statuses['server-1']).toHaveProperty('lastCheck');

      client.disconnect();
    });
  });

  describe('Status Change Events', () => {
    it('should emit status-change event on degradation', async (done) => {
      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:9999',
        timeout: 1000
      });

      monitor.addServer(client);

      monitor.once('status-change', (serverId, newStatus) => {
        expect(serverId).toBe('server-1');
        expect(newStatus).toBe(ServerStatus.DEGRADED);
        done();
      });

      // Trigger degradation
      await monitor.checkServer('server-1');
      await monitor.checkServer('server-1');
    });

    it('should emit server-degraded event', (done) => {
      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:9999',
        timeout: 1000
      });

      monitor.addServer(client);

      monitor.once('server-degraded', (serverId, error) => {
        expect(serverId).toBe('server-1');
        expect(error).toBeDefined();
        done();
      });

      // Trigger degradation
      monitor.checkServer('server-1');
      monitor.checkServer('server-1');
    });

    it('should emit server-offline event', (done) => {
      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:9999',
        timeout: 1000
      });

      monitor.addServer(client);

      monitor.once('server-offline', (serverId, error) => {
        expect(serverId).toBe('server-1');
        expect(error).toBeDefined();
        done();
      });

      // Trigger offline status
      monitor.checkServer('server-1');
      monitor.checkServer('server-1');
      monitor.checkServer('server-1');
    });

    it('should emit server-recovered event', async (done) => {
      const server = await createMockMCPServer(3869);
      mockServers.push(server);

      const client = new MCPClient({
        serverId: 'server-1',
        baseUrl: 'http://localhost:3869',
        timeout: 2000
      });

      await client.connect();

      monitor.addServer(client);

      // Make it degraded first
      const serverInfo = monitor.servers.get('server-1');
      serverInfo.status = ServerStatus.DEGRADED;
      serverInfo.failedChecks = 2;

      monitor.once('server-recovered', (serverId) => {
        expect(serverId).toBe('server-1');
        done();
      });

      // Health check should recover it
      await monitor.checkServer('server-1');

      client.disconnect();
    });
  });
});

/**
 * Create a mock MCP server for testing
 */
async function createMockMCPServer(port) {
  return new Promise((resolve, reject) => {
    const connections = new Set();

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);

      // Health check endpoint
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }

      // SSE endpoint
      if (url.pathname === '/mcp/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        connections.add(res);
        res.write(`data: ${JSON.stringify({ type: 'connected', connectionId: 'test' })}\n\n`);

        req.on('close', () => {
          connections.delete(res);
        });

        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.listen(port, () => {
      server.connections = connections;
      resolve(server);
    });

    server.on('error', reject);
  });
}

/**
 * Close mock server
 */
async function closeMockServer(server) {
  return new Promise((resolve) => {
    if (server.connections) {
      for (const conn of server.connections) {
        conn.end();
      }
    }

    server.close(() => {
      resolve();
    });
  });
}
