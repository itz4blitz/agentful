# Distributed MCP Architecture for Agentful

## Overview

This document defines the distributed Model Context Protocol (MCP) architecture for agentful, enabling horizontal scaling across multiple VPS instances with secure remote access and intelligent work distribution.

## Architecture Components

```
┌─────────────────────┐
│  Central Client     │
│  (Orchestrator)     │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │  MCP Client │
    │    Pool     │
    └──────┬──────┘
           │
    ┌──────▼──────────────────────────┐
    │       Load Balancer              │
    │  (Health Checks + Distribution)  │
    └──────┬──────────────────────────┘
           │
    ┌──────▼──────┬────────┬──────────┐
    │             │        │          │
┌───▼───┐   ┌────▼───┐  ┌─▼───┐  ┌───▼───┐
│ VPS 1 │   │ VPS 2  │  │VPS 3│  │ VPS N │
├───────┤   ├────────┤  ├─────┤  ├───────┤
│ MCP   │   │  MCP   │  │ MCP │  │  MCP  │
│Server │   │ Server │  │Server│ │ Server │
├───────┤   ├────────┤  ├─────┤  ├───────┤
│Claude │   │ Claude │  │Claude│ │ Claude │
│ Code  │   │  Code  │  │ Code │  │  Code  │
├───────┤   ├────────┤  ├─────┤  ├───────┤
│ GLM   │   │  GLM   │  │ GLM │  │  GLM  │
│Worker │   │ Worker │  │Worker│ │ Worker │
└───────┘   └────────┘  └─────┘  └───────┘
```

## Core Design Principles

1. **Backward Compatibility**: Maintain stdio transport support while adding HTTP/SSE
2. **Security First**: OAuth 2.1 with mTLS for production environments
3. **Fault Tolerance**: Automatic failover and retry mechanisms
4. **Horizontal Scaling**: Add/remove workers without downtime
5. **Resource Efficiency**: Smart load balancing based on worker capabilities
6. **Observability**: Comprehensive metrics and logging

## Transport Layer Architecture

### Dual Transport Support

```javascript
// Transport abstraction layer
class TransportManager {
  constructor(config) {
    this.transports = {
      stdio: new StdioTransport(),      // Local development
      http: new HttpSseTransport()       // Remote workers
    };
  }

  async connect(type, options) {
    const transport = this.transports[type];
    return await transport.connect(options);
  }
}
```

### HTTP/SSE Transport Features

- **Request/Response**: HTTP POST for RPC calls
- **Server-Sent Events**: Real-time updates and streaming responses
- **WebSocket Upgrade**: Optional for bidirectional streaming
- **Connection Pooling**: Reuse HTTP/2 connections
- **Automatic Reconnection**: Exponential backoff with jitter

## Authentication & Authorization

### OAuth 2.1 Implementation

Using Client Credentials Grant for server-to-server authentication:

```
┌──────────────┐                  ┌──────────────┐
│ MCP Client   │                  │ Auth Server  │
└──────┬───────┘                  └──────┬───────┘
       │                                  │
       │  1. POST /token                  │
       │  client_id + client_secret       │
       ├─────────────────────────────────►│
       │                                  │
       │  2. Access Token (JWT)           │
       │◄─────────────────────────────────┤
       │                                  │
       │  3. MCP Request + Bearer Token   │
       ├─────────────────────────────────►│
       │                                  │
┌──────▼───────┐                          │
│ MCP Server   │                          │
└──────────────┘                          │
```

### Security Layers

1. **Transport Security**: TLS 1.3 minimum
2. **Authentication**: OAuth 2.1 Client Credentials
3. **Authorization**: JWT with role-based claims
4. **Mutual TLS**: Optional for high-security environments
5. **API Key Rotation**: Automatic key rotation every 30 days

## Client Pool Architecture

### Pool Management

