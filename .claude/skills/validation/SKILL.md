---
name: validation
description: Runs production readiness validation checks. Includes TypeScript, linting, tests, coverage, security, and dead code detection.
model: sonnet
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Validation Skill

This skill runs all production readiness validation checks.

## Check Sequence

Run all checks in order. Don't skip any.

### 1. TypeScript Type Check

```bash
npx tsc --noEmit
```

**Exit code**: 0 = pass, non-zero = fail

**Report**:
```json
{
  "name": "typescript",
  "passed": true,
  "error_count": 0,
  "files_checked": 47
}
```

### 2. Lint Check

```bash
npm run lint 2>&1 || true
```

**Exit code**: 0 = pass, non-zero = fail

**Report**:
```json
{
  "name": "lint",
  "passed": true,
  "error_count": 0,
  "warning_count": 3
}
```

### 3. Dead Code Detection

Try multiple tools in order:

```bash
# Try knip first
npx knip --reporter json 2>/dev/null && exit 0

# Fall back to ts-prune
npx ts-prune 2>/dev/null && exit 0

# Manual grep check as fallback
grep -r "export.*function\|export.*class\|export.*const\|export.*interface\|export.*type" \
  src/ --include="*.ts" --include="*.tsx" -h | \
  while IFS=: read -r file line; do
    export_name=$(echo "$line" | grep -oE "(export|const|function|class|interface|type)\s+\w+" | tail -1 | awk '{print $2}');
    if [ -n "$export_name" ]; then
      usage_count=$(grep -r "$export_name" src/ --include="*.ts" --include="*.tsx" | grep -v "export.*$export_name" | wc -l);
      if [ "$usage_count" -eq 0 ]; then
        echo "$file: Unused export '$export_name'";
      fi;
    fi;
  done
```

**Report**:
```json
{
  "name": "dead_code",
  "passed": false,
  "issues": [
    {
      "type": "unused_export",
      "file": "src/utils/date.ts",
      "name": "formatDate"
    },
    {
      "type": "unused_file",
      "file": "src/components/OldWidget.tsx"
    }
  ]
}
```

### 4. Test Check

```bash
npm test 2>&1 || true
```

**Exit code**: 0 = pass

**Report**:
```json
{
  "name": "tests",
  "passed": true,
  "test_count": 47,
  "failed": 0,
  "skipped": 2
}
```

### 5. Coverage Check

```bash
npm test -- --coverage --reporter=json 2>&1 || true
```

**Check threshold**: 80%

**Report**:
```json
{
  "name": "coverage",
  "passed": false,
  "actual": 72.3,
  "required": 80,
  "diff": -7.7,
  "by_file": {
    "src/services/auth.service.ts": 65,
    "src/components/Button.tsx": 100,
    "src/utils/format.ts": 50
  }
}
```

### 6. Security Check

```bash
# npm audit
npm audit --production --json 2>/dev/null || true

# Check for secrets
grep -rE "(password|secret|token|api_key|apikey)\s*[:=]\s*['\"][^'\"]{10,}['\"]" \
  src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -n || true

# Check for console.log
grep -rn "console\.(log|debug|warn)" \
  src/ --include="*.ts" --include="*.tsx" | head -20 || true

# Check for @ts-ignore
grep -rn "@ts-ignore\|@ts-nocheck" \
  src/ --include="*.ts" --include="*.tsx" || true
```

**Report**:
```json
{
  "name": "security",
  "passed": false,
  "vulnerabilities": {
    "critical": 0,
    "high": 0,
    "moderate": 2,
    "low": 5
  },
  "issues": [
    {
      "type": "console_log",
      "file": "src/auth/login.ts",
      "line": 45
    },
    {
      "type": "hardcoded_secret",
      "file": "src/config/api.ts",
      "line": 12
    }
  ]
}
```

## Final Report

```json
{
  "timestamp": "2026-01-18T00:00:00Z",
  "overall": "failed",
  "checks": {
    "typescript": { "passed": true },
    "lint": { "passed": true },
    "dead_code": { "passed": false, "issues": 3 },
    "tests": { "passed": true },
    "coverage": { "passed": false, "actual": 72 },
    "security": { "passed": false, "issues": 2 }
  },
  "must_fix": [
    "Remove unused export: formatDate in src/utils/date.ts",
    "Delete unused file: src/components/OldWidget.tsx",
    "Remove unused dependency: lodash",
    "Add tests to reach 80% coverage",
    "Remove console.log from src/auth/login.ts:45",
    "Fix hardcoded secret in src/config/api.ts:12"
  ],
  "can_ignore": [
    "npm audit moderate vulnerabilities (transitive dependencies)"
  ]
}
```

## Save Report

```bash
# Write to .agentful/last-validation.json
cat > .agentful/last-validation.json << EOF
{...report json...}
EOF
```

## Gates Configuration

Update `.agentful/completion.json`:

```json
{
  "gates": {
    "tests_passing": true,
    "no_type_errors": true,
    "no_dead_code": false,
    "coverage_80": false,
    "security_clean": false
  }
}
```

## Quick Validation

For faster feedback, skip to specific checks:

```bash
# Type check only
npx tsc --noEmit

# Tests only
npm test

# Coverage only
npm test -- --coverage
```

## Continuous Integration

In CI/CD pipeline:

```bash
# Run all checks, exit on failure
set -e

npx tsc --noEmit
npm run lint
npm test
npm test -- --coverage

# Fail if coverage below 80%
COVERAGE=$(npm test -- --coverage --reporter=json | jq '.total.lines.pct')
if (( $(echo "$COVERAGE < 80" | bc -l) )); then
  echo "Coverage $COVERAGE% is below 80% threshold"
  exit 1
fi
```
