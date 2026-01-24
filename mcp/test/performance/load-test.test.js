import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMCPServer } from '../../../server.js';
import { MockExecutor } from '../../fixtures/mock-executor.js';
import { createTestEnvironment, cleanupTestEnvironment } from '../../fixtures/test-helpers.js';
import { SSETransport } from '../../../core/transport.js';
import http from 'http';

/**
 * Performance and Load Tests
 *
 * Tests MCP server performance under load:
 * - Concurrent request handling
 * - Connection pooling
 * - Memory usage
 * - Latency benchmarks
 * - Throughput limits
 */
describe('MCP Performance Tests', () => {
  let server;
  let testDir;
  let mockExecutor;

  beforeEach(async () => {
    testDir = await createTestEnvironment();
    mockExecutor = new MockExecutor();

    server = createMCPServer({
      projectRoot: testDir,
      executor: mockExecutor
    });
  });

  afterEach(async () => {
    mockExecutor.reset();
    await cleanupTestEnvironment(testDir);
  });

  describe('Concurrent Requests', () => {
    it('should handle 100 concurrent tool calls', async () => {
      mockExecutor.setMockResult('launched', { executionId: 'test-123' });

      const serverInstance = server.getServer();
      const startTime = Date.now();

      const requests = Array(100).fill(null).map((_, i) =>
        serverInstance.request(
          {
            method: 'tools/call',
            params: {
              name: 'launch_specialist',
              arguments: {
                agent: 'backend',
                task: `Task ${i}`
              }
            }
          },
          'CallToolResultSchema'
        )
      );

      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Should complete in < 5s

      const avgLatency = duration / 100;
      expect(avgLatency).toBeLessThan(50); // Avg < 50ms per request
    });

    it('should handle 50 concurrent resource reads', async () => {
      const serverInstance = server.getServer();
      const startTime = Date.now();

      const requests = Array(50).fill(null).map(() =>
        serverInstance.request(
          {
            method: 'resources/read',
            params: { uri: 'agentful://state' }
          },
          'ReadResourceResultSchema'
        )
      );

      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(2000); // Should complete in < 2s
    });

    it('should handle mixed concurrent operations', async () => {
      mockExecutor.setMockResult('launched', { executionId: 'test-123' });

      const serverInstance = server.getServer();

      const operations = [
        ...Array(20).fill('tools/list'),
        ...Array(20).fill('resources/list'),
        ...Array(20).fill('resources/read'),
        ...Array(20).fill('tools/call')
      ];

      const requests = operations.map((op, i) => {
        if (op === 'tools/call') {
          return serverInstance.request(
            {
              method: op,
              params: {
                name: 'launch_specialist',
                arguments: {
                  agent: 'backend',
                  task: `Task ${i}`
                }
              }
            },
            'CallToolResultSchema'
          );
        } else if (op === 'resources/read') {
          return serverInstance.request(
            {
              method: op,
              params: { uri: 'agentful://state' }
            },
            'ReadResourceResultSchema'
          );
        } else {
          return serverInstance.request(
            { method: op },
            op === 'tools/list' ? 'ListToolsResultSchema' : 'ListResourcesResultSchema'
          );
        }
      });

      const results = await Promise.all(requests);
      expect(results).toHaveLength(80);
    });
  });

  describe('Sequential Load', () => {
    it('should handle 500 sequential requests without degradation', async () => {
      const serverInstance = server.getServer();
      const latencies = [];

      for (let i = 0; i < 500; i++) {
        const start = Date.now();

        await serverInstance.request(
          {
            method: 'tools/list'
          },
          'ListToolsResultSchema'
        );

        latencies.push(Date.now() - start);
      }

      // Calculate statistics
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      expect(avgLatency).toBeLessThan(10); // Avg < 10ms
      expect(maxLatency).toBeLessThan(100); // Max < 100ms
      expect(minLatency).toBeGreaterThan(0);

      // Check for degradation (last 100 should be similar to first 100)
      const firstHundred = latencies.slice(0, 100);
      const lastHundred = latencies.slice(-100);

      const avgFirst = firstHundred.reduce((a, b) => a + b, 0) / 100;
      const avgLast = lastHundred.reduce((a, b) => a + b, 0) / 100;

      // Last 100 shouldn't be more than 2x slower than first 100
      expect(avgLast).toBeLessThan(avgFirst * 2);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory with repeated operations', async () => {
      const serverInstance = server.getServer();

      // Get baseline memory
      if (global.gc) global.gc();
      const baselineMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await serverInstance.request(
          {
            method: 'tools/list'
          },
          'ListToolsResultSchema'
        );
      }

      // Force garbage collection if available
      if (global.gc) global.gc();
      const afterMemory = process.memoryUsage().heapUsed;

      // Memory should not grow significantly
      const memoryGrowth = afterMemory - baselineMemory;
      const growthMB = memoryGrowth / 1024 / 1024;

      expect(growthMB).toBeLessThan(50); // Less than 50MB growth
    });

    it('should handle large payload responses', async () => {
      const serverInstance = server.getServer();

      // Read a potentially large resource
      const result = await serverInstance.request(
        {
          method: 'resources/read',
          params: { uri: 'agentful://state' }
        },
        'ReadResourceResultSchema'
      );

      expect(result.contents).toBeDefined();
      expect(result.contents[0].text).toBeDefined();
    });
  });

  describe('SSE Transport Performance', () => {
    let transport;

    beforeEach(async () => {
      transport = new SSETransport({
        port: 9881,
        logLevel: 'error'
      });
      await transport.start();
    });

    afterEach(async () => {
      if (transport.connected) {
        await transport.stop();
      }
    });

    it('should handle 50 concurrent SSE connections', async () => {
      const connectionPromises = Array(50).fill(null).map(() => {
        return new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port: 9881,
            path: '/mcp/sse',
            method: 'GET'
          });

          req.on('response', (res) => {
            res.once('data', () => {
              resolve();
              req.destroy();
            });
          });

          req.end();
        });
      });

      const startTime = Date.now();
      await Promise.all(connectionPromises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should establish all connections in < 2s
    });

    it('should handle rapid RPC requests', async () => {
      const requests = Array(100).fill(null).map((_, i) => {
        return new Promise((resolve, reject) => {
          const msg = { jsonrpc: '2.0', id: i, method: 'test' };
          const req = http.request({
            hostname: 'localhost',
            port: 9881,
            path: '/mcp/rpc',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve());
          });

          req.on('error', reject);
          req.write(JSON.stringify(msg));
          req.end();
        });
      });

      const startTime = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000); // Should complete in < 3s
    });

    it('should maintain connection stability under load', async () => {
      // Establish connection
      const req = http.request({
        hostname: 'localhost',
        port: 9881,
        path: '/mcp/sse',
        method: 'GET'
      });

      let connectionId;
      let messagesReceived = 0;

      await new Promise((resolve) => {
        req.on('response', (res) => {
          res.on('data', (chunk) => {
            const data = chunk.toString();
            const match = data.match(/data: ({.*})/);
            if (match) {
              const event = JSON.parse(match[1]);
              if (event.type === 'connected') {
                connectionId = event.connectionId;
                resolve();
              } else {
                messagesReceived++;
              }
            }
          });
        });

        req.end();
      });

      // Send 50 messages rapidly
      for (let i = 0; i < 50; i++) {
        transport.send(connectionId, {
          jsonrpc: '2.0',
          id: i,
          method: 'test',
          params: {}
        });
      }

      // Wait for messages to be received
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(messagesReceived).toBeGreaterThan(40); // At least 80% delivered

      req.destroy();
    });
  });

  describe('Throughput Limits', () => {
    it('should measure requests per second capacity', async () => {
      const serverInstance = server.getServer();
      const testDuration = 2000; // 2 seconds
      const startTime = Date.now();
      let requestCount = 0;

      while (Date.now() - startTime < testDuration) {
        await serverInstance.request(
          {
            method: 'tools/list'
          },
          'ListToolsResultSchema'
        );
        requestCount++;
      }

      const actualDuration = Date.now() - startTime;
      const requestsPerSecond = (requestCount / actualDuration) * 1000;

      expect(requestsPerSecond).toBeGreaterThan(100); // At least 100 req/s
    });

    it('should measure concurrent throughput', async () => {
      mockExecutor.setMockResult('launched', { executionId: 'test-123' });

      const serverInstance = server.getServer();
      const concurrency = 10;
      const requestsPerWorker = 20;
      const startTime = Date.now();

      const workers = Array(concurrency).fill(null).map(async () => {
        for (let i = 0; i < requestsPerWorker; i++) {
          await serverInstance.request(
            {
              method: 'tools/call',
              params: {
                name: 'launch_specialist',
                arguments: {
                  agent: 'backend',
                  task: `Task ${i}`
                }
              }
            },
            'CallToolResultSchema'
          );
        }
      });

      await Promise.all(workers);
      const duration = Date.now() - startTime;

      const totalRequests = concurrency * requestsPerWorker;
      const requestsPerSecond = (totalRequests / duration) * 1000;

      expect(requestsPerSecond).toBeGreaterThan(50); // At least 50 req/s with concurrency
    });
  });

  describe('Latency Benchmarks', () => {
    it('should measure p50/p95/p99 latencies', async () => {
      const serverInstance = server.getServer();
      const latencies = [];

      // Collect 1000 samples
      for (let i = 0; i < 1000; i++) {
        const start = process.hrtime.bigint();

        await serverInstance.request(
          {
            method: 'tools/list'
          },
          'ListToolsResultSchema'
        );

        const end = process.hrtime.bigint();
        latencies.push(Number(end - start) / 1000000); // Convert to ms
      }

      // Sort for percentile calculation
      latencies.sort((a, b) => a - b);

      const p50 = latencies[Math.floor(latencies.length * 0.50)];
      const p95 = latencies[Math.floor(latencies.length * 0.95)];
      const p99 = latencies[Math.floor(latencies.length * 0.99)];

      expect(p50).toBeLessThan(10); // p50 < 10ms
      expect(p95).toBeLessThan(50); // p95 < 50ms
      expect(p99).toBeLessThan(100); // p99 < 100ms
    });
  });

  describe('Resource Utilization', () => {
    it('should efficiently handle resource operations', async () => {
      const serverInstance = server.getServer();

      // Baseline
      const start = Date.now();
      const startCpu = process.cpuUsage();

      // Perform operations
      await Promise.all(
        Array(100).fill(null).map(() =>
          serverInstance.request(
            {
              method: 'resources/list'
            },
            'ListResourcesResultSchema'
          )
        )
      );

      const duration = Date.now() - start;
      const cpuUsage = process.cpuUsage(startCpu);

      expect(duration).toBeLessThan(2000);

      // CPU usage should be reasonable (less than 2 seconds of CPU time for 2s operation)
      const totalCpuMs = (cpuUsage.user + cpuUsage.system) / 1000;
      expect(totalCpuMs).toBeLessThan(3000);
    });
  });
});
