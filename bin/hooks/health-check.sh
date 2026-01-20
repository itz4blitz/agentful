#!/bin/bash

# health-check.sh
# Lightweight startup health check for agentful

# Exit early on any error
set -e

# Check if .agentful directory exists
if [ ! -d ".agentful" ]; then
  echo "Agentful not initialized. Run /agentful-start to set up."
  exit 0
fi

# Check for critical files
WARNINGS=()

if [ ! -f ".agentful/architecture.json" ]; then
  WARNINGS+=("Architecture config missing. Run /agentful-analyze to detect tech stack.")
fi

if [ ! -f "package.json" ] && [ ! -f "pyproject.toml" ] && [ ! -f "go.mod" ] && [ ! -f "Cargo.toml" ]; then
  WARNINGS+=("No package manager config found. Project structure unclear.")
fi

# Output any warnings
if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "Agentful Health Check:"
  for warning in "${WARNINGS[@]}"; do
    echo "  - $warning"
  done
else
  echo "Agentful ready."
fi

exit 0
