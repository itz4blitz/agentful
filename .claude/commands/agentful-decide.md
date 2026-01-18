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
      "question": "Should auth use JWT or session cookies?",
      "options": [
        "JWT (stateless, scalable)",
        "Sessions (simpler, built-in)",
        "Clerk (managed service)"
      ],
      "context": "Building authentication system for .claude/product/index.md",
      "blocking": ["auth-feature", "user-profile-feature"],
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
│ Question: Should auth use JWT or session cookies?          │
│                                                            │
│ Context: Building authentication system for .claude/product/index.md │
│                                                            │
│ Options:                                                   │
│   [1] JWT (stateless, scalable)                            │
│   [2] Sessions (simpler, built-in)                         │
│   [3] Clerk (managed service)                              │
│   [4] Custom input...                                      │
│                                                            │
│ Blocking: auth-feature, user-profile-feature              │
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
      "question": "Should auth use JWT or session cookies?",
      "answer": "JWT (stateless, scalable)",
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
  "blocked_on": []  // Was: ["auth-feature", "user-profile-feature"]
}
```

## Interactive Mode

If there are multiple pending decisions, process them one at a time:

```
You have 3 pending decisions to resolve:

[1/3] Should auth use JWT or session cookies?
  > 1

[2/3] Which database provider?
  > 2

[3/3] Styling framework preference?
  > 4 (custom: "Tailwind CSS")

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
    question: "Should auth use JWT or session cookies?",
    options: [
      { label: "JWT", description: "Stateless, scalable" },
      { label: "Sessions", description: "Simpler, built-in" },
      { label: "Clerk", description: "Managed service" }
    ]
  }]
})
```

After receiving answers:
1. Update decisions.json
2. Update state.json blocked_on
3. Show summary of what was resolved
4. Suggest running /agentful-start
