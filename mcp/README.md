# Agentful MCP Server

Model Context Protocol (MCP) server for agentful, enabling AI assistants to orchestrate specialized agents through a standardized protocol.

## Overview

The agentful MCP server exposes agentful's agent orchestration capabilities via the Model Context Protocol, allowing any MCP-compatible AI assistant (Claude Code, Kiro, Aider, etc.) to:

- Launch specialized agents (backend, frontend, reviewer, tester, etc.)
- Track execution status and progress
- Access product specifications and state
- Run validation gates
- Resolve pending decisions

## Installation

```bash
# Install globally
npm install -g @itz4blitz/agentful

# Or use npx (no installation)
npx @itz4blitz/agentful-mcp
```

## Quick Start

### 1. Configure Claude Code

Add to your Claude Code configuration file (`~/.config/claude-code/config.json`):

```json
{
  "mcpServers": {
    "agentful": {
      "command": "npx",
      "args": ["@itz4blitz/agentful-mcp"]
    }
  }
}
```

### 2. Configure Kiro

Add to your Kiro MCP configuration (`~/.kiro/mcp-config.json`):

```json
{
  "servers": {
    "agentful": {
      "type": "stdio",
      "command": "npx",
      "args": ["@itz4blitz/agentful-mcp"]
    }
  }
}
```

### 3. Start the Server

The server starts automatically when the AI assistant initializes the MCP connection.

For manual testing:

```bash
# Start stdio server (default)
agentful-mcp

# Start HTTP server
agentful-mcp --transport=http --port=3838

# Start with custom project root
agentful-mcp --project-root=/path/to/project
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Required: Project root directory
AGENTFUL_PROJECT_ROOT=/path/to/project

# Optional: Transport mode (stdio|http|sse)
MCP_TRANSPORT=stdio

# Optional: Logging level (debug|info|warn|error)
LOG_LEVEL=info

# Optional: HTTP/SSE settings
MCP_PORT=3838
MCP_HOST=localhost
```

### Command-Line Options

```bash
agentful-mcp --help

Options:
  --transport=<mode>      Transport mode: stdio|http|sse (default: stdio)
  --port=<number>         HTTP/SSE server port (default: 3838)
  --host=<address>        HTTP/SSE bind address (default: localhost)
  --project-root=<path>   Project root directory (default: current dir)
  --log-level=<level>     Logging level: debug|info|warn|error (default: info)
  --version, -v           Show version
  --help, -h              Show help
```

## MCP Tools

The server exposes these MCP tools:

### `launch_specialist`

Launch a specialized agent to work on a task.

**Parameters**:
- `agent` (string, required) - Agent name (backend, frontend, reviewer, etc.)
- `task` (string, required) - Task description
- `context` (object, optional) - Additional context for the agent
  - `priority` (string) - Task priority: critical|high|medium|low
  - `dependencies` (array) - List of dependency task IDs
  - `timeout` (number) - Execution timeout in milliseconds

**Returns**:
- `executionId` (string) - Unique execution identifier
- `state` (string) - Initial execution state
- `agent` (string) - Agent name
- `task` (string) - Task description
- `startTime` (number) - Execution start timestamp

**Example**:
```json
{
  "agent": "backend",
  "task": "Implement user authentication API",
  "context": {
    "priority": "high",
    "timeout": 600000
  }
}
```

### `get_status`

Get execution status for an agent task.

**Parameters**:
- `executionId` (string, required) - Execution identifier from `launch_specialist`

**Returns**:
- `id` (string) - Execution ID
- `state` (string) - Current state: pending|running|completed|failed
- `agent` (string) - Agent name
- `task` (string) - Task description
- `startTime` (number) - Start timestamp
- `endTime` (number) - End timestamp (if completed)
- `duration` (number) - Execution duration in milliseconds
- `output` (string) - Agent output/logs
- `exitCode` (number) - Exit code (if completed)
- `error` (string) - Error message (if failed)

### `update_progress`

Update completion progress for a feature or component.

**Parameters**:
- `scope` (string, required) - Scope: agent|skill|feature
- `name` (string, required) - Name of the agent/skill/feature
- `percentage` (number, required) - Completion percentage (0-100)
- `metadata` (object, optional) - Additional metadata
  - `filesChanged` (array) - List of modified files
  - `testsAdded` (number) - Number of tests added
  - `notes` (string) - Progress notes

**Returns**:
- `success` (boolean) - Whether update succeeded
- `completion` (object) - Updated completion data

### `run_validation`

Run quality gates (tests, linting, security checks).

**Parameters**:
- `gates` (array, optional) - Specific gates to run (default: all)
  - Possible values: `tests`, `lint`, `types`, `security`, `coverage`
- `fix` (boolean, optional) - Auto-fix issues (default: false)

**Returns**:
- `results` (object) - Gate results
  - `passed` (array) - List of passed gates
  - `failed` (array) - List of failed gates
  - `errors` (object) - Error details per gate
- `summary` (object) - Summary statistics
  - `total` (number) - Total gates run
  - `passed` (number) - Number passed
  - `failed` (number) - Number failed

## MCP Resources

The server exposes these MCP resources:

### `product://spec`

Product specification from `.claude/product/index.md` or `.claude/product/domains/`.