```javascript
class MCPClientPool {
  constructor(config) {
    this.clients = new Map();        // client_id -> MCPClient
    this.healthStatus = new Map();   // client_id -> HealthStatus
    this.loadMetrics = new Map();    // client_id -> LoadMetrics

    this.config = {
      maxClients: config.maxClients || 10,
      healthCheckInterval: config.healthCheckInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
      retryAttempts: config.retryAttempts || 3
    };
  }

  async addClient(endpoint, credentials) {
    const client = await this.createClient(endpoint, credentials);
    this.clients.set(client.id, client);
    this.startHealthCheck(client.id);
    return client.id;
  }

  async removeClient(clientId) {
    this.stopHealthCheck(clientId);
    const client = this.clients.get(clientId);
    await client.disconnect();
    this.clients.delete(clientId);
  }

  async getAvailableClient() {
    const healthyClients = Array.from(this.clients.entries())
      .filter(([id, _]) => this.isHealthy(id))
      .sort((a, b) => this.getLoad(a[0]) - this.getLoad(b[0]));

    if (healthyClients.length === 0) {
      throw new Error('No healthy MCP servers available');
    }

    return healthyClients[0][1];
  }
}
```

### Health Checking

```javascript
class HealthChecker {
  async checkHealth(client) {
    try {
      const start = Date.now();
      const response = await client.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
        timestamp: Date.now(),
        capabilities: response.capabilities,
        load: response.load || {}
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}
```

## Work Distribution Strategy

### Load Balancing Algorithms

1. **Least Connections**: Route to worker with fewest active tasks
2. **Round Robin**: Distribute evenly across all workers
3. **Weighted Round Robin**: Consider worker capacity
4. **Resource-Based**: Route based on available CPU/memory
5. **Affinity-Based**: Keep related tasks on same worker

### Task Distribution Logic

```javascript
class WorkDistributor {
  constructor(clientPool, config) {
    this.clientPool = clientPool;
    this.algorithm = config.algorithm || 'least-load';
    this.affinityMap = new Map(); // project_id -> client_id
  }

  async distributeTask(task) {
    // Check for affinity
    if (task.projectId && this.affinityMap.has(task.projectId)) {
      const affinityClient = this.clientPool.get(
        this.affinityMap.get(task.projectId)
      );
      if (affinityClient && affinityClient.isHealthy()) {
        return await this.executeTask(affinityClient, task);
      }
    }

    // Select client based on algorithm
    const client = await this.selectClient(task);

    // Update affinity if needed
    if (task.projectId) {
      this.affinityMap.set(task.projectId, client.id);
    }

    return await this.executeTask(client, task);
  }

  async selectClient(task) {
    switch (this.algorithm) {
      case 'least-load':
        return await this.clientPool.getLeastLoadedClient();
      case 'round-robin':
        return await this.clientPool.getNextClient();
      case 'resource-based':
        return await this.clientPool.getClientWithResources(task.requirements);
      default:
        return await this.clientPool.getAvailableClient();
    }
  }
}
```

## Fault Tolerance

### Failure Handling

