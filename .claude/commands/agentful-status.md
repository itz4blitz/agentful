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

Product: [from .claude/product/index.md title]
Overall Progress: ████░░░░░░░░░░ 48%
Phase: [current phase from state.json]
Iterations: [number from state.json]
```

### Completion Table

```
┌─────────────────────┬──────────┬─────────┬────────────────┐
│ Feature             │ Status   │ Score   │ Notes          │
├─────────────────────┼──────────┼─────────┼────────────────┤
│ Authentication      │ ✅ Done  │ 100%    │                │
│ User Profile        │ 🔄 Active│ 45%     │ Backend done   │
│ Dashboard           │ ⏸ Pending│ 0%      │ Blocked on UX  │
│ Settings            │ ⏸ Pending│ 0%      │                │
└─────────────────────┴──────────┴─────────┴────────────────┘
```

### Quality Gates

```
┌─────────────────────┬────────┐
│ Quality Gate        │ Status │
├─────────────────────┼────────┤
│ Tests Passing       │ ✅     │
│ No Type Errors      │ ✅     │
│ No Dead Code        │ ❌     │
│ Coverage ≥ 80%      │ ⚠️ 72% │
└─────────────────────┴────────┘
```

### Pending Decisions

```
⚠️  Decisions Needed:

1. "Should auth use JWT or session cookies?"
   Options: JWT (stateless), Sessions (simpler), Clerk (managed)
   Blocking: auth-feature

   → Run /agentful-decide to resolve
```

### Current Work

```
🔧 Currently Working On:
   Task: user-profile-backend
   Agent: backend
   Started: 2 minutes ago

   Last output: "Implementing user profile service layer..."
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
  • /agentful-validate- Run quality checks
```
