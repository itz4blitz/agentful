# agentful Lifecycle Hooks

Comprehensive lifecycle hooks for validation and metrics tracking throughout the development workflow. All hooks are Node.js scripts for cross-platform compatibility (Windows, macOS, Linux).

## Why Node.js?

- ✅ **Cross-platform** - Works on Windows, macOS, Linux without modifications
- ✅ **No extra dependencies** - Node.js already required for Claude Code (>=22.0.0)
- ✅ **Zero external packages** - Uses only built-in modules (`fs`, `path`, `child_process`)
- ✅ **Maintainable** - JavaScript is more familiar to most developers than Bash
- ✅ **Consistent behavior** - Same execution across all platforms

## Available Hooks

### 1. Pre-Agent Hook (`pre-agent.js`)

**Purpose**: Validates agent preconditions before invocation

**When to invoke**: Before calling `Task()` to delegate to any agent

**Environment Variables**:
- `AGENTFUL_AGENT` - Name of the agent being invoked (e.g., "backend", "frontend")
- `AGENTFUL_FEATURE` - Feature being worked on (optional)
- `AGENTFUL_DOMAIN` - Domain containing the feature (optional)

**Checks**:
- Agent file exists in `.claude/agents/`
- Required state files exist (state.json, completion.json, decisions.json)
- State files are valid JSON
- Feature exists in product specification (if specified)
- Orchestrator is not blocked on decisions

**Return Codes**:
- `0` - All validations passed, proceed with agent invocation
- `1` - Validation failed, block agent invocation

**Example Usage**:
```bash
export AGENTFUL_AGENT="backend"
export AGENTFUL_FEATURE="user-login"
export AGENTFUL_DOMAIN="authentication"

node bin/hooks/pre-agent.js
# or make executable
./bin/hooks/pre-agent.js
```

### 2. Post-Agent Hook (`post-agent.js`)

**Purpose**: Tracks agent execution metrics and invocation history

**When to invoke**: After an agent completes its work (success or failure)

**Environment Variables**: Same as pre-agent

**Actions**:
- Increments invocation counter for the agent
- Records last invocation timestamp
- Updates `.agentful/agent-metrics.json`

**Return Codes**:
- `0` - Always succeeds (non-blocking)

**Example Usage**:
```bash
export AGENTFUL_AGENT="frontend"
node bin/hooks/post-agent.js
```

### 3. Pre-Feature Hook (`pre-feature.js`)

**Purpose**: Validates feature readiness before implementation

**When to invoke**: Before starting feature implementation

**Environment Variables**:
- `AGENTFUL_FEATURE` - Feature name (required)
- `AGENTFUL_DOMAIN` - Domain name (optional for hierarchical structure)

**Checks**:
- Feature file exists in product specification
- Completion tracking exists
- Feature dependencies are met
- Domain is not blocked (for hierarchical structure)
- No blocking decisions exist for this feature
- Tech stack has been analyzed
- Required agents exist

**Return Codes**:
- `0` - All validations passed (may have warnings)
- `1` - Validation failed, block feature implementation

**Example Usage**:
```bash
export AGENTFUL_FEATURE="checkout-flow"
export AGENTFUL_DOMAIN="ecommerce"
node bin/hooks/pre-feature.js
```

### 4. Post-Feature Hook (`post-feature.js`)

**Purpose**: Feature completion validation and automated testing

**When to invoke**: After feature implementation is complete

**Environment Variables**: Same as pre-feature

**Actions**:
1. Runs test suite (`npm test`)
2. Runs type checking (`npx tsc --noEmit` if TypeScript exists)
3. Runs linter (`npm run lint`)
4. Checks test coverage (if available)
5. Updates `.agentful/completion.json` with validation results
6. Creates git commit if all validations pass

**Return Codes**:
- `0` - All validations passed, feature complete
- `1` - Validation failed, needs fixes

**Example Usage**:
```bash
export AGENTFUL_FEATURE="search-api"
node bin/hooks/post-feature.js
```

### 5. Health Check Hook (`health-check.js`)

**Purpose**: Comprehensive startup health check for agentful

**When to invoke**: On system startup, before any agent invocation

**Environment Variables**: None

**Checks**:
- `.agentful/` directory exists
- Core state files exist and are valid JSON
- `.claude/` directory structure is complete
- All core agents exist
- Product specification exists
- Settings file is valid
- Architecture has been analyzed
- Node.js version meets requirements (>=22.0.0)

**Return Codes**:
- `0` - System ready (may have warnings)

**Example Usage**:
```bash
node bin/hooks/health-check.js
```

### 6. Analyze Trigger Hook (`analyze-trigger.js`)

**Purpose**: Suggests running `/agentful-analyze` when critical files change

**When to invoke**: After file modifications (via git hooks or file watchers)

**Environment Variables**:
- `FILE` - Path to the changed file

**Triggers suggestions for**:
- `package.json` - Dependency changes
- `architecture.json` - Architecture updates
- `tsconfig.json` / `jsconfig.json` - TypeScript/JavaScript config
- Build configs (vite, webpack, rollup, next)
- Environment templates (`.env.example`, `.env.sample`)
- Docker configs (`Dockerfile`, `docker-compose.yml`)

**Return Codes**:
- `0` - Always succeeds (informational only)

**Example Usage**:
```bash
export FILE="package.json"
node bin/hooks/analyze-trigger.js
```

