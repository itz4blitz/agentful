# MCP Client Pool

Client-side library for connecting to multiple distributed MCP workers and managing their lifecycle.

## Features

- **Multi-Server Management** - Connect to multiple MCP servers simultaneously
- **Load Balancing** - Round-robin, least-loaded, or priority-based strategies
- **Health Monitoring** - Automatic health checks and server status tracking
- **Work Queue** - Intelligent task distribution with retry logic
- **Failover** - Automatic reconnection and task redistribution on server failure
- **OAuth Support** - Token-based authentication for secure connections

## Installation

```bash
npm install eventsource
```

## Quick Start

```javascript
import { MCPServerPool, LoadBalanceStrategy } from './mcp/client/index.js';

// Create a server pool
const pool = new MCPServerPool({
  strategy: LoadBalanceStrategy.ROUND_ROBIN,
  healthCheckInterval: 30000, // 30 seconds
  maxRetries: 3
});

// Initialize the pool
await pool.initialize();

// Add servers
await pool.addServer('vps-1', 'https://vps1.example.com:3838', authToken);
await pool.addServer('vps-2', 'https://vps2.example.com:3838', authToken);
await pool.addServer('vps-3', 'https://vps3.example.com:3838', authToken);

// Call a tool (automatically load balanced)
const result = await pool.callTool('launch_specialist', {
  agent: 'backend',
  task: 'Implement authentication API',
  context: {
    priority: 'high',
    stack: 'Node.js + Express'
  }
});

console.log('Task result:', result);

// Read a resource
const state = await pool.readResource('agentful://state/current');
console.log('Current state:', state);

// Get pool statistics
const stats = pool.getStats();
console.log('Pool stats:', stats);
// {
//   servers: 3,
//   healthy: 3,
//   degraded: 0,
//   offline: 0,
//   tasks: 5,
//   queue: { pending: 2, inProgress: 3, completed: 10 },
//   strategy: 'round_robin'
// }

// Shutdown when done
await pool.shutdown();
```

## Architecture

### Components

1. **MCPClient** (`mcp-client.js`)
   - Connects to a single remote MCP server via HTTP/SSE
   - Handles JSON-RPC requests and responses
   - Manages OAuth tokens
   - Implements reconnection logic with exponential backoff

2. **MCPServerPool** (`server-pool.js`)
   - Manages multiple MCP clients
   - Implements load balancing strategies
   - Coordinates health monitoring and work distribution
   - Provides unified API for distributed operations

3. **HealthMonitor** (`health-monitor.js`)
   - Performs periodic health checks (ping)
   - Tracks server status (online, offline, degraded, reconnecting)
   - Automatically removes dead servers
   - Attempts reconnection with exponential backoff

4. **WorkQueue** (`work-queue.js`)
   - Queues pending MCP tool calls
   - Distributes work to available servers
   - Implements retry logic with configurable attempts
   - Tracks execution status and completion

### Data Flow

```
User Request
    ↓
MCPServerPool
    ↓
WorkQueue (enqueue task)
    ↓
Load Balancer (select server)
    ↓
MCPClient (execute on remote server)
    ↓
HealthMonitor (track server health)
    ↓
Result returned to user
```

## API Reference

### MCPServerPool

#### Constructor

```javascript
const pool = new MCPServerPool(options);
```

**Options:**
- `strategy` - Load balancing strategy (default: `LoadBalanceStrategy.ROUND_ROBIN`)
- `healthCheckInterval` - Health check interval in ms (default: 30000)
- `maxRetries` - Maximum retry attempts (default: 3)

#### Methods

**`async initialize()`**
Start the pool and health monitoring.

**`async shutdown()`**
Stop the pool and disconnect all servers.

**`async addServer(serverId, baseUrl, authToken, options)`**
Add a server to the pool.

```javascript
await pool.addServer('server-1', 'https://vps1.example.com:3838', token, {
  priority: 10,
  timeout: 10000
});
```

**`async removeServer(serverId)`**
Remove a server from the pool.

**`async callTool(toolName, args, options)`**
Call a tool (automatically load balanced).

```javascript
const result = await pool.callTool('launch_specialist', {
  agent: 'backend',
  task: 'Implement API'
}, {
  priority: 10 // Higher priority = executed first
});
```

**`async readResource(uri, options)`**
Read a resource (automatically load balanced).

```javascript
const state = await pool.readResource('agentful://state/current');
```

**`getStats()`**
Get pool statistics.

**`getServers()`**
Get detailed server information.

#### Events

```javascript
pool.on('server-offline', (serverId, error) => {
  console.log(`Server ${serverId} went offline:`, error);
});

pool.on('server-recovered', (serverId) => {
  console.log(`Server ${serverId} recovered`);
});

pool.on('task-completed', (taskId, result) => {
  console.log(`Task ${taskId} completed:`, result);
});

pool.on('task-failed', (taskId, error) => {
  console.log(`Task ${taskId} failed:`, error);
});
```

### MCPClient

#### Constructor

```javascript
const client = new MCPClient(options);
```

