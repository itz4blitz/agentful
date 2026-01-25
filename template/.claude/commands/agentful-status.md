---
name: agentful-status
description: Show current progress, completion percentage, and what's being worked on.
---

# agentful Status

This command shows the current state of autonomous product development.

## Display Format

### Product Readiness (if `.agentful/product-analysis.json` exists)

Display this section FIRST, before the header:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Product Readiness: 85% ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completeness:    92% ✅
Clarity:         88% ⚠️
Feasibility:     78% ⚠️
Testability:     85% ⚠️
Consistency:     82% ⚠️

⚠️  2 blocking issues - run /agentful-product to resolve

⚠️  Product spec has minor gaps - recommend refinement

Last analyzed: 2 hours ago
Update: /agentful-product

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Emoji guidelines for scores:
- 90-100%: ✅
- 70-89%: ⚠️
- Below 70%: ❌

Overall readiness status:
- Score >= 90%: "✅ Product spec is ready for development"
- Score >= 70%: "⚠️  Product spec has minor gaps - recommend refinement"
- Score < 70%: "❌ Product spec needs refinement before development"

Blocking issues line only shows if there are blocking issues (count > 0).

### Header

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           agentful Development Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product: Shopfinity E-commerce Platform
Overall Progress: ████████░░░░░░░ 62%
Phase: feature_development
Iterations: 24
```

### Completion Table

```
┌─────────────────────┬──────────┬─────────┬────────────────────────┐
│ Feature             │ Status   │ Score   │ Notes                  │
├─────────────────────┼──────────┼─────────┼────────────────────────┤
│ Product Catalog     │ ✅ Done  │ 100%    │                        │
│ Shopping Cart       │ ✅ Done  │ 100%    │                        │
│ Checkout Flow       │ 🔄 Active│ 65%     │ Tax calc needs tests   │
│ Payment Integration │ 🔄 Active│ 40%     │ Stripe webhook pending │
│ Order History       │ ⏸ Pending│ 0%      │ Blocked on checkout   │
│ Admin Dashboard     │ ⏸ Pending│ 0%      │                        │
└─────────────────────┴──────────┴─────────┴────────────────────────┘
```

### Quality Gates

```
┌─────────────────────┬────────┐
│ Quality Gate        │ Status │
├─────────────────────┼────────┤
│ Tests Passing       │ ✅     │
│ No Type Errors      │ ✅     │
│ No Dead Code        │ ✅     │
│ Coverage ≥ 80%      │ ⚠️ 76% │
│ Security Clean      │ ✅     │
└─────────────────────┴────────┘
```

### Pending Decisions

```
⚠️  Decisions Needed:

1. "How should we handle inventory race conditions during flash sales?"
   Options: Pessimistic locking, Optimistic locking with retry, Queue-based processing
   Blocking: payment-integration, order-history

   Context: Current implementation allows overselling when multiple users
   checkout simultaneously. Peak traffic expected during Black Friday.

   → Run /agentful-decide to resolve
```

### Current Work

```
🔧 Currently Working On:
   Task: stripe-webhook-handler
   Agent: backend
   Started: 5 minutes ago

   Last output: "Implementing webhook signature verification for Stripe events..."
```

## Implementation

### State File Validation

Use the centralized state validator module to validate all required state files:

```javascript
import { getStateFile, validateAllState, formatValidationResults } from './lib/state-validator.js';

// Validate all state files at once
const validationResults = validateAllState(process.cwd(), {
  autoRecover: true,
  skipOptional: true,
  verbose: false
});

// Check if validation failed
if (!validationResults.valid) {
  console.error(formatValidationResults(validationResults));
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          State Validation Failed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Critical state files are corrupted or missing.
Run /agentful-start to initialize or repair state files.
`);
  return;  // Exit - cannot show status with invalid state
}

// Get individual state files
const stateResult = getStateFile(process.cwd(), 'state.json', { autoRecover: true });
const completionResult = getStateFile(process.cwd(), 'completion.json', { autoRecover: true });
const decisionsResult = getStateFile(process.cwd(), 'decisions.json', { autoRecover: true });

// Check critical files
if (!stateResult.valid) {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          No Active Development Session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No state file found. Run /agentful-start to begin development.
`);
  return;
}

if (!completionResult.valid) {
  console.log(`⚠️  No completion tracking found. Run /agentful-start to initialize.`);
  return;
}

// Extract data for use
const state = stateResult.data;
const completion = completionResult.data;
const decisions = decisionsResult.valid ? decisionsResult.data : { pending: [], resolved: [] };

// Check for optional product-analysis.json (not in main validator)
let productAnalysis = null;
if (exists('.agentful/product-analysis.json')) {
  try {
    productAnalysis = JSON.parse(Read('.agentful/product-analysis.json'));
  } catch (e) {
    console.warn('⚠️  Corrupted product-analysis.json - skipping product readiness section');
  }
}
```

### Read and Display

After validation passes, read and display:

1. `.agentful/product-analysis.json` (optional) - Product readiness score and breakdown
   - Only display product readiness section if this file exists
   - Calculate emoji based on score thresholds (90-100: ✅, 70-89: ⚠️, <70: ❌)
   - Show blocking issues count if > 0
   - Format timestamp as relative time (e.g., "2 hours ago", "just now", "3 days ago")

2. `.agentful/state.json` - Current work, phase, iterations
3. `.agentful/completion.json` - Features and gates
4. `.agentful/decisions.json` - Pending decisions
5. `.claude/product/index.md` - Product name and overview

Format the output nicely with ASCII art for readability.

## Quick Actions

At the end, suggest next actions:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next Actions:
  • /agentful-start    - Continue development
  • /agentful-decide  - Answer pending decisions
  • /agentful-validate - Run quality checks
```
