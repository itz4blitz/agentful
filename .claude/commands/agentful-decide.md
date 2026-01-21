---
name: agentful-decide
description: Answer pending decisions that are blocking development progress.
---

# agentful Decide

This command helps you resolve pending decisions that are blocking development.

## Process

### 1. Read Decisions

Read `.agentful/decisions.json`:

```json
{
  "pending": [
    {
      "id": "decision-001",
      "question": "How should we handle inventory race conditions during flash sales?",
      "options": [
        "Pessimistic locking (database row locks during checkout)",
        "Optimistic locking with automatic retry on conflict",
        "Queue-based processing (serialize checkout requests)"
      ],
      "context": "Shopfinity e-commerce platform expects 1000+ concurrent checkouts during Black Friday. Current implementation allows overselling when multiple users attempt to purchase the same item simultaneously.",
      "blocking": ["checkout-feature", "order-history-feature"],
      "timestamp": "2026-01-18T00:00:00Z"
    }
  ],
  "resolved": []
}
```

### 2. Present to User

For each pending decision, display:

```
┌────────────────────────────────────────────────────────────┐
│ Decision #1                                                │
├────────────────────────────────────────────────────────────┤
│ Question: How should we handle inventory race conditions   │
│ during flash sales?                                        │
│                                                            │
│ Context: Shopfinity expects 1000+ concurrent checkouts     │
│ during Black Friday. Current implementation allows          │
│ overselling when multiple users attempt to purchase        │
│ the same item simultaneously.                              │
│                                                            │
│ Options:                                                   │
│   [1] Pessimistic locking (database row locks)             │
│       Pros: Simple, guarantees consistency                 │
│       Cons: Poor performance under high concurrency        │
│                                                            │
│   [2] Optimistic locking with automatic retry              │
│       Pros: Better performance, handles spikes well        │
│       Cons: Requires retry logic, potential starvation     │
│                                                            │
│   [3] Queue-based processing                               │
│       Pros: Full control, can prioritize customers         │
│       Cons: Complex, adds infrastructure                   │
│                                                            │
│   [4] Custom input...                                      │
│                                                            │
│ Blocking: checkout-feature, order-history-feature          │
└────────────────────────────────────────────────────────────┘

Your choice:
```

### 3. Record Decision

After user selects:

```bash
# Move from pending to resolved
{
  "resolved": [
    {
      "id": "decision-001",
      "question": "How should we handle inventory race conditions during flash sales?",
      "answer": "Queue-based processing",
      "timestamp_resolved": "2026-01-18T00:30:00Z"
    }
  ],
  "pending": []
}
```

### 4. Update State

Remove from `.agentful/state.json` blocked_on array:

```json
{
  "blocked_on": []  // Was: ["checkout-feature", "order-history-feature"]
}
```

## Example Decisions Across Different Domains

**SaaS Billing Platform:**
```
Question: How should we prorate subscription changes mid-cycle?

Options:
  [1] Prorate to the day (calculate daily rate)
  [2] Prorate to the week (simpler calculation)
  [3] Charge full amount, credit next cycle
  [4] Custom input...

Context: Startup plan users frequently upgrade/downgrade.
Complex daily proration may confuse customers on invoices.

Blocking: subscription-management, invoice-generation
```

**Content Management System:**
```
Question: How should we handle concurrent content edits?

Options:
  [1] Last write wins (overwrite without warning)
  [2] Optimistic locking (show conflict, let user merge)
  [3] Pessimistic locking (lock document on edit)
  [4] Google Docs-style real-time collaboration

Context: Marketing team of 12 editors reports frequent
conflicts when updating blog posts and landing pages.

Blocking: content-editor, version-control
```

**Project Management Tool:**
```
Question: How should we calculate project completion percentage?

Options:
  [1] Equal weight (all tasks count equally)
  [2] Story points (weighted by effort estimate)
  [3] Time spent (weighted by actual hours logged)
  [4] Custom (manual percentage per task)

Context: Developers complain that completing 10 small tasks
shows same progress as 1 complex architectural change.

Blocking: dashboard, reporting-metrics
```

## Interactive Mode

If there are multiple pending decisions, process them one at a time:

```
You have 3 pending decisions to resolve:

[1/3] How should we handle inventory race conditions?
  > 3 (Queue-based processing)

[2/3] Which payment gateway should we use?
  > 1

[3/3] Should we support international shipping from day 1?
  > 4 (custom: "Only US and Canada, expand in Q2")

✅ All decisions resolved! Run /agentful-start to continue.
```

## No Pending Decisions

If decisions.json is empty or pending array is empty:

```
✅ No pending decisions!

All features are unblocked. Run /agentful-start to continue development.
```

## Implementation

Use AskUserQuestion tool to present decisions interactively:

```
AskUserQuestion({
  questions: [{
    id: "decision-001",
    question: "How should we handle inventory race conditions?",
    options: [
      {
        label: "Pessimistic locking",
        description: "Database row locks during checkout"
      },
      {
        label: "Optimistic locking",
        description: "Automatic retry on conflict"
      },
      {
        label: "Queue-based processing",
        description: "Serialize checkout requests"
      }
    ],
    context: "Expected 1000+ concurrent checkouts during Black Friday...",
    blocking: ["checkout-feature", "order-history-feature"]
  }]
})
```

After receiving answers:
1. Update decisions.json (move to resolved)
2. Update state.json blocked_on (clear the array)
3. Show summary of what was resolved
4. Suggest running /agentful-start
