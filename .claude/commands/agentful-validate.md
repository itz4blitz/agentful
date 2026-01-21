---
name: agentful-validate
description: Run all quality checks and validation gates. Delegates to reviewer agent.
---

# agentful Validate

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
Tests           ✅ PASS - 156 tests passed
Coverage        ⚠️  WARN - 76% (needs 80%)
Security        ✅ PASS - No issues found

Overall: ⚠️ PASSED with warnings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issues that must be fixed:

1. Unused export: calculateDiscount in src/billing/promotions.ts
2. Unused file: src/components/LegacyAddressForm.tsx
3. Unused import: { logger } in src/services/email.ts

Warnings (recommended fixes):

4. Coverage below 80% threshold (4% points needed)
   Missing tests in:
   - src/stripe/webhook-handler.ts (45% coverage)
   - src/inventory/allocation.ts (62% coverage)

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
    "coverage_80": false,
    "security_clean": true
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

## Example Output for Different Domains

**SaaS Billing Platform:**
```
Dead Code       ❌ FAIL - 2 issues found
   - Unused export: prorateSubscription in src/billing/usage.ts
   - Unused file: src/components/UsageChartOld.tsx

Coverage        ⚠️  WARN - 74% (needs 80%)
   Missing: src/stripe/subscription-updates.ts
```

**Content Management System:**
```
Dead Code       ❌ FAIL - 4 issues found
   - Unused export: parseMarkdownFrontmatter in src/content/parser.ts
   - Unused file: src/components/RichTextEditorLegacy.tsx
   - Unused imports in 2 files

Security        ⚠️  WARN - 1 issue found
   - Debug console.log in src/api/content-preview.ts:23
```

**Project Management Tool:**
```
Tests           ❌ FAIL - 3 tests failed
   - TaskAssignmentService › should handle concurrent assignments
   - ProjectTimeline › should calculate critical path correctly
   - SprintController › should prevent sprint deletion with active tasks
```

## Exit Codes

For CI/CD integration:
- `0` - All checks passed
- `1` - One or more checks failed
- `2` - Unable to run checks (missing dependencies, etc.)
