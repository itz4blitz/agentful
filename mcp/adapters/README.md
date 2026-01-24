# MCP Adapters

Thin adapter layer that bridges the MCP server to agentful's existing infrastructure. All adapters reuse existing code from `lib/` - **no logic duplication**.

## Architecture

```
MCP Server (tools/resources)
       ↓
  Adapters (thin wrappers)
       ↓
Existing agentful code (lib/)
```

## Adapters

### ExecutionAdapter

Bridges to agent execution pipeline.

**Reuses:**
- `lib/pipeline/executor.js` - AgentExecutor for pipeline jobs
- `lib/core/claude-executor.js` - ClaudeExecutor for subprocess execution
- `lib/server/executor.js` - Remote execution server logic

**Methods:**
```javascript
import { ExecutionAdapter } from './adapters/execution-adapter.js';

const executor = new ExecutionAdapter({
  projectRoot: process.cwd(),
  agentsDir: '.claude/agents',
  timeout: 600000
});

// Execute agent (async mode - returns immediately)
const { executionId } = await executor.executeAgent(
  'backend',
  'Create user authentication endpoint',
  { files: ['src/routes/auth.js'] },
  { async: true }
);

// Poll for status
const status = executor.getExecutionStatus(executionId);
// { id, agent, task, state, progress, output, error }

// Execute synchronously (waits for completion)
const result = await executor.executeAgent(
  'reviewer',
  'Review PR changes',
  {},
  { async: false }
);

// Cancel execution
executor.cancelExecution(executionId);

// List executions
const executions = executor.listExecutions({ agent: 'backend' });
```

### StateAdapter

Bridges to `.agentful/` JSON state files.

**Reuses:**
- `lib/validation.js` - Schema validation using AJV
- Atomic file operations with temp file pattern

**Methods:**
```javascript
import { StateAdapter } from './adapters/state-adapter.js';

const state = new StateAdapter({
  projectRoot: process.cwd(),
  stateDir: '.agentful',
  createIfMissing: false
});

// Read state files
const stateData = await state.readState();
const completion = await state.readCompletion();
const decisions = await state.readDecisions();
const architecture = await state.readArchitecture();

// Update progress
await state.updateProgress('feature-123', 75, 'in-progress');
// Updates completion.json atomically

// Add decision
await state.addDecision({
  id: 'decision-001',
  question: 'Should we use PostgreSQL or MongoDB?',
  context: 'Database selection for user service',
  status: 'pending'
});

// Update decision
await state.updateDecision('decision-001', {
  answer: 'PostgreSQL for ACID guarantees',
  status: 'answered'
});

// Update validation gates
await state.updateValidationGates({
  typeCheck: true,
  lint: true,
  tests: false
});

// Check file existence
const fileStatus = await state.checkStateFiles();
// { 'state.json': true, 'completion.json': true, ... }
```

**Error Handling:**

All read methods validate using `lib/validation.js` schemas:
- **Missing**: File doesn't exist
- **Corrupted**: Invalid JSON
- **Invalid**: Doesn't match schema
- **Incomplete**: Missing required fields

```javascript
try {
  const state = await stateAdapter.readState();
} catch (error) {
  // Error includes:
  // - What failed (missing/corrupted/invalid)
  // - Suggested action to fix
}
```

### AgentAdapter

Bridges to `.claude/agents/` markdown files.

**Reuses:**
- `lib/ci/claude-action-integration.js` - Agent loading and parsing

**Methods:**
```javascript
import { AgentAdapter } from './adapters/agent-adapter.js';

const agents = new AgentAdapter({
  projectRoot: process.cwd(),
  agentsDir: '.claude/agents'
});

// List all agents
const agentNames = await agents.listAgents();
// ['backend', 'frontend', 'reviewer', 'tester', ...]

// Get agent definition
const agent = await agents.getAgentDefinition('backend');
// {
//   name: 'backend',
//   path: '/path/to/.claude/agents/backend.md',
//   metadata: {
//     name: 'backend',
//     description: 'Implements backend services...',
//     model: 'sonnet',
//     tools: ['Read', 'Write', 'Edit', 'Bash']
//   },
//   instructions: '# Backend Agent\n\nYou are...'
// }

// Get metadata for all agents
const metadata = await agents.getAgentsMetadata();

// Find agents by tool
const writeAgents = await agents.getAgentsByTool('Write');
// ['backend', 'frontend', 'fixer']

// Search agents
const matches = await agents.searchAgents('database');
// Returns agents mentioning 'database' in name/description/instructions

// Validate agent format
const validation = await agents.validateAgent('backend');
// { valid: true, errors: [], warnings: [] }

// Check existence
const exists = await agents.agentExists('backend');
// true
```

### ValidationAdapter

Bridges to validation system (quality gates).

**Reuses:**
- State adapter for updating completion.json
- Spawns validation commands (tsc, eslint, npm test, etc.)

