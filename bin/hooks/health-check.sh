#!/bin/bash

# health-check.sh
# Lightweight startup health check for agentful

# Exit early on any error
set -e

# Check if .agentful directory exists
if [ ! -d ".agentful" ]; then
  echo "Agentful not initialized. Run: npx @itz4blitz/agentful init"
  exit 0
fi

# Check if this is a fresh init (no architecture.json means analysis hasn't run)
if [ ! -f ".agentful/architecture.json" ]; then
  echo "Agentful initialized but not analyzed."
  echo ""
  echo "Run /agentful-generate to:"
  echo "  - Detect your tech stack"
  echo "  - Discover business domains"
  echo "  - Generate specialized agents and skills"
  exit 0
fi

# Check for generated agents
AGENT_COUNT=$(find .claude/agents -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
SKILL_COUNT=$(find .claude/skills -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')

if [ "$AGENT_COUNT" -lt 3 ] || [ "$SKILL_COUNT" -lt 1 ]; then
  echo "Agentful ready. Consider running /agentful-generate to generate more agents/skills."
  exit 0
fi

echo "Agentful ready."
exit 0
