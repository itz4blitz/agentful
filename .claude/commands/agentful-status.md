---
name: agentful-status
description: Show current progress, completion percentage, and what's being worked on.
---

# agentful Status

This command shows the current state of autonomous product development.

## Display Format

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

Read and display:

1. `.agentful/state.json` - Current work, phase, iterations
2. `.agentful/completion.json` - Features and gates
3. `.agentful/decisions.json` - Pending decisions
4. `.claude/product/index.md` - Product name and overview

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
