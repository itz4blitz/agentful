# .claude/ Protection Mechanism

## Problem

The `.claude/` directory contains critical agentful configuration (agents, commands, skills, settings) that can be accidentally deleted during git operations, merges, or Claude Code execution.

## Solution

Two-layer protection system:

### 1. Template Separation (Primary Protection)

**Location**: `template/.claude/` (distributed via npm)

- Clean template files that get copied to users' projects via `npx @itz4blitz/agentful init`
- Version controlled and tracked in git
- Distributed in npm package under `files: ["template/"]`
- **Never modified by agentful itself** (only by developers updating templates)

**Location**: `.claude/` (working directory, gitignored)

- User's customizable configuration
- Modified by `/agentful-update` for safe updates
- Can be used for developing agentful itself without polluting templates
- Backed up before any update operations

### 2. Auto-Restore Git Hook (Backup Protection)

**Location**: `.git/hooks/post-merge`

Automatically runs after every git merge to verify `.claude/` integrity:

```bash
#!/bin/bash
# Auto-restores .claude/ if corrupted/deleted after merge

check_claude_integrity() {
  # Checks for .claude/settings.json, agents/, commands/
}

if ! check_claude_integrity; then
  echo "⚠️  .claude/ corrupted - restoring from template/"
  cp -r template/.claude/ .claude/
fi
```

**Triggers**:
- After `git pull`
- After `git merge`
- After `git rebase`

**What it does**:
1. Checks if `.claude/settings.json`, `agents/`, `commands/` exist
2. If missing/corrupted: backs up corrupted state to `.claude.corrupted-{timestamp}`
3. Restores from `template/.claude/`
4. Shows instructions for recovery

## Update Workflow

### Safe Updates via `/agentful-update`

Users should update `.claude/` configuration using:

```bash
/agentful-update
```

**Process**:
1. Checks for latest `@itz4blitz/agentful` version on npm
2. Creates timestamped backup: `.claude.backup-{timestamp}/`
3. Performs 3-way merge (user customizations + old template + new template)
4. Uses sub-agent to intelligently merge changes
5. Validates after update
6. Offers rollback if validation fails

**Update strategies**:
- `--force`: Replace with templates (discard customizations)
- `--interactive`: Prompt for each conflict (default)
- `--conservative`: Only update unchanged files

## File Locations

```
agentful/
├── template/           # Distributed via npm
│   └── .claude/       # Clean templates (version controlled)
│       ├── agents/
│       ├── commands/
│       ├── settings.json
│       └── skills/
├── .claude/           # Working directory (gitignored)
│   ├── agents/
│   ├── commands/
│   ├── settings.json
│   └── skills/
└── .git/hooks/
    └── post-merge     # Auto-restore hook
```

## Developer Workflow

### Working on agentful itself

1. Edit `template/.claude/` files (these are the source of truth)
2. Changes are version controlled in git
3. Your local `.claude/` can be customized for testing without affecting templates
4. Run `cp template/.claude/* .claude/` to sync when needed

### Testing update mechanism

```bash
# Simulate corruption
rm -rf .claude/

# Trigger hook manually
.git/hooks/post-merge

# Verify restoration
ls .claude/
```

## Benefits

✅ **Prevents accidental deletion** - Git hook auto-restores
✅ **Safe updates** - `/agentful-update` preserves customizations
✅ **Clean separation** - Templates vs working directory
✅ **Development friendly** - Work on agentful without polluting templates
✅ **Rollback capability** - Timestamped backups before updates

## Troubleshooting

### `.claude/` was deleted

**Automatic**: The post-merge hook should auto-restore on next `git pull`

**Manual**:
```bash
cp -r template/.claude/ .claude/
```

### Update broke something

**Rollback**:
```bash
# Find your backup
ls -la | grep claude.backup

# Restore it
rm -rf .claude/
cp -r .claude.backup-{timestamp} .claude/
```

### Hook isn't running

**Make executable**:
```bash
chmod +x .git/hooks/post-merge
```

**Test manually**:
```bash
.git/hooks/post-merge
```

## Architecture Decision

This approach was chosen because:

1. **Users only run init once** - `npx @itz4blitz/agentful init`
2. **Updates are controlled** - Via `/agentful-update` with sub-agents
3. **Templates stay clean** - `template/.claude/` is never polluted
4. **Development is safe** - Can use agentful to develop agentful
5. **Auto-recovery** - Git hook prevents data loss from merges

Alternative considered: Git attributes to prevent auto-merges, but this would block intentional updates via `/agentful-update`.