## Implementation Details

### Technical Architecture

The Node.js hooks use:
- **ES Modules** - Leverages `"type": "module"` from package.json
- **Built-in modules only** - `fs`, `path`, `child_process` (no external dependencies)
- **Cross-platform paths** - Uses `path` module for proper path handling
- **Environment variables** - `process.env` for configuration
- **Exit codes** - `process.exit(0/1)` for proper shell integration
- **JSON parsing** - Native `JSON.parse()` for validation and querying
- **Command execution** - `execSync` for running npm scripts and git commands

### File Structure

```
bin/hooks/
├── pre-agent.js          # Agent precondition validation
├── post-agent.js         # Agent metrics tracking
├── pre-feature.js        # Feature readiness validation
├── post-feature.js       # Feature completion validation
├── health-check.js       # System health check
├── analyze-trigger.js    # Analysis suggestion trigger
└── README.md             # This file
```

All hooks are executable (`chmod +x`) and can be invoked directly or via `node`.

## Metrics Structure

`.agentful/agent-metrics.json`:
```json
{
  "invocations": {
    "backend": 15,
    "frontend": 12,
    "tester": 8
  },
  "last_invocation": {
    "agent": "backend",
    "timestamp": "2026-01-20T10:30:00Z",
    "feature": "login",
    "domain": "authentication"
  },
  "feature_hooks": [
    {
      "hook": "PreFeature",
      "feature": "login",
      "domain": "auth",
      "timestamp": "2026-01-20T10:25:00Z",
      "result": "passed"
    },
    {
      "hook": "PostFeature",
      "feature": "login",
      "domain": "auth",
      "timestamp": "2026-01-20T10:35:00Z",
      "result": "passed"
    }
  ]
}
```

## Integration Examples

### From Orchestrator Agent

```javascript
// Before delegating to an agent
const preAgentCheck = await Bash({
  command: `AGENTFUL_AGENT="${agentName}" AGENTFUL_FEATURE="${featureName}" node bin/hooks/pre-agent.js`,
  description: "Validate agent preconditions"
});

if (preAgentCheck.exit_code !== 0) {
  // Handle validation failure
  return "Pre-agent validation failed. Cannot proceed.";
}

// Delegate to agent
await Task({
  agent: agentName,
  task: "Implement feature..."
});

// After agent completes
await Bash({
  command: `AGENTFUL_AGENT="${agentName}" AGENTFUL_FEATURE="${featureName}" node bin/hooks/post-agent.js`,
  description: "Track agent metrics"
});
```

### From CLI Commands

```javascript
// In /agentful-start command
await Bash({
  command: 'node bin/hooks/health-check.js',
  description: "System health check"
});
```

### From Git Hooks

```bash
# .git/hooks/post-checkout
#!/bin/bash
FILE="package.json"
if git diff --name-only HEAD@{1} HEAD | grep -q "$FILE"; then
  export FILE="$FILE"
  node bin/hooks/analyze-trigger.js
fi
```

### From CI/CD Pipelines

```yaml
# GitHub Actions example
steps:
  - name: Pre-feature validation
    run: |
      export AGENTFUL_FEATURE="api-auth"
      export AGENTFUL_DOMAIN="backend"
      node bin/hooks/pre-feature.js

  - name: Run feature implementation
    run: |
      # Your implementation steps

  - name: Post-feature validation
    run: |
      export AGENTFUL_FEATURE="api-auth"
      export AGENTFUL_DOMAIN="backend"
      node bin/hooks/post-feature.js
```

## Testing

To test a hook manually:

```bash
# Test pre-agent validation
export AGENTFUL_AGENT="backend"
export AGENTFUL_FEATURE="test-feature"
node bin/hooks/pre-agent.js
echo "Exit code: $?"

# Test health check
node bin/hooks/health-check.js

# Test with invalid state (should fail)
mv .agentful/state.json .agentful/state.json.bak
export AGENTFUL_AGENT="backend"
node bin/hooks/pre-agent.js
echo "Exit code: $?" # Should be 1
mv .agentful/state.json.bak .agentful/state.json

# Test post-agent metrics
export AGENTFUL_AGENT="tester"
export AGENTFUL_FEATURE="unit-tests"
node bin/hooks/post-agent.js
cat .agentful/agent-metrics.json # Verify metrics updated
```

## Troubleshooting

### Hook Not Executing

If a hook doesn't execute:
1. Verify Node.js version: `node --version` (must be >=22.0.0)
2. Check file permissions: `ls -la bin/hooks/` (should be executable)
3. Make executable: `chmod +x bin/hooks/*.js`
4. Verify environment variables are set: `echo $AGENTFUL_AGENT`

### Exit Code Issues

Hooks use standard exit codes:
- `0` = Success (proceed)
- `1` = Failure (block)

Check exit code in shell:
```bash
node bin/hooks/pre-agent.js
echo $? # Shows exit code
```

### JSON Parse Errors

If you see JSON parse errors:
1. Validate JSON files: `node -e "JSON.parse(require('fs').readFileSync('.agentful/state.json'))"`
2. Check file encoding (must be UTF-8)
3. Look for trailing commas or syntax errors

## See Documentation

For complete documentation, usage examples, and integration guide, see:
- Orchestrator integration instructions in `.claude/agents/orchestrator.md`
- Individual hook script headers for detailed behavior
- Main documentation at `docs/`
