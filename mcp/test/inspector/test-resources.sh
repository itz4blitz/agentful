#!/bin/bash
# MCP Inspector - Resource Tests
# Tests all 5 MCP resources

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
OUTPUT_FILE="$SCRIPT_DIR/test-results-resources.json"
echo '{"tests": [' > "$OUTPUT_FILE"
FIRST_TEST=true

# Helper: Run inspector resource read
read_resource() {
  local uri="$1"
  local expected_success="$2"

  TOTAL=$((TOTAL + 1))
  local test_name="$uri"

  echo -ne "${BLUE}Reading $test_name...${NC} "

  # Run inspector
  local output
  local exit_code=0
  output=$($INSPECTOR --cli node "$SERVER_PATH" \
    --method resources/read \
    --resource-uri "$uri" 2>/dev/null) || exit_code=$?

  # Check result
  local success=false
  if [ "$expected_success" = "true" ]; then
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q '"contents"'; then
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
    "uri": "$uri",
    "expectedSuccess": $expected_success,
    "actualSuccess": $success,
    "exitCode": $exit_code,
    "output": $(echo "$output" | jq -Rs .)
  }
EOF
}

echo -e "${YELLOW}=== MCP Resource Tests ===${NC}\n"

# Test list resources first
echo -ne "${BLUE}Listing all resources...${NC} "
list_output=$($INSPECTOR --cli node "$SERVER_PATH" --method resources/list 2>/dev/null) || true
if echo "$list_output" | grep -q '"resources"'; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC}"
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 1: agentful://product/spec
read_resource "agentful://product/spec" "true"

# Test 2: agentful://state/current
read_resource "agentful://state/current" "true"

# Test 3: agentful://completion
read_resource "agentful://completion" "true"

# Test 4: agentful://decisions
read_resource "agentful://decisions" "true"

# Test 5: agentful://agents/list
read_resource "agentful://agents/list" "true"

# Test 6: agentful://agents/{name} - valid agent
read_resource "agentful://agents/orchestrator" "true"

# Test 7: agentful://agents/{name} - non-existent agent
read_resource "agentful://agents/nonexistent" "false"

# Test 8: Invalid URI scheme
read_resource "invalid://resource" "false"

# Test 9: Unknown resource
read_resource "agentful://unknown/resource" "false"

# Close JSON array
echo '' >> "$OUTPUT_FILE"
echo ']}' >> "$OUTPUT_FILE"

# Summary
echo -e "\n${YELLOW}=== Resource Test Summary ===${NC}"
echo -e "Total:  $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "\nResults saved to: $OUTPUT_FILE"

if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
