# Agentful Hooks

This directory contains hook scripts that enhance Claude Code's behavior with agentful.

## Scripts

### `analyze-trigger.sh`

**Purpose**: Suggests running `/agentful-analyze` when key configuration files change.

**Triggers on**:
- `package.json` (root only, excludes node_modules)
- `architecture.json`
- `tsconfig.json` / `jsconfig.json`
- Build configs: `vite.config.*`, `webpack.config.*`, `rollup.config.*`, `next.config.*`
- Environment templates: `.env.example`, `.env.sample`
- Docker files: `docker-compose.yml`, `Dockerfile`

**Behavior**:
- Runs on PostToolUse for Write/Edit operations
- Exits silently for non-matching files
- Outputs suggestion message for matching files
- Timeout: 3 seconds

**Usage**: Automatically triggered by hooks. Can be tested manually:
```bash
FILE="package.json" bash bin/hooks/analyze-trigger.sh
```

### `health-check.sh`

**Purpose**: Performs lightweight startup checks for agentful configuration.

**Checks**:
- `.agentful/` directory exists
- `architecture.json` exists
- Project has a package manager config (package.json, pyproject.toml, go.mod, or Cargo.toml)

**Behavior**:
- Runs on SessionStart
- Outputs "Agentful ready." if all checks pass
- Lists warnings for missing components
- Always exits with code 0 (non-blocking)
- Timeout: 5 seconds

**Usage**: Automatically triggered on session start. Can be tested manually:
```bash
bash bin/hooks/health-check.sh
```

## Hook Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash bin/hooks/health-check.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash bin/hooks/analyze-trigger.sh",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

## Design Principles

1. **Fast**: All hooks complete in under 5 seconds
2. **Non-blocking**: Always exit with code 0 to avoid interrupting workflow
3. **Helpful**: Provide actionable suggestions, not errors
4. **Smart**: Only trigger on relevant files (exclude node_modules, etc.)
5. **Lightweight**: No heavy analysis, just quick checks and suggestions

## Adding New Hooks

When adding new hooks:

1. Keep execution time under 10 seconds
2. Use `set -e` and proper error handling
3. Exit with code 0 for success (non-blocking)
4. Output clear, actionable messages
5. Test edge cases (missing files, node_modules, etc.)
6. Document the hook in this README
7. Update `.claude/settings.json` with appropriate timeout

## Testing

Test hooks manually before committing:

```bash
# Test analyze-trigger with different files
FILE="package.json" bash bin/hooks/analyze-trigger.sh
FILE="node_modules/pkg/package.json" bash bin/hooks/analyze-trigger.sh
FILE="src/index.ts" bash bin/hooks/analyze-trigger.sh

# Test health-check
bash bin/hooks/health-check.sh

# Validate JSON
jq empty .claude/settings.json
```
