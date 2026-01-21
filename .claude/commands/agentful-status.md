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

Before reading any state files, validate their existence and structure:

```javascript
function validate_state_file(file_path, required_fields) {
  // Check file exists
  if (!exists(file_path)) {
    return { valid: false, error: `File not found: ${file_path}`, action: "not_found" };
  }

  // Check file is valid JSON
  let content;
  try {
    content = JSON.parse(Read(file_path));
  } catch (e) {
    return { valid: false, error: `Invalid JSON in ${file_path}`, action: "corrupted" };
  }

  // Check required fields exist
  for (const field of required_fields) {
    if (!(field in content)) {
      return { valid: false, error: `Missing field '${field}' in ${file_path}`, action: "incomplete" };
    }
  }

  return { valid: true, content };
}
```

### Validate Required Files

```bash
# Validate state.json
validation = validate_state_file(".agentful/state.json", ["current_task", "current_phase", "iterations"])

if !validation.valid:
  if validation.action == "not_found":
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          No Active Development Session
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No state file found. Run /agentful-start to begin development.
`)
    return  # Exit - nothing to show
  else if validation.action == "corrupted":
    console.log("❌ Corrupted state.json file. Run /agentful-start to reset.")
    return
  else if validation.action == "incomplete":
    console.log("⚠️  Incomplete state.json. Run /agentful-start to repair.")
    return

# Validate completion.json
validation = validate_state_file(".agentful/completion.json", ["features", "gates"])

if !validation.valid:
  if validation.action == "not_found":
    console.log("⚠️  No completion.json found. Run /agentful-start to initialize.")
    return
  else if validation.action == "corrupted":
    console.log("❌ Corrupted completion.json file. Run /agentful-start to reset.")
    return

# Validate product-analysis.json (optional - may not exist)
product_analysis_exists = exists(".agentful/product-analysis.json")
if product_analysis_exists:
  validation = validate_state_file(".agentful/product-analysis.json", ["readiness_score", "issues"])

  if !validation.valid && validation.action == "corrupted":
    console.log("⚠️  Corrupted product-analysis.json - skipping product readiness section")
    product_analysis_exists = false

# Validate decisions.json (optional - may not exist)
decisions_exists = exists(".agentful/decisions.json")
if decisions_exists:
  validation = validate_state_file(".agentful/decisions.json", ["pending"])

  if !validation.valid && validation.action == "corrupted":
    console.log("⚠️  Corrupted decisions.json - initializing with empty array")
    Write(".agentful/decisions.json", JSON.stringify({ pending: [], resolved: [] }))
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
