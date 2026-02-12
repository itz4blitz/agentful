---
name: agentful-worktree
description: Manage git worktrees for parallel agent development. List, create, and cleanup worktrees.
---

# /agentful-worktree

Manage git worktrees for parallel agentful development.

## Usage

```bash
/agentful-worktree                    # List all active worktrees
/agentful-worktree --status           # Show current session worktree
/agentful-worktree --create feature/x  # Create new worktree for branch
/agentful-worktree --cleanup          # Remove stale worktrees
/agentful-worktree --prune           # Run git worktree prune
/agentful-worktree --remove <name>    # Remove specific worktree
```

## Environment Variables

| Variable | Default | Description |
|-----------|----------|-------------|
| `AGENTFUL_WORKTREE_MODE` | `auto` | `auto` (create), `block` (require), `off` (disabled) |
| `AGENTFUL_WORKTREE_LOCATION` | `../` | Where to create worktrees (relative to repo) |
| `AGENTFUL_WORKTREE_AUTO_CLEANUP` | `true` | Auto-remove worktrees after task completion |
| `AGENTFUL_WORKTREE_RETENTION_DAYS` | `7` | Days before worktrees are marked stale |
| `AGENTFUL_WORKTREE_MAX_ACTIVE` | `5` | Maximum active worktrees before cleanup forced |

## Examples

### List Worktrees

```
/agentful-worktree
```

Output:
```
📋 Active Worktrees:

┌─────────────────────────────────────────────────────────────┐
│ agentful-feature-auth-1739297120                │
│ ├─ Branch: feature/auth                             │
│ ├─ Purpose: feature                                │
│ ├─ Path: ../agentful-feature-auth-1739297120       │
│ ├─ Status: 🟢 Active (15 min ago)                │
│ └─ Created: 2025-02-11T15:30:00.000Z            │
└─────────────────────────────────────────────────────────────┘
```

### Show Current Status

```
/agentful-worktree --status
```

### Create Worktree

```
/agentful-worktree --create feature/dashboard
```

Creates a worktree named `agentful-feature-dashboard-<timestamp>` on the `feature/dashboard` branch.

### Cleanup Stale Worktrees

```
/agentful-worktree --cleanup
```

Removes worktrees older than `AGENTFUL_WORKTREE_RETENTION_DAYS` (default: 7 days).

## Worktree Naming Convention

Worktrees are automatically named using this pattern:

```
agentful-<purpose>-<branch-slug>-<timestamp>
```

Examples:
- `agentful-feature-auth-1739297120` - Feature development
- `agentful-fix-coverage-1739297150` - Fixer adding coverage
- `agentful-review-1739297180` - Reviewer validating
- `agentful-hotfix-login-bug-1739297210` - Hotfix work

## When to Use Worktrees

**Use worktrees when**:
- Working on multiple features simultaneously
- Running quality gates while developing other features
- Reviewing PRs without interrupting active work
- Testing experimental approaches safely

**Don't need worktrees when**:
- Quick fixes in a single feature branch
- Documentation-only changes
- Set `AGENTFUL_WORKTREE_MODE=off` to disable

## See Also

- [Git Worktrees Concept](/concepts/git-worktrees) - Deep dive on worktree usage
- [/agentful-start](/commands/agentful-start) - Main development loop
- [/agentful-status](/commands/agentful-status) - Check completion progress
