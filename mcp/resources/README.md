# MCP Resources

Read-only resources that provide access to agentful state via Model Context Protocol (MCP).

## Available Resources

### 1. Product Specification
**URI**: `agentful://product/spec`

Access the product specification in either flat or hierarchical structure.

```javascript
import { readResource } from './index.js';

const spec = await readResource('agentful://product/spec');
console.log(spec.contents[0].text);
```

**Returns**:
- Flat structure: Single markdown document
- Hierarchical structure: Aggregated view of all domains

---

### 2. Current State
**URI**: `agentful://state/current`

Real-time agentful orchestration state.

```javascript
const state = await readResource('agentful://state/current');
const data = JSON.parse(state.contents[0].text);

console.log(`Initialized: ${data.initialized}`);
console.log(`Agents: ${data.agentCount}`);
console.log(`Skills: ${data.skillCount}`);
```

**Returns**:
```json
{
  "initialized": "2026-01-23T00:00:00.000Z",
  "version": "1.0.0",
  "agents": ["orchestrator", "backend", "frontend"],
  "skills": ["javascript", "vitest"],
  "status": "initialized",
  "agentCount": 3,
  "skillCount": 2,
  "readAt": "2026-01-23T00:00:00.000Z"
}
```

---

### 3. Completion Tracking
**URI**: `agentful://completion`

Track feature completion progress with summary statistics.

```javascript
const completion = await readResource('agentful://completion');
const data = JSON.parse(completion.contents[0].text);

console.log(`Overall Progress: ${data.overallProgress}%`);
console.log(`Features: ${data.summary.features.completed}/${data.summary.features.total}`);
```

**Returns**:
```json
{
  "domains": {},
  "features": {},
  "subtasks": {},
  "validationGates": {
    "typeCheck": true,
    "lint": true,
    "tests": false
  },
  "overallProgress": 0,
  "summary": {
    "domains": { "total": 0, "completed": 0, "progress": 0 },
    "features": { "total": 0, "completed": 0, "progress": 0 },
    "subtasks": { "total": 0, "completed": 0, "progress": 0 },
    "validationGates": { "total": 6, "passing": 2, "progress": 33 }
  },
  "readAt": "2026-01-23T00:00:00.000Z"
}
```

---

### 4. Pending Decisions
**URI**: `agentful://decisions`

Decisions requiring human input to unblock agent work.

```javascript
const decisions = await readResource('agentful://decisions');
const data = JSON.parse(decisions.contents[0].text);

console.log(`Pending: ${data.summary.total}`);
console.log(`Critical: ${data.summary.critical}`);
```

**Returns**:
```json
{
  "decisions": [
    {
      "id": "decision-001",
      "question": "Should we use PostgreSQL or MongoDB?",
      "priority": "high",
      "createdAt": "2026-01-23T00:00:00.000Z",
      "age": {
        "hours": 2,
        "days": 0,
        "human": "2 hours ago"
      }
    }
  ],
  "categorized": {
    "critical": [],
    "high": [/* ... */],
    "medium": [],
    "low": []
  },
  "summary": {
    "total": 1,
    "critical": 0,
    "high": 1,
    "medium": 0,
    "low": 0,
    "oldest": { /* oldest decision */ }
  },
  "lastUpdated": "2026-01-23T00:00:00.000Z",
  "readAt": "2026-01-23T00:00:00.000Z"
}
```

---

### 5. Available Agents
**URI**: `agentful://agents/list`

List all available agents with categorization.

```javascript
const agents = await readResource('agentful://agents/list');
const data = JSON.parse(agents.contents[0].text);

console.log(`Total Agents: ${data.summary.total}`);
console.log(`Core: ${data.summary.core}`);
console.log(`Domain: ${data.summary.domain}`);
```

**Returns**:
```json
{
  "agents": [
    { "name": "orchestrator", "type": "core", "generated": false },
    { "name": "backend", "type": "core", "generated": false },
    { "name": "auth-backend", "type": "domain", "generated": true }
  ],
  "categorized": {
    "core": ["orchestrator", "backend", "frontend"],
    "domain": ["auth-backend", "billing-api"],
    "custom": []
  },
  "summary": {
    "total": 5,
    "core": 3,
    "domain": 2,
    "custom": 0,
    "generated": 2
  },
  "readAt": "2026-01-23T00:00:00.000Z"
}
```

---

### 6. Single Agent (Template)
**URI**: `agentful://agents/{name}`

Get a specific agent's definition.

```javascript
const agent = await readResource('agentful://agents/backend');
console.log(agent.contents[0].text); // Markdown content
console.log(agent.contents[0].metadata.name); // "backend"
```

**Returns**: Markdown content of the agent definition.

---

## Usage

### Basic Usage

```javascript
import { readResource, listResources } from './index.js';

// List all available resources
const resources = listResources();
console.log(resources);

// Read a specific resource
const state = await readResource('agentful://state/current');
console.log(JSON.parse(state.contents[0].text));
```

### With Custom Project Root

```javascript
const completion = await readResource(
  'agentful://completion',
  '/path/to/project'
);
```

