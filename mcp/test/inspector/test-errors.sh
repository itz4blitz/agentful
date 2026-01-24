#!/bin/bash
# MCP Inspector - Error Handling Tests
# Tests error scenarios and edge cases

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
OUTPUT_FILE="$SCRIPT_DIR/test-results-errors.json"
echo '{"tests": [' > "$OUTPUT_FILE"
FIRST_TEST=true

# Helper: Test that expects an error
expect_error() {
  local test_name="$1"
  local command="$2"

  TOTAL=$((TOTAL + 1))

  echo -ne "${BLUE}Testing $test_name...${NC} "

  # Run command and expect failure
  local output
  local exit_code=0
  output=$(eval "$command" 2>&1) || exit_code=$?

  # Success if we got an error
  local success=false
  if [ $exit_code -ne 0 ] || echo "$output" | grep -qi 'error'; then
    success=true
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
    "expectedError": true,
    "gotError": $success,
    "exitCode": $exit_code,
    "output": $(echo "$output" | jq -Rs .)
  }
EOF
}

echo -e "${YELLOW}=== MCP Error Handling Tests ===${NC}\n"

# Test 1: Unknown tool name
expect_error "Unknown tool" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'nonexistent_tool' --tool-args '{}'"

# Test 2: Unknown resource URI
expect_error "Unknown resource" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method resources/read --resource-uri 'agentful://unknown'"

# Test 3: Invalid JSON in tool args
expect_error "Invalid JSON args" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'get_status' --tool-args '{invalid json}'"

# Test 4: Missing required tool parameter
expect_error "Missing required param" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'launch_specialist' --tool-args '{}'"

# Test 5: Invalid parameter type
expect_error "Invalid param type" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'update_progress' --tool-args '{\"phase\":\"impl\",\"percentComplete\":\"fifty\"}'"

# Test 6: Empty tool args when required
expect_error "Empty args" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'resolve_decision'"

# Test 7: Tool with wrong schema
expect_error "Schema violation" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'analyze_architecture' --tool-args '{\"depth\":-1}'"

# Test 8: Resource read without URI
expect_error "Missing URI" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method resources/read"

# Test 9: Invalid method name
expect_error "Invalid method" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method 'invalid/method'"

# Test 10: Extra unexpected parameters
expect_error "Extra params" \
  "$INSPECTOR --cli node '$SERVER_PATH' --method tools/call --tool-name 'get_status' --tool-args '{\"unexpected\":\"param\",\"another\":123}'"

# Close JSON array
echo '' >> "$OUTPUT_FILE"
echo ']}' >> "$OUTPUT_FILE"

# Summary
echo -e "\n${YELLOW}=== Error Test Summary ===${NC}"
echo -e "Total:  $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "\nResults saved to: $OUTPUT_FILE"

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
