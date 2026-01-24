#!/bin/bash
# Validate Test Suite Structure
# Quick sanity check that all test files are in place

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}Validating MCP Inspector Test Suite...${NC}\n"

CHECKS=0
PASSED=0

# Check files exist
check_file() {
  local file="$1"
  local description="$2"
  CHECKS=$((CHECKS + 1))

  echo -ne "  Checking $description... "
  if [ -f "$file" ]; then
    echo -e "${GREEN}OK${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}MISSING${NC}"
  fi
}

# Check executable
check_executable() {
  local file="$1"
  local description="$2"
  CHECKS=$((CHECKS + 1))

  echo -ne "  Checking $description... "
  if [ -x "$file" ]; then
    echo -e "${GREEN}OK${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}NOT EXECUTABLE${NC}"
  fi
}

echo "Test Scripts:"
check_executable "$SCRIPT_DIR/run-inspector-tests.sh" "Main test runner"
check_executable "$SCRIPT_DIR/test-tools.sh" "Tool tests"
check_executable "$SCRIPT_DIR/test-resources.sh" "Resource tests"
check_executable "$SCRIPT_DIR/test-errors.sh" "Error tests"

echo -e "\nDocumentation:"
check_file "$SCRIPT_DIR/README.md" "README"

echo -e "\nTest Fixtures:"
check_file "$SCRIPT_DIR/fixtures/valid-tool-args.json" "Valid args"
check_file "$SCRIPT_DIR/fixtures/invalid-tool-args.json" "Invalid args"
check_file "$SCRIPT_DIR/fixtures/expected-resources.json" "Expected resources"

echo -e "\nDependencies:"
CHECKS=$((CHECKS + 1))
echo -ne "  Checking Node.js... "
if command -v node &> /dev/null; then
  echo -e "${GREEN}OK${NC} ($(node --version))"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}NOT FOUND${NC}"
fi

CHECKS=$((CHECKS + 1))
echo -ne "  Checking jq... "
if command -v jq &> /dev/null; then
  echo -e "${GREEN}OK${NC} ($(jq --version))"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}NOT FOUND${NC} (optional, for JSON parsing)"
  PASSED=$((PASSED + 1))  # Don't fail on missing jq
fi

echo -e "\n${YELLOW}Validation Summary:${NC}"
echo "  Total checks: $CHECKS"
echo -e "  Passed: ${GREEN}$PASSED${NC}"
echo -e "  Failed: ${RED}$((CHECKS - PASSED))${NC}"

if [ $PASSED -eq $CHECKS ]; then
  echo -e "\n${GREEN}✓ Test suite is ready!${NC}"
  echo -e "\nRun tests with: ${BLUE}./run-inspector-tests.sh${NC}\n"
  exit 0
else
  echo -e "\n${RED}✗ Some checks failed${NC}\n"
  exit 1
fi