**URI**: `product://spec`

**Content-Type**: `text/markdown`

**Description**: Returns the complete product specification, including features, requirements, and priorities.

### `state://current`

Current agentful state from `.agentful/state.json`.

**URI**: `state://current`

**Content-Type**: `application/json`

**Description**: Returns current execution state, including active agents, pending decisions, and workflow phase.

### `completion://status`

Completion status from `.agentful/completion.json`.

**URI**: `completion://status`

**Content-Type**: `application/json`

**Description**: Returns completion percentages for agents, skills, and features.

## Usage Examples

### Claude Code

```typescript
// Launch backend agent
const result = await mcp.tools.launch_specialist({
  agent: "backend",
  task: "Implement authentication middleware",
  context: { priority: "high" }
});

// Check status
const status = await mcp.tools.get_status({
  executionId: result.executionId
});

// Run validation
const validation = await mcp.tools.run_validation({
  gates: ["tests", "lint"],
  fix: true
});

// Access product spec
const spec = await mcp.resources.read("product://spec");
```

### Kiro

```bash
# Launch agent
kiro tool launch_specialist --agent=reviewer --task="Review PR #123"

# Check status
kiro tool get_status --executionId=abc123

# Read state
kiro resource read state://current
```

### Aider

```python
# In aider MCP mode
/mcp launch_specialist agent=backend task="Add caching layer"
/mcp get_status executionId=xyz789
/mcp run_validation gates=["tests","lint"] fix=true
```

## Transport Modes

### stdio (Default)

Best for local development with Claude Code, Kiro, Aider.

```bash
agentful-mcp
```

**Characteristics**:
- Communicates via stdin/stdout
- No network required
- Automatically managed by MCP client
- Logs to stderr only

### HTTP

Best for remote or networked MCP clients.

```bash
agentful-mcp --transport=http --port=3838
```

**Characteristics**:
- REST API over HTTP
- CORS support
- Bearer token authentication (optional)
- Useful for testing and debugging

### SSE (Server-Sent Events)

Best for streaming updates and real-time progress.

```bash
agentful-mcp --transport=sse --port=3838
```

**Characteristics**:
- Real-time event streaming
- Progress updates pushed to client
- Lower latency than polling
- Great for long-running tasks

## Troubleshooting

### Server Not Starting

**Problem**: Server fails to start or exits immediately.

**Solutions**:
- Check Node.js version: `node --version` (requires 22.0.0+)
- Verify project root: `agentful-mcp --project-root=/path/to/project`
- Check permissions on `.agentful/` and `.claude/` directories
- Review logs: `LOG_LEVEL=debug agentful-mcp`

### MCP Client Can't Connect

**Problem**: Claude Code or Kiro can't establish MCP connection.

**Solutions**:
- Verify MCP configuration syntax (JSON must be valid)
- Check command path: `which npx` or full path to `agentful-mcp`
- Restart the MCP client
- Check stderr output: `agentful-mcp 2>mcp-error.log`

### stdio Mode Issues

**Problem**: Communication errors in stdio mode.

**Solutions**:
- Never write to stdout (use stderr for logs)
- Use `agentful-mcp-stdio` for guaranteed stdio-only mode
- Check for buffer overflow (long outputs)
- Verify JSON serialization is correct

### Agent Execution Fails

**Problem**: `launch_specialist` returns error.

**Solutions**:
- Verify agent exists: `ls .claude/agents/`
- Check agent permissions
- Review task string for special characters
- Check `.agentful/state.json` for corruption
- Try running agent directly: `agentful trigger <agent> "<task>"`

### Resource Access Fails

**Problem**: Can't read `product://spec` or other resources.

**Solutions**:
- Verify files exist: `.claude/product/index.md`
- Check read permissions
- Ensure project root is correct
- Try absolute path: `--project-root=/full/path/to/project`

## Development

### Running Locally

```bash
# Clone repository
git clone https://github.com/itz4blitz/agentful.git
cd agentful

# Install dependencies
npm install

# Run MCP server
node mcp/bin/mcp-server.js

# Or run stdio-only mode
node mcp/bin/mcp-stdio.js
```

### Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests with MCP clients
npm run test:e2e
```

### Debugging

```bash
# Enable debug logging
LOG_LEVEL=debug agentful-mcp

# Capture stderr to file
agentful-mcp 2>debug.log

# Run with Node.js inspector
node --inspect mcp/bin/mcp-server.js
```

## Security

### Authentication

The MCP server inherits security from the transport:

- **stdio**: Authenticated by file system permissions (local only)
- **HTTP**: Use HTTPS + bearer tokens
- **SSE**: Use HTTPS + bearer tokens

### Best Practices

- Always use HTTPS for HTTP/SSE transports
- Restrict access to `.agentful/` directory
- Review agent code before execution
- Use principle of least privilege
- Monitor execution logs for anomalies

## Contributing

Contributions welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md).

## License

MIT - See [LICENSE](../LICENSE)

## Links

- **Documentation**: https://agentful.app
- **GitHub**: https://github.com/itz4blitz/agentful
- **Issues**: https://github.com/itz4blitz/agentful/issues
- **MCP Spec**: https://modelcontextprotocol.io
