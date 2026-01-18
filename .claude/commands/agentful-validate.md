---
name: agentful-validate
description: Run all quality checks and validation gates. Delegates to reviewer agent.
---

# Agentful Validate

This command runs all quality checks and validation gates.

## What It Validates

Delegate to the reviewer agent to run:

1. **TypeScript Check** - `npx tsc --noEmit`
2. **Lint Check** - `npm run lint`
3. **Dead Code Detection** - Find unused exports, files, imports
4. **Test Check** - `npm test`
5. **Coverage Check** - Verify ≥ 80% coverage
6. **Security Check** - Scan for secrets, vulnerabilities, debug logs

## Process

### 1. Run Reviewer

```
Task("reviewer", "Run all validation checks on the current codebase and report results.")
```

### 2. Display Results

After reviewer completes, display:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              Validation Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TypeScript      ✅ PASS - No type errors
Lint            ✅ PASS - No lint errors
Dead Code       ❌ FAIL - 3 issues found
Tests           ✅ PASS - 47 tests passed
Coverage        ⚠️  WARN - 72% (needs 80%)
Security        ⚠️  WARN - 2 issues found

Overall: ❌ FAILED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues that must be fixed:

1. Unused export: formatDate in src/utils/date.ts
2. Unused file: src/components/OldWidget.tsx
3. Unused dependency: lodash in package.json
4. Coverage below 80% threshold (8 points needed)
5. console.log in src/auth/login.ts:45

Run /agentful-start to auto-fix these issues.
```

### 3. Update Completion JSON

Update `.agentful/completion.json` gates:

```json
{
  "gates": {
    "tests_passing": true,
    "no_type_errors": true,
    "no_dead_code": false,
    "coverage_80": false
  }
}
```

## Standalone Mode

When run directly (not via orchestrator):
1. Execute all checks
2. Display results
3. Ask if user wants to auto-fix:
   ```
   Issues found. Would you like to auto-fix them? [y/N]
   ```
4. If yes, delegate to @fixer

## Quick Mode

For faster feedback, use specific checks:

```bash
# Quick type check only
/agentful-validate --type-check

# Quick test run only
/agentful-validate --tests

# Security scan only
/agentful-validate --security
```

## Exit Codes

For CI/CD integration:
- `0` - All checks passed
- `1` - One or more checks failed
- `2` - Unable to run checks (missing dependencies, etc.)
