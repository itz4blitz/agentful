# MCP Inspector Test Suite

Comprehensive automated tests for the agentful MCP server using MCP Inspector CLI mode.

## Overview

This test suite validates all MCP tools, resources, and error handling using the MCP Inspector in CLI mode. Tests are organized into three categories:

- **Tool Tests** - All 8 MCP tools with valid/invalid inputs
- **Resource Tests** - All 5 MCP resources
- **Error Tests** - Error handling and edge cases

## Quick Start

```bash
# Run all tests
./run-inspector-tests.sh

# Run specific test suite
./test-tools.sh        # Tool tests only
./test-resources.sh    # Resource tests only
./test-errors.sh       # Error tests only
```

## Test Coverage

### Tools (24 tests)

1. **launch_specialist**
   - Valid: Launch backend agent with task
   - Invalid: Missing required `agent` parameter
   - Invalid: Unknown agent name

2. **get_status**
   - Valid: Get current status
   - Valid: Extra parameters ignored

3. **update_progress**
   - Valid: Update with phase, percent, focus
   - Invalid: Missing required fields
   - Invalid: Percent out of range (0-100)

4. **run_validation**
   - Valid: All gates (types, lint, tests, coverage, security, deadcode)
   - Valid: Single gate
   - Invalid: Unknown gate name

5. **resolve_decision**
   - Valid: Resolve with ID, choice, rationale
   - Invalid: Missing decisionId
   - Invalid: Missing choice

6. **analyze_architecture**
   - Valid: Depth 1 (shallow)
   - Valid: Depth 3 (deep)
   - Invalid: Depth too high (>5)

7. **generate_agents**
   - Valid: Without override
   - Valid: With override
   - Invalid: Wrong parameter type

8. **manage_state**
   - Valid: Get operation
   - Valid: Set operation with data
   - Valid: Reset operation
   - Invalid: Unknown operation

### Resources (10 tests)

1. **agentful://product/spec** - Product specification
2. **agentful://state/current** - Current state
3. **agentful://completion** - Completion percentage
4. **agentful://decisions** - Pending decisions
5. **agentful://agents/list** - List of agents
6. **agentful://agents/{name}** - Specific agent (valid)
7. **agentful://agents/{name}** - Non-existent agent (error)
8. **invalid://resource** - Invalid URI scheme (error)
9. **agentful://unknown/resource** - Unknown resource (error)
10. **resources/list** - List all available resources

### Error Handling (10 tests)

1. Unknown tool name
2. Unknown resource URI
3. Invalid JSON in tool args
4. Missing required parameter
5. Invalid parameter type
6. Empty args when required
7. Schema violation
8. Resource read without URI
9. Invalid JSON-RPC method
10. Extra unexpected parameters

## Test Output

### Console Output

Colorized output shows pass/fail status for each test:

```
=== MCP Tool Tests ===

Testing launch_specialist... PASS
Testing launch_specialist (invalid)... PASS
Testing get_status... PASS
...

=== Tool Test Summary ===
Total:  24
Passed: 23
Failed: 1
```

### JSON Reports

Each test suite generates a JSON report:

- `test-results-tools.json` - Tool test results
- `test-results-resources.json` - Resource test results
- `test-results-errors.json` - Error test results
- `test-report.json` - Combined summary report

Example JSON output:

```json
{
  "tests": [
    {
      "name": "launch_specialist",
      "tool": "launch_specialist",
      "args": {"agent":"backend","task":"Test"},
      "expectedSuccess": true,
      "actualSuccess": true,
      "exitCode": 0,
      "output": "..."
    }
  ]
}
```

## MCP Inspector CLI

These tests use the MCP Inspector CLI mode:

```bash
# List tools
npx @modelcontextprotocol/inspector --cli node ../bin/mcp-server.js \
  --method tools/list

# Call tool
npx @modelcontextprotocol/inspector --cli node ../bin/mcp-server.js \
  --method tools/call \
  --tool-name launch_specialist \
  --tool-args '{"agent":"backend","task":"Test"}'

# Read resource
npx @modelcontextprotocol/inspector --cli node ../bin/mcp-server.js \
  --method resources/read \
  --resource-uri "agentful://state/current"

# List resources
npx @modelcontextprotocol/inspector --cli node ../bin/mcp-server.js \
  --method resources/list
```

## Requirements

- **Node.js** ≥22.0.0
- **@modelcontextprotocol/inspector** (auto-installed)
- **jq** (for JSON parsing in bash)

Install jq:
```bash
# macOS
brew install jq

# Ubuntu/Debian
apt-get install jq

# Alpine
apk add jq
```

## Test Fixtures

The `fixtures/` directory contains test data:

- `valid-tool-args.json` - Valid tool arguments
- `invalid-tool-args.json` - Invalid tool arguments
- `expected-resources.json` - Expected resource URIs

## Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

## Integration with CI/CD

Add to your CI pipeline:

```yaml
# GitHub Actions
- name: Run MCP Inspector Tests
  run: |
    cd test/inspector
    chmod +x *.sh
    ./run-inspector-tests.sh

# GitLab CI
test:inspector:
  script:
    - cd test/inspector
    - chmod +x *.sh
    - ./run-inspector-tests.sh
```

## Troubleshooting

**Tests hang indefinitely**
- Check that MCP server is not already running
- Kill any orphaned node processes: `killall node`

**"Command not found: jq"**
- Install jq: `brew install jq` (macOS) or `apt-get install jq` (Linux)

**Inspector not found**
- Run: `npm install -g @modelcontextprotocol/inspector`

**Permission denied**
- Make scripts executable: `chmod +x *.sh`

**Server errors in output**
- Check that server path is correct: `../bin/mcp-server.js`
- Verify server can start: `node ../bin/mcp-server.js --help`

## Development

To add new tests:

1. Add test case to appropriate script (`test-tools.sh`, etc.)
2. Use helper functions: `run_tool()`, `read_resource()`, `expect_error()`
3. Set expected success: `"true"` or `"false"`
4. Run test suite to verify
5. Update this README with new test count

Example:
```bash
# In test-tools.sh
run_tool "my_new_tool" '{"param":"value"}' "true"
```

## License

MIT
