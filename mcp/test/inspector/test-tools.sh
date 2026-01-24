#!/bin/bash
# MCP Inspector - Tool Tests
# Tests all 8 MCP tools with valid and invalid inputs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_PATH="$MCP_ROOT/bin/mcp-server.js"
INSPECTOR="npx @modelcontextprotocol/inspector"

# Test results
PASSED=0
FAILED=0
TOTAL=0

# JSON output file
OUTPUT_FILE="$SCRIPT_DIR/test-results-tools.json"
echo '{"tests": [' > "$OUTPUT_FILE"
FIRST_TEST=true

# Helper: Run inspector tool call
run_tool() {
  local tool_name="$1"
  local tool_args="$2"
  local expected_success="$3"

  TOTAL=$((TOTAL + 1))
  local test_name="$tool_name"

  echo -ne "${BLUE}Testing $test_name...${NC} "

  # Run inspector
  local output
  local exit_code=0
  output=$($INSPECTOR --cli node "$SERVER_PATH" \
    --method tools/call \
    --tool-name "$tool_name" \
    --tool-args "$tool_args" 2>/dev/null) || exit_code=$?

  # Check result
  local success=false
  if [ "$expected_success" = "true" ]; then
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q '"content"'; then
      success=true
    fi
  else
    # For error cases, we expect either non-zero exit or error in output
    if [ $exit_code -ne 0 ] || echo "$output" | grep -qi 'error'; then
      success=true
    fi
  fi

  # Record result
  if [ "$success" = true ]; then
    echo -e "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi

  # Write JSON result
  if [ "$FIRST_TEST" = false ]; then
    echo ',' >> "$OUTPUT_FILE"
  fi
  FIRST_TEST=false

  cat >> "$OUTPUT_FILE" <<EOF
  {
    "name": "$test_name",
    "tool": "$tool_name",
    "args": $tool_args,
    "expectedSuccess": $expected_success,
    "actualSuccess": $success,
    "exitCode": $exit_code,
    "output": $(echo "$output" | jq -Rs .)
  }
EOF
}

echo -e "${YELLOW}=== MCP Tool Tests ===${NC}\n"

# Test 1: launch_specialist (valid)
run_tool "launch_specialist" '{"agent":"backend","task":"Implement user authentication"}' "true"

# Test 2: launch_specialist (invalid - missing agent)
run_tool "launch_specialist" '{"task":"Do something"}' "false"

# Test 3: launch_specialist (invalid - unknown agent)
run_tool "launch_specialist" '{"agent":"unknown_agent","task":"Test"}' "false"

# Test 4: get_status (valid)
run_tool "get_status" '{}' "true"

# Test 5: get_status (invalid - extra params)
run_tool "get_status" '{"invalid":"param"}' "true"  # Should still work, extra params ignored

# Test 6: update_progress (valid)
run_tool "update_progress" '{"phase":"implementation","percentComplete":50,"currentFocus":"Building API"}' "true"

# Test 7: update_progress (invalid - missing required field)
run_tool "update_progress" '{"phase":"implementation"}' "false"

# Test 8: update_progress (invalid - percent out of range)
run_tool "update_progress" '{"phase":"implementation","percentComplete":150,"currentFocus":"Test"}' "false"

# Test 9: run_validation (valid - all gates)
run_tool "run_validation" '{"gates":["types","lint","tests","coverage","security","deadcode"]}' "true"

# Test 10: run_validation (valid - single gate)
run_tool "run_validation" '{"gates":["types"]}' "true"

# Test 11: run_validation (invalid - unknown gate)
run_tool "run_validation" '{"gates":["unknown_gate"]}' "false"

# Test 12: resolve_decision (valid)
run_tool "resolve_decision" '{"decisionId":"dec_001","choice":"option_a","rationale":"Best approach"}' "true"

# Test 13: resolve_decision (invalid - missing decisionId)
run_tool "resolve_decision" '{"choice":"option_a"}' "false"

# Test 14: resolve_decision (invalid - missing choice)
run_tool "resolve_decision" '{"decisionId":"dec_001"}' "false"

# Test 15: analyze_architecture (valid - depth 1)
run_tool "analyze_architecture" '{"depth":1}' "true"

# Test 16: analyze_architecture (valid - depth 3)
run_tool "analyze_architecture" '{"depth":3}' "true"

# Test 17: analyze_architecture (invalid - depth too high)
run_tool "analyze_architecture" '{"depth":10}' "false"

# Test 18: generate_agents (valid - no override)
run_tool "generate_agents" '{"override":false}' "true"

# Test 19: generate_agents (valid - with override)
run_tool "generate_agents" '{"override":true}' "true"

# Test 20: generate_agents (invalid - wrong type)
run_tool "generate_agents" '{"override":"yes"}' "false"

# Test 21: manage_state (valid - get)
run_tool "manage_state" '{"operation":"get"}' "true"

# Test 22: manage_state (valid - set)
run_tool "manage_state" '{"operation":"set","phase":"implementation","data":{"progress":50}}' "true"

# Test 23: manage_state (valid - reset)
run_tool "manage_state" '{"operation":"reset"}' "true"

# Test 24: manage_state (invalid - unknown operation)
run_tool "manage_state" '{"operation":"delete"}' "false"

# Close JSON array
echo '' >> "$OUTPUT_FILE"
echo ']}' >> "$OUTPUT_FILE"

# Summary
echo -e "\n${YELLOW}=== Tool Test Summary ===${NC}"
echo -e "Total:  $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "\nResults saved to: $OUTPUT_FILE"

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
