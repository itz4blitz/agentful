# Work Distribution Orchestrator

Intelligent work distribution system for orchestrating parallel development across distributed VPS workers.

## Overview

The orchestrator analyzes product specifications, identifies parallelizable features, creates optimal execution plans, distributes work to MCP server pool, tracks progress in real-time, and handles failures with intelligent retry logic.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WorkDistributor                          │
│  (Main orchestration controller - coordinates everything)    │
└────────┬────────────────────────────────────────────┬────────┘
         │                                             │
    ┌────▼──────────────┐                   ┌─────────▼────────┐
    │ DependencyAnalyzer│                   │ ProgressAggregator│
    │ - Parse deps      │                   │ - Track status    │
    │ - Build graph     │                   │ - Metrics         │
    │ - Detect cycles   │                   │ - Persistence     │
    │ - Topo sort       │                   └──────────────────┘
    │ - Generate batches│
    └──────┬────────────┘
           │
    ┌──────▼────────────┐
    │ ExecutionPlanner  │
    │ - Resource est.   │
    │ - Worker matching │
    │ - Load balancing  │
    │ - Optimization    │
    └───────────────────┘
```

## Components

### 1. DependencyAnalyzer (`dependency-analyzer.js`)

Analyzes feature dependencies and builds execution graph.

**Features:**
- Dependency graph construction
- Cycle detection (DFS algorithm)
- Topological sorting (Kahn's algorithm)
- Parallel batch generation
- Dependency validation

**Example:**
```javascript
import { DependencyAnalyzer } from '@itz4blitz/agentful/mcp/orchestrator';

const analyzer = new DependencyAnalyzer();

analyzer.addFeatures([
  { id: 'auth-api', agent: 'backend', dependencies: [] },
  { id: 'auth-ui', agent: 'frontend', dependencies: ['auth-api'] }
]);

const { valid } = analyzer.validate();
const { hasCycles } = analyzer.detectCycles();
const batches = analyzer.generateBatches();
```

### 2. ExecutionPlanner (`execution-planner.js`)

Creates optimal execution plans considering resources and capabilities.

**Features:**
- Resource requirement estimation
- Worker capability matching
- Priority-based scheduling
- Load balancing across workers
- Plan optimization

**Example:**
```javascript
import { ExecutionPlanner } from '@itz4blitz/agentful/mcp/orchestrator';

const planner = new ExecutionPlanner({
  maxConcurrentPerWorker: 2,
  resourceEstimates: {
    backend: { time: 300000, memory: 512, cpu: 1 }
  }
});

const plan = planner.createExecutionPlan(batches, workers);
const optimized = planner.optimizePlan(plan, workers);
const stats = planner.getPlanStatistics(plan);
```

### 3. ProgressAggregator (`progress-aggregator.js`)

Collects and aggregates progress from distributed workers.

**Features:**
- Real-time progress tracking
- Worker status monitoring
- Completion metrics calculation
- Progress persistence (auto-save)
- Event-based updates

**Example:**
```javascript
import { ProgressAggregator } from '@itz4blitz/agentful/mcp/orchestrator';

const aggregator = new ProgressAggregator({
  persistencePath: '.agentful/progress.json',
  autoSave: true,
  updateInterval: 5000
});

aggregator.initialize(features, plan);
aggregator.updateFeature('feature-1', { status: 'complete' });

const progress = aggregator.getProgress();
console.log(`${progress.percentComplete}% complete`);
```

### 4. WorkDistributor (`work-distributor.js`)

High-level orchestrator that coordinates the entire process.

**Features:**
- End-to-end work distribution
- Batch-based execution
- Retry logic with exponential backoff
- Backpressure management
- Real-time progress reporting

**Example:**
```javascript
import { WorkDistributor } from '@itz4blitz/agentful/mcp/orchestrator';

const distributor = new WorkDistributor(mcpPool, {
  maxRetries: 3,
  retryDelay: 5000
});

const features = [
  { id: 'auth-login', agent: 'backend', dependencies: [] },
  { id: 'profile-ui', agent: 'frontend', dependencies: ['auth-login'] }
];

const result = await distributor.distributeWork({ features });
console.log(`${result.successful}/${result.total} features completed`);
```

## Work Distribution Strategy

### Example: 10 Features, 3 VPS Workers

```javascript
// Features with dependencies
A → C → E
B → D → E
F (independent)

// Execution Plan:

Batch 1 (parallel):
  VPS #1: Feature A (no dependencies)
  VPS #2: Feature B (no dependencies)
  VPS #3: Feature F (no dependencies)

Batch 2 (parallel, after Batch 1):
  VPS #1: Feature C (depends on A)
  VPS #2: Feature D (depends on B)

Batch 3 (sequential, after Batch 2):
  VPS #1: Feature E (depends on C, D)
```

## API

### WorkDistributor

#### `distributeWork(config)`

Distribute features across workers.

**Parameters:**
- `config.features` - Array of feature definitions
- `config.workers` - Optional worker pool (uses mcpPool if not provided)
- `config.sequential` - Force sequential execution (default: false)

**Returns:** Promise resolving to execution results

**Events:**
- `distribution-started` - Work distribution begins
- `batch-started` - Batch execution begins
- `feature-complete` - Feature completed successfully
- `feature-failed` - Feature failed
- `feature-retry` - Feature being retried
- `batch-complete` - Batch finished
- `distribution-complete` - All work finished

#### `getProgress()`

Get current execution progress.

**Returns:** Object containing overall progress, worker statuses, and feature progress

#### `stop()`

Stop ongoing distribution.

**Returns:** Promise resolving when stopped

## Feature Definition

```javascript
{
  id: 'unique-feature-id',
  agent: 'backend|frontend|tester|reviewer|fixer|architect',
  priority: 'low|medium|high|critical',
  dependencies: ['other-feature-id', ...],
  metadata: {
    description: 'Human-readable description',
    requirements: ['Requirement 1', 'Requirement 2'],
    // ... any other metadata
  }
}
```

## Worker Definition

```javascript
{
  id: 'worker-id',
  capabilities: {
    memory: 2048,  // MB
    cpu: 4,        // cores
    agents: ['backend', 'frontend', 'tester']  // supported agent types
  },
  async executeAgent(agent, task, options) {
    // Execute agent and return result
    return { success: true, executionId: 'exec-123' };
  }
}
```

## Testing

```bash
# Run all orchestrator tests
npm run test:mcp -- mcp/test/orchestrator

# Run specific test file
npm run test:mcp -- mcp/test/orchestrator/work-distributor.test.js

# Run example
node mcp/orchestrator/example.js
```

## Examples

See `/mcp/orchestrator/example.js` for comprehensive examples:

1. **Simple Parallel Execution** - Independent features
2. **Features with Dependencies** - Complex dependency chains
3. **Real-time Progress Monitoring** - Progress tracking
4. **Error Handling** - Retry logic and failure handling
5. **Dependency Analysis** - Graph statistics and analysis

## Performance Characteristics

- **Dependency Analysis:** O(V + E) where V = features, E = dependencies
- **Topological Sort:** O(V + E)
- **Batch Generation:** O(V²) worst case (diamond dependencies)
- **Plan Creation:** O(V * W) where W = workers
- **Memory:** O(V + E) for graph storage

## Best Practices

1. **Keep dependencies explicit** - Don't rely on implicit ordering
2. **Use priority levels** - Critical features get scheduled first
3. **Monitor backpressure** - Avoid overwhelming workers
4. **Enable persistence** - Save progress for crash recovery
5. **Handle retries gracefully** - Use exponential backoff
6. **Set realistic timeouts** - Based on actual execution times

## Limitations

- **Maximum concurrent per worker:** 1 (configurable, increase with caution)
- **Retry attempts:** 3 (configurable)
- **No cross-worker communication** - Features execute independently
- **No dynamic reprioritization** - Plan is static once created

## Troubleshooting

### "Circular dependencies detected"

Features have a cycle in their dependency graph. Use `analyzer.detectCycles()` to find the cycle.

### "Worker not found"

Worker went offline during execution. Features will be retried on different workers.

### "Backpressure high"

Too many concurrent executions. Increase worker count or reduce batch sizes.

### Tests failing with batch generation

The batch generation algorithm currently groups all immediately-processable features together rather than enforcing strict batch separation. This is a known optimization opportunity.

## Future Enhancements

- [ ] Dynamic reprioritization during execution
- [ ] Worker affinity (prefer same worker for related tasks)
- [ ] Resource-aware scheduling (consider actual memory/CPU usage)
- [ ] Execution time learning (improve estimates based on history)
- [ ] Cross-worker coordination (shared state)
- [ ] Partial failure recovery (resume from checkpoint)

## License

MIT