```javascript
class FaultTolerantExecutor {
  constructor(distributor, config) {
    this.distributor = distributor;
    this.retryPolicy = {
      maxAttempts: config.maxRetries || 3,
      backoffMultiplier: config.backoffMultiplier || 2,
      initialDelay: config.initialDelay || 1000,
      maxDelay: config.maxDelay || 30000
    };
  }

  async executeWithRetry(task) {
    let lastError;
    let delay = this.retryPolicy.initialDelay;

    for (let attempt = 1; attempt <= this.retryPolicy.maxAttempts; attempt++) {
      try {
        return await this.distributor.distributeTask(task);
      } catch (error) {
        lastError = error;

        if (this.isRetryable(error) && attempt < this.retryPolicy.maxAttempts) {
          await this.wait(delay);
          delay = Math.min(
            delay * this.retryPolicy.backoffMultiplier,
            this.retryPolicy.maxDelay
          );

          // Add jitter to prevent thundering herd
          delay += Math.random() * 1000;
        } else {
          break;
        }
      }
    }

    throw new Error(`Task failed after ${this.retryPolicy.maxAttempts} attempts: ${lastError.message}`);
  }

  isRetryable(error) {
    // Network errors, timeout, 503 Service Unavailable
    return error.code === 'ECONNREFUSED' ||
           error.code === 'ETIMEDOUT' ||
           error.statusCode === 503;
  }
}
```

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = new Map();
    this.lastFailureTime = new Map();
    this.circuitOpen = new Map();
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute(clientId, operation) {
    if (this.isOpen(clientId)) {
      if (this.shouldAttemptReset(clientId)) {
        // Half-open state - try one request
        this.circuitOpen.set(clientId, 'half-open');
      } else {
        throw new Error(`Circuit breaker open for client ${clientId}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess(clientId);
      return result;
    } catch (error) {
      this.onFailure(clientId);
      throw error;
    }
  }

  onSuccess(clientId) {
    this.failureCount.delete(clientId);
    this.lastFailureTime.delete(clientId);
    this.circuitOpen.delete(clientId);
  }

  onFailure(clientId) {
    const count = (this.failureCount.get(clientId) || 0) + 1;
    this.failureCount.set(clientId, count);
    this.lastFailureTime.set(clientId, Date.now());

    if (count >= this.threshold) {
      this.circuitOpen.set(clientId, true);
    }
  }

  isOpen(clientId) {
    return this.circuitOpen.get(clientId) === true;
  }

  shouldAttemptReset(clientId) {
    const lastFailure = this.lastFailureTime.get(clientId) || 0;
    return Date.now() - lastFailure > this.timeout;
  }
}
```

## Deployment Architecture

### Worker Node Setup

Each VPS worker runs:

1. **agentful**: Core agent framework
2. **Claude Code**: AI development agent
3. **GLM Worker**: Code generation model
4. **MCP Server**: Protocol endpoint
5. **Monitoring Agent**: Metrics collection

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  mcp-server:
    image: agentful/mcp-server:latest
    ports:
      - "8080:8080"
    environment:
      - MCP_TRANSPORT=http
      - MCP_AUTH_ENABLED=true
      - MCP_OAUTH_ISSUER=${OAUTH_ISSUER}
      - MCP_CLIENT_ID=${CLIENT_ID}
      - MCP_CLIENT_SECRET=${CLIENT_SECRET}
    volumes:
      - ./projects:/workspace
      - ./config:/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  claude-code:
    image: anthropic/claude-code:latest
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./projects:/workspace
    restart: unless-stopped

  glm-worker:
    image: agentful/glm-worker:latest
    environment:
      - MODEL_PATH=/models/deepseek-coder
    volumes:
      - ./models:/models
      - ./projects:/workspace
    restart: unless-stopped

  monitoring:
    image: prometheus/node-exporter:latest
    ports:
      - "9100:9100"
    restart: unless-stopped
```

## Scaling Strategy

### Horizontal Scaling Triggers

1. **CPU Usage** > 70% for 5 minutes
2. **Memory Usage** > 80%
3. **Queue Depth** > 100 tasks
4. **Response Time** > 5 seconds p95
5. **Error Rate** > 1%

### Auto-scaling Configuration

```javascript
class AutoScaler {
  constructor(cloudProvider, config) {
    this.provider = cloudProvider;
    this.config = {
      minInstances: config.minInstances || 1,
      maxInstances: config.maxInstances || 10,
      scaleUpThreshold: config.scaleUpThreshold || 0.7,
      scaleDownThreshold: config.scaleDownThreshold || 0.3,
      cooldownPeriod: config.cooldownPeriod || 300000 // 5 minutes
    };
    this.lastScaleTime = 0;
  }

  async evaluateScaling(metrics) {
    if (Date.now() - this.lastScaleTime < this.config.cooldownPeriod) {
      return; // Still in cooldown
    }

    const utilizationRate = this.calculateUtilization(metrics);
    const currentInstances = await this.provider.getInstanceCount();

    if (utilizationRate > this.config.scaleUpThreshold) {
      await this.scaleUp(currentInstances);
    } else if (utilizationRate < this.config.scaleDownThreshold) {
      await this.scaleDown(currentInstances);
    }
  }

  async scaleUp(current) {
    if (current >= this.config.maxInstances) return;

    const newCount = Math.min(
      current + Math.ceil(current * 0.5), // Scale by 50%
      this.config.maxInstances
    );

    await this.provider.setInstanceCount(newCount);
    this.lastScaleTime = Date.now();
  }

  async scaleDown(current) {
    if (current <= this.config.minInstances) return;

    const newCount = Math.max(
      current - 1, // Scale down slowly
      this.config.minInstances
    );

    await this.provider.setInstanceCount(newCount);
    this.lastScaleTime = Date.now();
  }
}
```

## Monitoring & Observability

### Metrics Collection

```javascript
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: new Counter('mcp_requests_total'),
      errors: new Counter('mcp_errors_total'),
      latency: new Histogram('mcp_request_duration_seconds'),
      activeConnections: new Gauge('mcp_active_connections'),
      taskQueue: new Gauge('mcp_task_queue_depth'),
      workerHealth: new Gauge('mcp_worker_health')
    };
  }

  recordRequest(method, status, duration) {
    this.metrics.requests.inc({ method, status });
    this.metrics.latency.observe({ method }, duration);

    if (status >= 400) {
      this.metrics.errors.inc({ method, status });
    }
  }

  updateConnections(count) {
    this.metrics.activeConnections.set(count);
  }

  updateQueueDepth(depth) {
    this.metrics.taskQueue.set(depth);
  }

  updateWorkerHealth(workerId, health) {
    this.metrics.workerHealth.set({ worker: workerId }, health ? 1 : 0);
  }
}
```

### Logging Strategy

```javascript
class StructuredLogger {
  constructor(service) {
    this.service = service;
  }

  log(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.service,
      level,
      message,
      ...context,
      trace_id: context.trace_id || this.generateTraceId()
    };

    // Send to centralized logging
    this.ship(entry);
  }

  ship(entry) {
    // Send to CloudWatch, Datadog, etc.
    console.error(JSON.stringify(entry));
  }

  generateTraceId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Migration Path

### Phase 1: Foundation (Week 1-2)
1. Upgrade MCP SDK to support 2025-03-26 spec
2. Implement HTTP/SSE transport alongside stdio
3. Add basic OAuth 2.1 support
4. Deploy single remote worker for testing

### Phase 2: Scale (Week 3-4)
1. Implement client pool management
2. Add health checking and monitoring
3. Deploy 3-5 worker nodes
4. Implement basic load balancing

### Phase 3: Production (Week 5-6)
1. Add circuit breaker and retry logic
2. Implement auto-scaling
3. Set up centralized logging
4. Performance optimization

### Phase 4: Enhancement (Ongoing)
1. Advanced routing strategies
2. Cost optimization
3. Multi-region deployment
4. Disaster recovery

## Configuration Reference

### Server Configuration

```json
{
  "mcp": {
    "server": {
      "transport": ["stdio", "http"],
      "http": {
        "port": 8080,
        "host": "0.0.0.0",
        "tls": {
          "enabled": true,
          "cert": "/path/to/cert.pem",
          "key": "/path/to/key.pem"
        }
      },
      "auth": {
        "enabled": true,
        "type": "oauth2",
        "issuer": "https://auth.agentful.dev",
        "audience": "mcp-server"
      }
    }
  }
}
```

### Client Configuration

```json
{
  "mcp": {
    "client": {
      "pool": {
        "maxSize": 10,
        "minSize": 2,
        "connectionTimeout": 10000,
        "requestTimeout": 30000
      },
      "loadBalancing": {
        "algorithm": "least-load",
        "healthCheck": {
          "enabled": true,
          "interval": 30000,
          "timeout": 5000,
          "unhealthyThreshold": 3,
          "healthyThreshold": 2
        }
      },
      "retry": {
        "maxAttempts": 3,
        "backoff": "exponential",
        "initialDelay": 1000,
        "maxDelay": 30000
      }
    }
  }
}
```

## Security Considerations

1. **Network Security**
   - Private VPC for worker communication
   - Security groups limiting ingress/egress
   - VPN or private endpoints for management

2. **Data Protection**
   - Encryption at rest for all storage
   - Encryption in transit (TLS 1.3)
   - Regular security audits

3. **Access Control**
   - Principle of least privilege
   - Regular credential rotation
   - Audit logging for all operations

4. **Compliance**
   - GDPR data residency requirements
   - SOC2 compliance for enterprise
   - Regular penetration testing

## Performance Targets

- **Latency**: < 100ms p50, < 500ms p99
- **Throughput**: 1000 requests/second per worker
- **Availability**: 99.9% uptime
- **Scale**: Support 100+ concurrent workers
- **Recovery**: < 30 seconds for failover

## Cost Optimization

1. **Instance Right-sizing**: Use spot instances for non-critical workloads
2. **Reserved Capacity**: Reserve baseline capacity for discounts
3. **Geographic Distribution**: Deploy in lower-cost regions
4. **Resource Pooling**: Share resources across projects
5. **Automatic Shutdown**: Stop idle workers after timeout

## Conclusion

This distributed MCP architecture enables agentful to scale horizontally across multiple VPS instances while maintaining security, reliability, and performance. The design supports both local development with stdio transport and production deployment with HTTP/SSE transport, OAuth 2.1 authentication, and intelligent work distribution.