**Methods:**
```javascript
import { ValidationAdapter, ValidationGates } from './adapters/validation-adapter.js';

const validator = new ValidationAdapter({
  projectRoot: process.cwd(),
  timeout: 300000 // 5 minutes
});

// Run all validation gates
const results = await validator.runValidation();
// {
//   passed: false,
//   gates: {
//     typeCheck: { passed: true, message: 'TypeScript type checking passed' },
//     lint: { passed: false, message: 'ESLint failed: 3 errors' },
//     tests: { passed: true, message: 'npm test passed' },
//     coverage: { passed: false, message: 'Coverage 65% is below minimum 80%', percentage: 65 },
//     security: { passed: true, message: 'npm audit passed' },
//     deadCode: { passed: true, message: 'No dead code detected' }
//   },
//   summary: '4/6 validation gates passed. Failed: lint, coverage'
// }

// Run specific gates
const lintResult = await validator.runValidation([ValidationGates.LINT]);

// Get current status from completion.json
const status = await validator.getValidationStatus();
// { typeCheck: true, lint: false, tests: true, ... }

// Check if all passing
const allPassing = await validator.allGatesPassing();
// false
```

**Detected Validation Tools:**

The adapter auto-detects which tools are configured:

- **Type Check**: TypeScript (tsc), Flow, mypy
- **Lint**: ESLint, Prettier, flake8
- **Tests**: npm test, pytest
- **Coverage**: npm coverage, pytest --cov
- **Security**: npm audit, safety
- **Dead Code**: ts-prune, depcheck

If no tool is configured for a gate, it returns `{ passed: true, message: 'skipped' }`.

## Usage in MCP Server

```javascript
import { createAdapters } from './mcp/adapters/index.js';

// Create all adapters at once
const adapters = createAdapters({
  projectRoot: '/path/to/project'
});

// Use in MCP tools
server.tool('execute_agent', async (params) => {
  const result = await adapters.execution.executeAgent(
    params.agent,
    params.task,
    params.context,
    { async: params.async }
  );
  return result;
});

server.tool('get_completion', async () => {
  const completion = await adapters.state.readCompletion();
  return completion;
});

server.resource('agents', async () => {
  const agentList = await adapters.agent.listAgents();
  return agentList;
});

server.tool('validate', async (params) => {
  const results = await adapters.validation.runValidation(params.gates);
  return results;
});
```

## Design Principles

1. **Zero Logic Duplication**: All adapters are thin wrappers that delegate to existing `lib/` code
2. **Atomic Operations**: State mutations use atomic file operations (write to temp, then rename)
3. **Comprehensive Errors**: All errors include what failed and how to fix it
4. **Validation First**: All reads validate using AJV schemas from `lib/validation.js`
5. **Consistent Interface**: All adapters follow similar patterns (constructor, methods, error handling)

## File Structure

```
mcp/adapters/
├── README.md                    # This file
├── index.js                     # Central export point
├── execution-adapter.js         # Agent execution (~280 lines)
├── state-adapter.js             # State file management (~320 lines)
├── agent-adapter.js             # Agent definitions (~250 lines)
└── validation-adapter.js        # Validation gates (~280 lines)
```

## Testing

All adapters can be tested independently:

```javascript
// Test execution adapter
import { ExecutionAdapter } from './adapters/execution-adapter.js';

const executor = new ExecutionAdapter({ projectRoot: '.' });
const result = await executor.executeAgent('backend', 'Test task');
console.log(result);

// Test state adapter
import { StateAdapter } from './adapters/state-adapter.js';

const state = new StateAdapter({ createIfMissing: true });
await state.updateProgress('test-feature', 100, 'completed');
const completion = await state.readCompletion();
console.log(completion);

// Test agent adapter
import { AgentAdapter } from './adapters/agent-adapter.js';

const agents = new AgentAdapter();
const list = await agents.listAgents();
const backend = await agents.getAgentDefinition('backend');
console.log(list, backend);

// Test validation adapter
import { ValidationAdapter } from './adapters/validation-adapter.js';

const validator = new ValidationAdapter();
const results = await validator.runValidation();
console.log(results);
```

## Error Handling

All adapters throw standard Error objects with descriptive messages:

```javascript
try {
  await stateAdapter.readState();
} catch (error) {
  // error.message includes:
  // - What operation failed
  // - Why it failed (missing/corrupted/invalid)
  // - Suggested action to fix
}
```

Example error messages:

```
Failed to read state.json: File not found at .agentful/state.json
Suggested action: Run initialization command to create the file

Failed to read completion.json: Schema validation failed
- /overallProgress: must be number
Suggested action: Fix schema validation errors in the file

Agent "backend" not found.
Available agents: frontend, reviewer, tester

Execution timeout after 600000ms
```

## Performance

- **State reads**: ~1ms (JSON parse + validation)
- **State writes**: ~5ms (atomic write with temp file)
- **Agent reads**: ~2ms (markdown parse + YAML frontmatter)
- **Execution**: Variable (depends on agent task)
- **Validation**: Variable (depends on tools configured)

## Dependencies

All adapters use only existing agentful dependencies:

- `lib/pipeline/executor.js` - Pipeline execution
- `lib/core/claude-executor.js` - Claude Code subprocess
- `lib/server/executor.js` - Remote execution
- `lib/validation.js` - Schema validation
- `lib/ci/claude-action-integration.js` - Agent loading
- Standard Node.js modules: `fs/promises`, `path`, `child_process`

No additional npm packages required.