**Options:**
- `serverId` - Unique server identifier
- `baseUrl` - Server base URL (required)
- `authToken` - OAuth token for authentication
- `timeout` - Request timeout in ms (default: 10000)
- `retryAttempts` - Retry attempts (default: 3)

#### Methods

**`async connect()`**
Connect to the remote server.

**`disconnect()`**
Disconnect from the server.

**`async callTool(toolName, args)`**
Call a tool on the remote server.

**`async readResource(uri)`**
Read a resource from the remote server.

**`async ping()`**
Check if server is reachable.

**`getStats()`**
Get client statistics.

### Load Balancing Strategies

#### Round Robin

```javascript
const pool = new MCPServerPool({
  strategy: LoadBalanceStrategy.ROUND_ROBIN
});
```

Distributes requests evenly across all healthy servers in rotation.

#### Least Loaded

```javascript
const pool = new MCPServerPool({
  strategy: LoadBalanceStrategy.LEAST_LOADED
});
```

Sends requests to the server with the fewest active tasks.

#### Priority

```javascript
const pool = new MCPServerPool({
  strategy: LoadBalanceStrategy.PRIORITY
});
```

Sends requests to the highest priority server. If priorities are equal, uses least-loaded strategy.

```javascript
await pool.addServer('high-perf', 'https://fast-server.com', token, {
  priority: 10 // Higher number = higher priority
});

await pool.addServer('backup', 'https://slow-server.com', token, {
  priority: 1
});
```

## Advanced Usage

### Custom Health Checks

```javascript
import { HealthMonitor, ServerStatus } from './mcp/client/index.js';

const monitor = new HealthMonitor({
  checkInterval: 15000, // 15 seconds
  degradedThreshold: 2, // 2 failed checks = degraded
  offlineThreshold: 5, // 5 failed checks = offline
  reconnectAttempts: 10,
  reconnectDelay: 5000
});

monitor.on('server-degraded', (serverId, error) => {
  console.warn(`Server ${serverId} is degraded:`, error);
  // Maybe reduce priority or trigger alert
});
```

### Manual Work Queue Control

```javascript
import { WorkQueue, TaskStatus } from './mcp/client/index.js';

const queue = new WorkQueue({
  maxRetries: 5,
  retryDelay: 2000,
  taskTimeout: 60000, // 1 minute
  concurrentTasks: 20
});

// Enqueue high-priority task
const taskPromise = queue.enqueue('tool_call', {
  name: 'critical-operation',
  arguments: { data: 'important' }
}, {
  priority: 100
});

// Get queue stats
const stats = queue.getStats();
console.log('Queue stats:', stats);

// Get pending tasks
const pending = queue.getPendingTasks();
console.log('Pending tasks:', pending);
```

### Error Handling

```javascript
try {
  const result = await pool.callTool('launch_specialist', { /* ... */ });
} catch (error) {
  if (error.message.includes('No healthy servers')) {
    console.error('All servers are offline!');
    // Trigger alert or fallback behavior
  } else if (error.message.includes('timeout')) {
    console.error('Request timed out');
    // Retry or notify user
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Monitoring and Observability

```javascript
// Monitor pool health
setInterval(() => {
  const stats = pool.getStats();
  const servers = pool.getServers();

  console.log('Pool Status:', {
    healthy: stats.healthy,
    degraded: stats.degraded,
    offline: stats.offline,
    queueLength: stats.queue.pending
  });

  for (const server of servers) {
    console.log(`Server ${server.id}:`, {
      status: server.status,
      activeTasks: server.activeTasks,
      requests: server.stats.requestsSent,
      errors: server.stats.errors
    });
  }
}, 10000); // Every 10 seconds
```

## Testing

```bash
# Run all client tests
npm run test:mcp -- test/client

# Run specific test suite
npm run test:mcp -- test/client/server-pool.test.js
npm run test:mcp -- test/client/mcp-client.test.js
npm run test:mcp -- test/client/health-monitor.test.js
npm run test:mcp -- test/client/work-queue.test.js
```

## Performance Considerations

- **Connection Pooling**: Reuses HTTP connections for better performance
- **Concurrent Tasks**: Configure `concurrentTasks` based on server capacity
- **Health Check Interval**: Balance between responsiveness and overhead
- **Retry Strategy**: Exponential backoff prevents server overload

## Security

- **OAuth Tokens**: Secure token-based authentication
- **HTTPS**: All production connections should use HTTPS
- **Token Rotation**: Implement token refresh logic for long-running pools
- **Rate Limiting**: Respect server rate limits to avoid abuse

## Troubleshooting

**All servers showing as offline:**
- Check network connectivity
- Verify server URLs are correct
- Ensure auth tokens are valid
- Check firewall rules

**Tasks timing out:**
- Increase `timeout` in client options
- Increase `taskTimeout` in work queue
- Check server load

**Memory leak with long-running pools:**
- Call `queue.clearCompleted()` periodically
- Monitor `getStats()` for growing task counts
- Ensure proper cleanup in error handlers

## License

MIT
