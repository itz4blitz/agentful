import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServerPool, LoadBalanceStrategy } from '../../client/server-pool.js';
import http from 'http';

/**
 * MCP Server Pool Tests
 *
 * Tests the server pool functionality:
 * - Server management (add/remove)
 * - Load balancing strategies
 * - Health monitoring integration
 * - Work queue integration
 * - Failover handling
 */
describe('MCPServerPool', () => {
  let pool;
  let mockServers = [];

  beforeEach(() => {
    pool = new MCPServerPool({
      strategy: LoadBalanceStrategy.ROUND_ROBIN,
      healthCheckInterval: 1000, // 1 second for testing
      maxRetries: 2
    });
  });

  afterEach(async () => {
    // Shutdown pool
    if (pool) {
      await pool.shutdown();
    }

    // Close all mock servers
    for (const server of mockServers) {
      await closeMockServer(server);
    }
    mockServers = [];
  });

  describe('Pool Initialization', () => {
    it('should create pool with default options', () => {
      const p = new MCPServerPool();

      expect(p.strategy).toBe(LoadBalanceStrategy.ROUND_ROBIN);
      expect(p.initialized).toBe(false);
    });

    it('should create pool with custom strategy', () => {
      const p = new MCPServerPool({
        strategy: LoadBalanceStrategy.LEAST_LOADED
      });

      expect(p.strategy).toBe(LoadBalanceStrategy.LEAST_LOADED);
    });

    it('should initialize pool', async () => {
      await pool.initialize();

      expect(pool.initialized).toBe(true);
      expect(pool.healthMonitor.running).toBe(true);
    });

    it('should shutdown pool', async () => {
      await pool.initialize();
      await pool.shutdown();

      expect(pool.initialized).toBe(false);
      expect(pool.healthMonitor.running).toBe(false);
      expect(pool.servers.size).toBe(0);
    });
  });

  describe('Server Management', () => {
    it('should add server to pool', async () => {
      const server = await createMockMCPServer(3840);
      mockServers.push(server);

      await pool.addServer('server-1', 'http://localhost:3840');

      expect(pool.servers.has('server-1')).toBe(true);
      expect(pool.servers.get('server-1').client).toBeDefined();
    });

    it('should remove server from pool', async () => {
      const server = await createMockMCPServer(3841);
      mockServers.push(server);

      await pool.addServer('server-1', 'http://localhost:3841');
      await pool.removeServer('server-1');

      expect(pool.servers.has('server-1')).toBe(false);
    });

    it('should throw error when adding duplicate server', async () => {
      const server = await createMockMCPServer(3842);
      mockServers.push(server);

      await pool.addServer('server-1', 'http://localhost:3842');

      await expect(
        pool.addServer('server-1', 'http://localhost:3842')
      ).rejects.toThrow('Server already exists');
    });

    it('should add server with priority', async () => {
      const server = await createMockMCPServer(3843);
      mockServers.push(server);

      await pool.addServer('server-1', 'http://localhost:3843', null, {
        priority: 10
      });

      const serverInfo = pool.servers.get('server-1');
      expect(serverInfo.priority).toBe(10);
    });
  });

  describe('Load Balancing - Round Robin', () => {
    it('should distribute requests using round-robin', async () => {
      // Create multiple mock servers
      const server1 = await createMockMCPServer(3844);
      const server2 = await createMockMCPServer(3845);
      const server3 = await createMockMCPServer(3846);
      mockServers.push(server1, server2, server3);

      await pool.initialize();
      await pool.addServer('server-1', 'http://localhost:3844');
      await pool.addServer('server-2', 'http://localhost:3845');
      await pool.addServer('server-3', 'http://localhost:3846');

      // Wait for health checks to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const selected = [];
      for (let i = 0; i < 6; i++) {
        const server = pool._selectServer();
        if (server) {
          selected.push(server.client.serverId);
        }
      }

      // Should cycle through servers
      expect(selected.length).toBe(6);
      expect(new Set(selected).size).toBe(3); // All 3 servers used
    });
  });

  describe('Load Balancing - Least Loaded', () => {
    it('should select server with fewest active tasks', async () => {
      pool.strategy = LoadBalanceStrategy.LEAST_LOADED;

      const server1 = await createMockMCPServer(3847);
      const server2 = await createMockMCPServer(3848);
      mockServers.push(server1, server2);

      await pool.initialize();
      await pool.addServer('server-1', 'http://localhost:3847');
      await pool.addServer('server-2', 'http://localhost:3848');

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate active tasks on server-1
      pool.servers.get('server-1').activeTasks = 5;
      pool.servers.get('server-2').activeTasks = 2;

      const selected = pool._selectServer();
      expect(selected.client.serverId).toBe('server-2');
    });
  });

  describe('Load Balancing - Priority', () => {
    it('should select server with highest priority', async () => {
      pool.strategy = LoadBalanceStrategy.PRIORITY;

      const server1 = await createMockMCPServer(3849);
      const server2 = await createMockMCPServer(3850);
      mockServers.push(server1, server2);

      await pool.initialize();
      await pool.addServer('server-1', 'http://localhost:3849', null, { priority: 5 });
      await pool.addServer('server-2', 'http://localhost:3850', null, { priority: 10 });

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 100));

      const selected = pool._selectServer();
      expect(selected.client.serverId).toBe('server-2');
    });
  });

  describe('Statistics', () => {
    it('should return pool statistics', async () => {
      const server = await createMockMCPServer(3851);
      mockServers.push(server);

      await pool.initialize();
      await pool.addServer('server-1', 'http://localhost:3851');

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = pool.getStats();

      expect(stats).toHaveProperty('servers', 1);
      expect(stats).toHaveProperty('healthy');
      expect(stats).toHaveProperty('degraded');
      expect(stats).toHaveProperty('offline');
      expect(stats).toHaveProperty('tasks', 0);
      expect(stats).toHaveProperty('queue');
      expect(stats).toHaveProperty('strategy', LoadBalanceStrategy.ROUND_ROBIN);
    });

    it('should return detailed server information', async () => {
      const server = await createMockMCPServer(3852);
      mockServers.push(server);

      await pool.initialize();
      await pool.addServer('server-1', 'http://localhost:3852', null, { priority: 5 });

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 100));

      const servers = pool.getServers();

      expect(servers).toHaveLength(1);
      expect(servers[0]).toHaveProperty('id', 'server-1');
      expect(servers[0]).toHaveProperty('url', 'http://localhost:3852');
      expect(servers[0]).toHaveProperty('priority', 5);
      expect(servers[0]).toHaveProperty('activeTasks', 0);
      expect(servers[0]).toHaveProperty('status');
      expect(servers[0]).toHaveProperty('health');
      expect(servers[0]).toHaveProperty('stats');
    });
  });

  describe('Healthy Server Selection', () => {
    it('should return only healthy servers', async () => {
      const server = await createMockMCPServer(3853);
      mockServers.push(server);

      await pool.initialize();
      await pool.addServer('server-1', 'http://localhost:3853');

      // Wait for health checks
      await new Promise(resolve => setTimeout(resolve, 200));

      const healthy = pool.getHealthyServers();
      expect(healthy.length).toBeGreaterThan(0);
    });

    it('should return null if no healthy servers available', async () => {
      await pool.initialize();

      const selected = pool._selectServer();
      expect(selected).toBeNull();
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

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: 'connected', connectionId: 'test-conn' })}\n\n`);

        req.on('close', () => {
          connections.delete(res);
        });

        return;
      }

      // RPC endpoint
      if (url.pathname === '/mcp/rpc' && req.method === 'POST') {
        let body = '';

        req.on('data', (chunk) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const request = JSON.parse(body);

            // Send response via SSE to all connections
            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: { success: true, data: 'mock-result' }
            };

            for (const conn of connections) {
              conn.write(`data: ${JSON.stringify(response)}\n\n`);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true }));

          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });

        return;
      }

      // Not found
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
    // Close all connections
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