### Watch for Changes

```javascript
import { watchResource } from './index.js';

const unwatch = watchResource(
  'agentful://state/current',
  (data) => {
    console.log('State changed:', data);
  },
  { interval: 3000 } // Poll every 3 seconds
);

// Stop watching
unwatch();
```

### Direct Adapter Access

```javascript
import { createAdapters } from './adapters.js';

const adapters = createAdapters('/path/to/project');

// Read state
const state = await adapters.state.readState();

// Read decisions
const decisions = await adapters.decisions.readDecisions();

// List agents
const agents = await adapters.agents.listAgents();

// Invalidate cache
adapters.state.invalidateCache();
```

---

## Architecture

### Adapters (`adapters.js`)

Provide consistent data access layer with:
- **Caching**: 5-second TTL to reduce file I/O
- **Error handling**: Graceful fallbacks for missing files
- **Type safety**: Consistent return types

**Available adapters**:
- `StateAdapter` - `.agentful/state.json`
- `CompletionAdapter` - `.agentful/completion.json`
- `DecisionsAdapter` - `.agentful/decisions.json`
- `ArchitectureAdapter` - `.agentful/architecture.json`
- `ProductAdapter` - `.claude/product/`
- `AgentsAdapter` - `.claude/agents/`

### Resources

Each resource implements:
```javascript
{
  uri: string,
  name: string,
  description: string,
  mimeType: string,
  read: async (adapters, params) => Promise<Object>
}
```

**Resource response format**:
```javascript
{
  contents: [{
    uri: string,
    mimeType: string,
    text: string,
    metadata?: Object
  }]
}
```

---

## Error Handling

All resources handle errors gracefully:

**Missing file**:
```json
{
  "error": "State file not found. Run agentful init to initialize.",
  "initialized": false,
  "hint": "Run: npx @itz4blitz/agentful init"
}
```

**Invalid JSON**:
```json
{
  "error": "Failed to read state",
  "message": "Unexpected token in JSON at position 42",
  "hint": "Verify .agentful/state.json exists and is valid JSON"
}
```

**Unknown resource**:
```json
{
  "error": "Resource not found",
  "uri": "agentful://unknown",
  "hint": "Use listResources() to see available resources"
}
```

---

## Performance

### Caching

All adapters cache file reads for 5 seconds:
- Reduces file I/O for frequently accessed resources
- Invalidate manually: `adapter.invalidateCache()`
- Invalidate all: `adapter.invalidateCache()` (no args)

### File Watching

The `watchResource()` function polls by default:
- **Interval**: 5000ms (configurable)
- **Comparison**: JSON string comparison
- **Callback**: Only on change

For production use, consider implementing `fs.watch()` for real-time updates.

---

## Integration Examples

### MCP Server

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { resources } from './index.js';

const server = new Server({ name: 'agentful', version: '1.0.0' });

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resources.map(r => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: r.mimeType
  }))
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return await readResource(request.params.uri);
});
```

### CLI Tool

```javascript
import { readResource } from './index.js';

const state = await readResource('agentful://state/current');
const data = JSON.parse(state.contents[0].text);

console.log(`Status: ${data.status}`);
console.log(`Agents: ${data.agents.join(', ')}`);
```

---

## Testing

See `../test/resources.test.js` for comprehensive test coverage:
- Unit tests for each adapter
- Integration tests for resources
- Error handling tests
- Cache invalidation tests

Run tests:
```bash
npm test -- resources
```

---

## Future Enhancements

### Planned Features

1. **Real-time file watching** - Replace polling with `fs.watch()`
2. **Resource subscriptions** - Push updates via MCP protocol
3. **Resource templates** - Support parameterized URIs (e.g., `agentful://features/{id}`)
4. **Resource mutations** - Write support for decisions, state management
5. **Resource indexing** - Full-text search across resources
6. **Performance metrics** - Track read latency, cache hit rates

### Advanced URIs (Future)

```javascript
// Feature by ID
agentful://features/{id}

// Domain by name
agentful://domains/{name}

// Validation gate status
agentful://validation/{gate}

// Agent execution history
agentful://executions/{agent}/{id}
```

---

## Contributing

When adding new resources:

1. Create adapter in `adapters.js`
2. Create resource file (e.g., `my-resource.js`)
3. Export from `index.js`
4. Add tests in `../test/resources.test.js`
5. Update this README

**Resource template**:
```javascript
export const myResource = {
  uri: 'agentful://my/resource',
  name: 'My Resource',
  description: 'Description of what this provides',
  mimeType: 'application/json',

  async read(adapters, params) {
    try {
      const data = await adapters.myAdapter.readData();

      if (data.error) {
        return {
          contents: [{
            uri: this.uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              error: data.error,
              hint: 'Helpful hint for the user'
            }, null, 2)
          }]
        };
      }

      return {
        contents: [{
          uri: this.uri,
          mimeType: this.mimeType,
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: this.uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            error: 'Failed to read resource',
            message: error.message
          }, null, 2)
        }]
      };
    }
  }
};
```
