# MCP Resources - Quick Start

Get started with agentful MCP resources in 60 seconds.

## Installation

Resources are included with agentful. No installation needed.

## Usage

### 1. Read a Resource

```javascript
import { readResource } from './mcp/resources/index.js';

const state = await readResource('agentful://state/current');
console.log(state.contents[0].text);
```

### 2. List All Resources

```javascript
import { listResources } from './mcp/resources/index.js';

const resources = listResources();
console.log(resources);
// [{ uri: '...', name: '...', description: '...', mimeType: '...' }, ...]
```

### 3. Watch for Changes

```javascript
import { watchResource } from './mcp/resources/index.js';

const unwatch = watchResource(
  'agentful://state/current',
  (data) => console.log('Changed:', data)
);

// Stop watching later
unwatch();
```

## Available Resources

| URI | Description | Returns |
|-----|-------------|---------|
| `agentful://product/spec` | Product specification | Markdown |
| `agentful://state/current` | Current agentful state | JSON |
| `agentful://completion` | Feature completion tracking | JSON |
| `agentful://decisions` | Pending decisions | JSON |
| `agentful://agents/list` | List all agents | JSON |
| `agentful://agents/{name}` | Specific agent definition | Markdown |

## Examples

### Check Agent Status

```javascript
import { readResource } from './mcp/resources/index.js';

const state = await readResource('agentful://state/current');
const data = JSON.parse(state.contents[0].text);

console.log(`Status: ${data.status}`);
console.log(`Agents: ${data.agentCount}`);
console.log(`Initialized: ${data.initialized}`);
```

### Track Progress

```javascript
const completion = await readResource('agentful://completion');
const data = JSON.parse(completion.contents[0].text);

console.log(`Overall: ${data.overallProgress}%`);
console.log(`Features: ${data.summary.features.completed}/${data.summary.features.total}`);
console.log(`Tests passing: ${data.summary.validationGates.passing}/${data.summary.validationGates.total}`);
```

### Check Pending Decisions

```javascript
const decisions = await readResource('agentful://decisions');
const data = JSON.parse(decisions.contents[0].text);

if (data.summary.total > 0) {
  console.log(`${data.summary.total} decisions pending:`);
  data.decisions.forEach(d => {
    console.log(`  [${d.priority}] ${d.question} (${d.age.human})`);
  });
}
```

### Get Agent Definition

```javascript
const backend = await readResource('agentful://agents/backend');
const markdown = backend.contents[0].text;

console.log(markdown); // Full agent definition
```

## CLI Usage

Run examples:
```bash
node mcp/resources/example.js
```

Test all resources:
```bash
node -e "
import { readResource } from './mcp/resources/index.js';

const state = await readResource('agentful://state/current');
console.log(JSON.parse(state.contents[0].text));
"
```

## Error Handling

All resources return errors in the response:

```javascript
const result = await readResource('agentful://state/current');
const data = JSON.parse(result.contents[0].text);

if (data.error) {
  console.error(`Error: ${data.error}`);
  console.log(`Hint: ${data.hint}`);
} else {
  // Use data
  console.log(data);
}
```

## Advanced Usage

### Direct Adapter Access

```javascript
import { createAdapters } from './mcp/resources/index.js';

const adapters = createAdapters();

// Read multiple sources in parallel
const [state, completion, decisions] = await Promise.all([
  adapters.state.readState(),
  adapters.completion.readCompletion(),
  adapters.decisions.readDecisions()
]);
```

### Cache Invalidation

```javascript
import { createAdapters } from './mcp/resources/index.js';

const adapters = createAdapters();

// Read with cache
const state1 = await adapters.state.readState();

// Invalidate cache
adapters.state.invalidateCache();

// Read fresh
const state2 = await adapters.state.readState();
```

### Custom Project Root

```javascript
import { readResource } from './mcp/resources/index.js';

const state = await readResource(
  'agentful://state/current',
  '/path/to/other/project'
);
```

## MCP Server Integration

```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { resources, readResource } from './mcp/resources/index.js';

const server = new Server({ name: 'agentful', version: '1.0.0' });

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: resources.map(r => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: r.mimeType
  }))
}));

// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  return await readResource(request.params.uri);
});
```

## Common Patterns

### Dashboard

```javascript
async function showDashboard() {
  const [state, completion, decisions, agents] = await Promise.all([
    readResource('agentful://state/current'),
    readResource('agentful://completion'),
    readResource('agentful://decisions'),
    readResource('agentful://agents/list')
  ]);

  const stateData = JSON.parse(state.contents[0].text);
  const completionData = JSON.parse(completion.contents[0].text);
  const decisionsData = JSON.parse(decisions.contents[0].text);
  const agentsData = JSON.parse(agents.contents[0].text);

  console.log('=== Agentful Dashboard ===');
  console.log(`Status: ${stateData.status}`);
  console.log(`Progress: ${completionData.overallProgress}%`);
  console.log(`Pending Decisions: ${decisionsData.summary.total}`);
  console.log(`Available Agents: ${agentsData.summary.total}`);
}
```

### Monitor

```javascript
import { watchResource } from './mcp/resources/index.js';

function monitor() {
  // Watch state changes
  watchResource('agentful://state/current', (data) => {
    const state = JSON.parse(data.contents[0].text);
    console.log(`[${new Date().toISOString()}] Agents: ${state.agentCount}`);
  });

  // Watch completion changes
  watchResource('agentful://completion', (data) => {
    const completion = JSON.parse(data.contents[0].text);
    console.log(`[${new Date().toISOString()}] Progress: ${completion.overallProgress}%`);
  });
}

monitor();
```

## Troubleshooting

**"State file not found"**
- Run: `npx @itz4blitz/agentful init`

**"Product specification not found"**
- Create `.claude/product/index.md` or run `/agentful-product`

**"No agents found"**
- Run: `agentful init` to install agents

**"Architecture not analyzed"**
- Run `/agentful-generate` in Claude Code

## Next Steps

- Read full documentation: [`README.md`](./README.md)
- Run examples: `node mcp/resources/example.js`
- Integration guide: [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)

---

**Need help?** Open an issue on GitHub or check the documentation.
