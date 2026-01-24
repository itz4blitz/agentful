# Agentful MCP Tools

This directory contains 8 MCP (Model Context Protocol) tools that enable programmatic interaction with the agentful autonomous development framework.

## Tool Overview

Each tool is implemented in its own file following a consistent pattern:
- **Comprehensive input validation** with detailed error messages
- **JSDoc documentation** for all functions and parameters
- **Strict type checking** using JSON schemas
- **Graceful error handling** with actionable suggestions
- **MCP-compliant responses** with structured JSON output

## Available Tools

### 1. launch_specialist
**File**: `launch-specialist.js` (201 lines)

Launches a specialized agent to execute a task.

**Use Cases**:
- Start backend development work
- Trigger frontend UI implementation
- Run automated tests
- Execute code reviews

**Parameters**:
- `agent` (required): Agent name (`orchestrator`, `backend`, `frontend`, `tester`, `reviewer`, `fixer`, `architect`)
- `task` (required): Task description (10-10000 characters)
- `context` (optional): Execution context (featureId, domainId, files, priority)
- `async` (optional): Background mode (default: true)
- `timeout` (optional): Execution timeout in ms (default: 600000)

**Returns**:
```json
{
  "success": true,
  "executionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "agent": "backend",
  "mode": "background",
  "statusUrl": "/status/550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 2. get_status
**File**: `get-status.js` (178 lines)

Retrieves the current status of an agent execution.

**Use Cases**:
- Check if agent completed successfully
- Monitor long-running tasks
- Retrieve agent output and errors
- Calculate execution duration

**Parameters**:
- `executionId` (required): UUID from launch_specialist
- `includeOutput` (optional): Include full output (default: false)
- `outputLimit` (optional): Max output characters (default: 1000)

**Returns**:
```json
{
  "success": true,
  "executionId": "550e8400-e29b-41d4-a716-446655440000",
  "agent": "backend",
  "state": "completed",
  "startTime": 1706025600000,
  "endTime": 1706025900000,
  "duration": 300000,
  "durationSeconds": 300,
  "exitCode": 0,
  "isComplete": true
}
```

---

### 3. update_progress
**File**: `update-progress.js` (188 lines)

Updates completion progress for features, agents, or skills.

**Use Cases**:
- Mark feature as 50% complete
- Track agent work progress
- Update skill implementation status
- Trigger completion notifications

**Parameters**:
- `type` (required): Item type (`feature`, `agent`, `skill`)
- `id` (required): Item identifier (1-200 characters)
- `progress` (required): Progress percentage (0-100)
- `completed` (optional): Force completion status
- `metadata` (optional): Additional metadata

**Returns**:
```json
{
  "success": true,
  "type": "feature",
  "id": "user-authentication",
  "progress": 85.0,
  "completed": false,
  "previousProgress": 60.0,
  "progressDelta": 25.0,
  "message": "feature \"user-authentication\" progress updated to 85%"
}
```

---

### 4. run_validation
**File**: `run-validation.js` (221 lines)

Runs quality gate validations (types, lint, tests, coverage, security).

**Use Cases**:
- Pre-commit validation
- CI/CD quality checks
- Auto-fix linting issues
- Verify code coverage

**Parameters**:
- `gates` (optional): Specific gates to run (default: all)
- `fix` (optional): Auto-fix issues (default: false)
- `failFast` (optional): Stop on first failure (default: false)
- `coverage` (optional): Coverage threshold settings
- `context` (optional): Specific files/directories to validate

**Returns**:
```json
{
  "success": true,
  "summary": {
    "total": 6,
    "passed": 6,
    "failed": 0,
    "duration": 45000
  },
  "gates": [
    { "name": "types", "passed": true },
    { "name": "lint", "passed": true },
    { "name": "tests", "passed": true },
    { "name": "coverage", "passed": true },
    { "name": "security", "passed": true },
    { "name": "deadcode", "passed": true }
  ]
}
```

---

### 5. resolve_decision
**File**: `resolve-decision.js` (223 lines)

Resolves a pending decision by providing an answer.

**Use Cases**:
- Answer architectural questions
- Provide API design decisions
- Resolve naming conflicts
- Unblock waiting agents

**Parameters**:
- `decisionId` (required): Decision ID to resolve (1-100 characters)
- `answer` (required): Answer text (1-10000 characters)
- `metadata` (optional): Resolution metadata (resolvedBy, reasoning, alternatives)

**Returns**:
```json
{
  "success": true,
  "decisionId": "api-design-001",
  "question": "Should we use REST or GraphQL?",
  "answer": "Use REST for simplicity and widespread support",
  "status": "answered",
  "blockedAgents": ["backend", "frontend"],
  "message": "Decision \"api-design-001\" has been resolved. 2 blocked agent(s) can now proceed."
}
```

---

### 6. analyze_architecture
**File**: `analyze-architecture.js` (205 lines)

Analyzes codebase architecture and detects tech stack.

**Use Cases**:
- Auto-detect project tech stack
- Identify frameworks and patterns
- Generate architecture insights
- Cache analysis for performance

**Parameters**:
- `projectRoot` (optional): Project directory (default: cwd)
- `force` (optional): Force re-analysis (default: false)
- `depth` (optional): Analysis depth (`shallow`, `standard`, `deep`)
- `include` (optional): File patterns to include
- `exclude` (optional): File patterns to exclude

**Returns**:
```json
{
  "success": true,
  "analysis": {
    "fileCount": 250,
    "confidence": 95,
    "duration": 3500
  },
  "techStack": {
    "languages": [
      { "name": "JavaScript", "confidence": 95, "files": 180 }
    ],
    "primaryLanguage": "JavaScript",
    "frameworks": [
      { "name": "Express", "confidence": 90 }
    ],
    "runtime": { "name": "Node.js", "version": ">=22.0.0" }
  },
  "domains": [
    { "name": "server", "confidence": 85, "files": 4 }
  ]
}
```

---

### 7. generate_agents
**File**: `generate-agents.js` (229 lines)

Generates specialized agent definitions based on architecture.

**Use Cases**:
- Auto-generate agents for tech stack
- Create domain-specific agents
- Update agent definitions
- Preserve custom modifications

**Parameters**:
- `architecture` (optional): Architecture data (auto-fetched if not provided)
- `agents` (optional): Specific agents to generate (default: all recommended)
- `force` (optional): Overwrite existing files (default: false)
- `preserveCustom` (optional): Preserve user-modified agents (default: true)
- `outputDir` (optional): Output directory (default: .claude/agents/)

**Returns**:
```json
{
  "success": true,
  "generated": [
    { "name": "backend", "path": ".claude/agents/backend.md", "type": "generated" },
    { "name": "frontend", "path": ".claude/agents/frontend.md", "type": "generated" }
  ],
  "summary": {
    "total": 6,
    "new": 4,
    "overwritten": 2,
    "preserved": 1
  },
  "techStack": {
    "primaryLanguage": "JavaScript",
    "frameworks": ["Express", "React"],
    "confidence": 95
  }
}
```

---

### 8. manage_state
**File**: `manage-state.js` (344 lines)

Read and write agentful state files with atomic operations.

**Use Cases**:
- Read current state/completion data
- Update state fields atomically
- Backup before modifications
- List all state files

**Parameters**:
- `operation` (required): Operation type (`read`, `write`, `update`, `delete`, `list`)
- `file` (optional): State file (`state`, `completion`, `decisions`, `architecture`, `metadata`)
- `data` (optional): Data to write/update
- `path` (optional): Dot-notation path (e.g., "decisions.0.status")
- `validate` (optional): Validate before writing (default: true)
- `backup` (optional): Create backup (default: true)

**Returns (read)**:
```json
{
  "success": true,
  "operation": "read",
  "file": "completion",
  "data": {
    "agents": { "backend": { "completed": true, "progress": 100 } },
    "skills": {},
    "lastUpdated": "2026-01-23T21:00:00Z"
  }
}
```

**Returns (write)**:
```json
{
  "success": true,
  "operation": "write",
  "file": "completion",
  "written": true,
  "validated": true,
  "backupCreated": "/path/to/backup",
  "message": "State file \"completion\" written successfully"
}
```

---

## Usage

### Import All Tools
```javascript
import { tools } from './mcp/tools/index.js';

