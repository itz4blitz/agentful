# MCP Inspector Tests - Quick Start

## Run Tests

```bash
# All tests (recommended)
./run-inspector-tests.sh

# Individual suites
./test-tools.sh        # 24 tool tests
./test-resources.sh    # 10 resource tests
./test-errors.sh       # 10 error tests

# Validate setup
./validate-test-suite.sh
```

## Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| **Tools** | 24 | All 8 tools + error cases |
| **Resources** | 10 | All 5 resources + templates |
| **Errors** | 10 | Edge cases + validation |
| **Total** | **44** | **Comprehensive** |

## Tools Tested

1. `launch_specialist` - Launch specialist agents
2. `get_status` - Get current development status
3. `update_progress` - Update progress tracking
4. `run_validation` - Run quality gates
5. `resolve_decision` - Resolve pending decisions
6. `analyze_architecture` - Analyze codebase
7. `generate_agents` - Generate specialist agents
8. `manage_state` - State management operations

## Resources Tested

1. `agentful://product/spec` - Product specification
2. `agentful://state/current` - Current state
3. `agentful://completion` - Completion metrics
4. `agentful://decisions` - Pending decisions
5. `agentful://agents/list` - Agent list
6. `agentful://agents/{name}` - Specific agent

## Output Files

- `test-results-tools.json` - Tool test results
- `test-results-resources.json` - Resource test results
- `test-results-errors.json` - Error test results
- `test-report.json` - Combined summary

## Requirements

- Node.js ≥22.0.0
- jq (optional, for JSON parsing)
- @modelcontextprotocol/inspector (auto-installed)

## Exit Codes

- `0` - All tests passed ✓
- `1` - One or more tests failed ✗

## Example Output

```
╔════════════════════════════════════════════╗
║  MCP Inspector Test Suite                 ║
║  Testing agentful MCP Server               ║
╚════════════════════════════════════════════╝

=== Running: Tool Tests ===

Testing launch_specialist... PASS
Testing get_status... PASS
Testing update_progress... PASS
...

Total Tests:    44
Passed:         44
Failed:         0
Success Rate:   100.0%
Duration:       3s

✓ All tests passed!
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Permission denied | `chmod +x *.sh` |
| jq not found | `brew install jq` |
| Inspector missing | `npm install -g @modelcontextprotocol/inspector` |
| Tests hang | Kill orphaned processes: `killall node` |

## CI/CD Integration

```yaml
# GitHub Actions
- name: MCP Inspector Tests
  run: |
    cd test/inspector
    ./run-inspector-tests.sh
```

---

For full documentation, see [README.md](README.md)
