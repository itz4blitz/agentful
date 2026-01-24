/**
 * MCP Client Pool
 *
 * Client-side library for connecting to multiple distributed MCP workers
 * and managing their lifecycle.
 *
 * @module mcp/client
 */

export { MCPClient } from './mcp-client.js';
export { MCPServerPool, LoadBalanceStrategy } from './server-pool.js';
export { HealthMonitor, ServerStatus } from './health-monitor.js';
export { WorkQueue, TaskStatus } from './work-queue.js';
