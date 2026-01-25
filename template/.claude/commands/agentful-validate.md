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

### 1. Pre-validation Checks

Before delegating to reviewer, verify prerequisites:

```javascript
// Check that reviewer agent exists
if (!exists('.claude/agents/reviewer.md')) {
  throw new Error(`
❌ Reviewer agent not found!

The reviewer agent is required to run validation checks. To fix:

1. Run: /agentful-analyze
   (This will detect your stack and set up required agents)

2. Or manually ensure .claude/agents/reviewer.md exists

Cannot validate without reviewer.
`);
}

// Check that required tools are available
const requiredTools = {
  'tsc': 'TypeScript compiler (npm install -g typescript)',
  'npm': 'Node package manager (install Node.js)'
};

const missingTools = [];

for (const [tool, installMsg] of Object.entries(requiredTools)) {
  try {
    Bash(`which ${tool}`, { timeout: 2000 });
  } catch (error) {
    missingTools.push(`  - ${tool}: ${installMsg}`);
  }
}

if (missingTools.length > 0) {
  console.warn(`
⚠️  Warning: Some validation tools are not available:

${missingTools.join('\n')}

Validation may be incomplete. Install missing tools for full coverage.
`);
}
```

### 2. Run Reviewer

Delegate to reviewer agent with error handling:

```javascript
try {
  const result = Task("reviewer", "Run all validation checks on the current codebase and report results.");

  if (!result || result.error) {
    throw new Error(result?.error || "Reviewer returned no results");
  }

  return result;

} catch (error) {
  console.error(`❌ Validation failed: ${error.message}`);

  // Check if it's a delegation error vs validation error
  if (error.message.includes('Task') || error.message.includes('agent')) {
    throw new Error(`
Failed to delegate to reviewer agent: ${error.message}

Possible causes:
- Reviewer agent has syntax errors
- Task tool not available
- System resource limits

Check .claude/agents/reviewer.md for issues.
`);
  } else {
    // It's a validation error (tests failed, etc.) - this is normal
    // Let the reviewer's output be displayed
    throw error;
  }
}
```

### 3. Display Results

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

### 4. Update Completion JSON

Use centralized state validator to safely update completion.json:

```javascript
import { updateStateFile, getStateFile } from './lib/state-validator.js';

// Get current completion state with validation
const completionResult = getStateFile(process.cwd(), 'completion.json', { autoRecover: true });

if (!completionResult.valid) {
  console.error(`❌ Cannot update completion.json: ${completionResult.error}`);
  return;
}

// Update gates with validation results
const updateResult = updateStateFile(process.cwd(), 'completion.json', (current) => {
  return {
    ...current,
    gates: {
      tests_passing: validationResults.tests_passing,
      no_type_errors: validationResults.no_type_errors,
      no_dead_code: validationResults.no_dead_code,
      coverage_80: validationResults.coverage_80,
      security_clean: validationResults.security_clean,
      no_lint_errors: validationResults.no_lint_errors
    },
    last_validated: new Date().toISOString()
  };
});

if (!updateResult.success) {
  console.error(`❌ Failed to update completion.json: ${updateResult.message}`);
  return;
}

console.log('✅ Updated quality gates in completion.json');
```

Updated `.agentful/completion.json` gates:

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

When run directly (not via orchestrator), offer to auto-fix issues:

```javascript
function handle_standalone_mode(validationResults) {
  // Display results first
  display_validation_results(validationResults);

  // If there are fixable issues, offer to auto-fix
  if (validationResults.mustFix && validationResults.mustFix.length > 0) {
    const response = AskUserQuestion({
      question: "Issues found. Would you like to auto-fix them?",
      context: `
Found ${validationResults.mustFix.length} issues that can be automatically fixed:

${validationResults.mustFix.map((issue, i) => `  ${i + 1}. ${issue}`).join('\n')}
`,
      options: [
        { id: 'yes', label: 'Yes, auto-fix now', value: true },
        { id: 'no', label: 'No, I will fix manually', value: false }
      ]
    });

    if (response.value === true) {
      console.log("\nDelegating to fixer agent...\n");

      try {
        Task("fixer", `Fix the following issues:

${JSON.stringify(validationResults.mustFix, null, 2)}

After fixing, report what was fixed.`);

        console.log("\n✅ Auto-fix complete. Re-run /agentful-validate to verify.");

      } catch (error) {
        console.error(`❌ Auto-fix failed: ${error.message}`);
        console.log("Please fix issues manually or check fixer agent configuration.");
      }
    } else {
      console.log("\nSkipped auto-fix. Fix issues manually and re-run /agentful-validate.");
    }
  } else {
    console.log("\n✅ No issues to fix!");
  }
}
```

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

For CI/CD integration, the command should set proper exit codes:

```javascript
function set_exit_code(validationResults) {
  // Determine exit code based on results
  let exitCode = 0;

  // Check if validation could run at all
  if (validationResults.error) {
    exitCode = 2; // Unable to run checks
    console.error(`Exit code: ${exitCode} (Unable to run validation)`);
    process.exit(exitCode);
  }

  // Check if any gates failed
  const gates = validationResults.gates || {};
  const failedGates = Object.entries(gates)
    .filter(([_, passed]) => passed === false);

  if (failedGates.length > 0) {
    exitCode = 1; // One or more checks failed
    console.log(`Exit code: ${exitCode} (${failedGates.length} gate(s) failed)`);
    process.exit(exitCode);
  }

  // All checks passed
  console.log(`Exit code: ${exitCode} (All checks passed)`);
  process.exit(exitCode);
}
```

**Exit Code Reference:**
- `0` - All checks passed (all gates green)
- `1` - One or more checks failed (at least one gate red)
- `2` - Unable to run checks (missing dependencies, errors, etc.)

**Usage in CI/CD:**
```bash
# In your CI pipeline
/agentful-validate
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Validation passed"
elif [ $EXIT_CODE -eq 1 ]; then
  echo "❌ Validation failed"
  exit 1
else
  echo "⚠️  Could not run validation"
  exit 2
fi
```
