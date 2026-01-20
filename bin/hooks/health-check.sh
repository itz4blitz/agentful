#!/bin/bash
# health-check.sh
# Comprehensive startup health check for agentful

set -e

ERRORS=0
WARNINGS=0

# === CRITICAL CHECKS (must pass) ===

# Check 1: .agentful directory
if [ ! -d ".agentful" ]; then
  echo "❌ Agentful not initialized."
  echo "   Run: npx @itz4blitz/agentful init"
  exit 0
fi

# Check 2: Core state files
for file in state.json completion.json decisions.json; do
  if [ ! -f ".agentful/$file" ]; then
    echo "❌ Missing .agentful/$file"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check 3: .claude directory structure
for dir in agents commands product skills; do
  if [ ! -d ".claude/$dir" ]; then
    echo "❌ Missing .claude/$dir/"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check 4: Core agents
for agent in orchestrator backend frontend tester reviewer fixer architect product-analyzer; do
  if [ ! -f ".claude/agents/$agent.md" ]; then
    echo "❌ Missing core agent: .claude/agents/$agent.md"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check 5: Product specification
if [ ! -f ".claude/product/index.md" ]; then
  if ! find ".claude/product/domains" -name "index.md" 2>/dev/null | grep -q .; then
    echo "⚠️  No product specification found"
    echo "   Create .claude/product/index.md or run /agentful-product"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Check 6: Settings file
if [ ! -f ".claude/settings.json" ]; then
  echo "❌ Missing .claude/settings.json"
  ERRORS=$((ERRORS + 1))
elif ! command -v jq &> /dev/null; then
  # jq not available, skip JSON validation
  :
elif ! jq empty ".claude/settings.json" 2>/dev/null; then
  echo "❌ Invalid JSON in .claude/settings.json"
  ERRORS=$((ERRORS + 1))
fi

# === WARNING CHECKS (nice to have) ===

# Check: Architecture analysis
if [ ! -f ".agentful/architecture.json" ]; then
  echo "⚠️  Tech stack not analyzed. Run /agentful-generate to:"
  echo "   - Detect your tech stack"
  echo "   - Discover business domains"
  echo "   - Generate specialized agents"
  WARNINGS=$((WARNINGS + 1))
elif command -v jq &> /dev/null; then
  if ! jq -e '.techStack and .domains' .agentful/architecture.json >/dev/null 2>&1; then
    echo "⚠️  .agentful/architecture.json is malformed"
    echo "   Run /agentful-generate to regenerate"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Check: Node version
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//')
  if [ -n "$NODE_VERSION" ]; then
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
    if [ "$MAJOR_VERSION" -lt 22 ]; then
      echo "⚠️  Node.js $NODE_VERSION detected. Requires >=22.0.0"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
fi

# === SUMMARY ===

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Found $ERRORS critical issue(s)"
  echo "   Run: npx @itz4blitz/agentful init"
  exit 0
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo "⚠️  Agentful ready with $WARNINGS warning(s)"
else
  echo "✅ Agentful ready"
fi

exit 0
