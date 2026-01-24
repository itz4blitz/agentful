#!/bin/bash
# MCP Inspector Test Suite
# Main test runner for all MCP Inspector CLI tests

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Test results
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_TESTS=0

# Start timestamp
START_TIME=$(date +%s)

echo -e "${CYAN}${BOLD}"
echo "╔════════════════════════════════════════════╗"
echo "║  MCP Inspector Test Suite                 ║"
echo "║  Testing agentful MCP Server               ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Check if MCP Inspector is available
echo -ne "${BLUE}Checking dependencies...${NC} "
if ! command -v npx &> /dev/null; then
  echo -e "${RED}FAIL${NC}"
  echo "Error: npx not found. Please install Node.js."
  exit 1
fi

if ! npx @modelcontextprotocol/inspector --version &> /dev/null; then
  echo -e "${YELLOW}Installing MCP Inspector...${NC}"
  npm install -g @modelcontextprotocol/inspector
fi
echo -e "${GREEN}OK${NC}\n"

# Function to run a test suite
run_suite() {
  local suite_name="$1"
  local suite_script="$2"

  echo -e "${YELLOW}${BOLD}=== Running: $suite_name ===${NC}\n"

  local exit_code=0
  "$suite_script" || exit_code=$?

  # Parse results from JSON
  local results_file="${suite_script%.sh}-results-${suite_script##*-}"
  results_file="${results_file%.sh}.json"

  if [ -f "$SCRIPT_DIR/test-results-${suite_script##*/test-}.json" ]; then
    local json_file="$SCRIPT_DIR/test-results-${suite_script##*/test-}.json"
    local passed=$(jq '.tests | map(select(.actualSuccess == true or .gotError == true)) | length' "$json_file" 2>/dev/null || echo "0")
    local total=$(jq '.tests | length' "$json_file" 2>/dev/null || echo "0")
    local failed=$((total - passed))

    TOTAL_PASSED=$((TOTAL_PASSED + passed))
    TOTAL_FAILED=$((TOTAL_FAILED + failed))
    TOTAL_TESTS=$((TOTAL_TESTS + total))
  fi

  echo ""
  return $exit_code
}

# Run all test suites
SUITE_FAILURES=0

run_suite "Tool Tests" "$SCRIPT_DIR/test-tools.sh" || SUITE_FAILURES=$((SUITE_FAILURES + 1))
run_suite "Resource Tests" "$SCRIPT_DIR/test-resources.sh" || SUITE_FAILURES=$((SUITE_FAILURES + 1))
run_suite "Error Handling Tests" "$SCRIPT_DIR/test-errors.sh" || SUITE_FAILURES=$((SUITE_FAILURES + 1))

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate combined report
REPORT_FILE="$SCRIPT_DIR/test-report.json"
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "duration": $DURATION,
  "summary": {
    "total": $TOTAL_TESTS,
    "passed": $TOTAL_PASSED,
    "failed": $TOTAL_FAILED,
    "successRate": $(awk "BEGIN {printf \"%.2f\", ($TOTAL_PASSED/$TOTAL_TESTS)*100}")
  },
  "suites": {
    "tools": {
      "file": "test-results-tools.json"
    },
    "resources": {
      "file": "test-results-resources.json"
    },
    "errors": {
      "file": "test-results-errors.json"
    }
  }
}
EOF

# Print final summary
echo -e "${CYAN}${BOLD}"
echo "╔════════════════════════════════════════════╗"
echo "║           Test Summary                     ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "Total Tests:    ${BOLD}$TOTAL_TESTS${NC}"
echo -e "Passed:         ${GREEN}${BOLD}$TOTAL_PASSED${NC}"
echo -e "Failed:         ${RED}${BOLD}$TOTAL_FAILED${NC}"
echo -e "Success Rate:   ${BOLD}$(awk "BEGIN {printf \"%.1f%%\", ($TOTAL_PASSED/$TOTAL_TESTS)*100}")${NC}"
echo -e "Duration:       ${BOLD}${DURATION}s${NC}"
echo ""
echo -e "Full report:    ${BLUE}$REPORT_FILE${NC}"
echo ""

# Exit with appropriate code
if [ $TOTAL_FAILED -eq 0 ]; then
  echo -e "${GREEN}${BOLD}✓ All tests passed!${NC}\n"
  exit 0
else
  echo -e "${RED}${BOLD}✗ Some tests failed${NC}\n"
  exit 1
fi