// Register with MCP server
mcpServer.registerTools(tools);
```

### Import Individual Tools
```javascript
import { launchSpecialistTool } from './mcp/tools/launch-specialist.js';
import { getStatusTool } from './mcp/tools/get-status.js';
```

### Execute a Tool
```javascript
const result = await launchSpecialistTool.handler(
  {
    agent: 'backend',
    task: 'Implement user authentication API',
    async: true
  },
  adapters // Execution, state, validation adapters
);

console.log(result.content[0].text);
```

## Architecture

### Tool Structure

Each tool follows this pattern:

```javascript
export const toolNameTool = {
  name: 'tool_name',
  description: 'Human-readable description',

  inputSchema: {
    type: 'object',
    properties: { /* JSON schema */ },
    required: [/* required fields */]
  },

  async handler(input, adapters) {
    // 1. Validate input
    // 2. Execute operation via adapters
    // 3. Return MCP-compliant response
  }
};
```

### Adapters Required

Tools use adapters to access agentful functionality:

- **adapters.execution**: Launch agents, get execution status
- **adapters.state**: Read/write state files, manage decisions
- **adapters.validation**: Run quality gates, validation checks
- **adapters.analyzer**: Analyze architecture, detect tech stack
- **adapters.generator**: Generate specialized agents

### Error Handling

All tools return consistent error responses:

```json
{
  "success": false,
  "error": "Error category",
  "message": "Detailed error message",
  "suggestion": "How to fix the issue"
}
```

## Validation

Tools perform strict input validation:

1. **Type checking**: Ensures parameters are correct types
2. **Range validation**: Numbers within bounds, strings within length limits
3. **Enum validation**: Values match allowed options
4. **Format validation**: UUIDs, paths, etc. match expected patterns
5. **Required fields**: Missing required parameters are rejected

## Testing

Run validation check:

```bash
node -e "import('./mcp/tools/index.js').then(m => {
  const result = m.validateTools();
  console.log('Valid:', result.valid);
  if (!result.valid) console.error('Errors:', result.errors);
})"
```

## File Statistics

| Tool | Lines | Size | Complexity |
|------|-------|------|------------|
| launch-specialist | 201 | 5.9KB | Medium |
| get-status | 178 | 5.8KB | Low |
| update-progress | 188 | 5.2KB | Low |
| run-validation | 221 | 6.6KB | Medium |
| resolve-decision | 223 | 6.3KB | Medium |
| analyze-architecture | 205 | 6.4KB | Medium |
| generate-agents | 229 | 7.1KB | High |
| manage-state | 344 | 9.9KB | High |
| **Total** | **1,914** | **56.3KB** | - |

## Next Steps

1. **Implement Adapters**: Create adapter implementations in `/mcp/adapters/`
2. **Create MCP Server**: Build MCP server that uses these tools
3. **Add Tests**: Write unit tests for each tool
4. **Integration**: Connect to agentful execution engine
5. **Documentation**: Add API documentation with examples

## Contributing

When adding new tools:

1. Follow the existing pattern (name, description, inputSchema, handler)
2. Add comprehensive input validation with helpful error messages
3. Use adapters (don't access files directly)
4. Document with JSDoc
5. Add to `index.js` exports
6. Update this README with tool details
