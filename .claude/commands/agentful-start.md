---
name: agentful-start
description: Start or resume autonomous product development loop. Delegates to orchestrator agent.
---

# agentful Start

This command initiates the autonomous product development loop.

## Startup Sequence

### 1. Detect User Intent

Check if the user provided a specific request with this command:

**Examples:**
- `/agentful-start "Fix the login bug"` → BUGFIX workflow
- `/agentful-start "Add authentication"` → FEATURE_DEVELOPMENT workflow
- `/agentful-start "Refactor user service"` → REFACTOR workflow
- `/agentful-start` (no args) → Continue autonomous development loop

**User Request Detection:**
```
If user provided a specific request:
  - Pass it to orchestrator for classification
  - Orchestrator will route to appropriate workflow
  - May or may not loop depending on work type

If no request provided:
  - Assume FEATURE_DEVELOPMENT
  - Read product specs and continue autonomous loop
```

### 2. Load State

Read these files in order:
- `.claude/product/index.md` - What we're building
- `.agentful/state.json` - Current work state
- `.agentful/completion.json` - What's done vs not done
- `.agentful/decisions.json` - Pending user decisions
- `.agentful/agent-improvements.json` - Agent improvement suggestions (if exists)
- `.agentful/skill-improvements.json` - Skill improvement suggestions (if exists)
- `.agentful/last-known-framework-version.json` - Framework version tracking (if exists)

### 3. Check Framework Updates

If `.agentful/last-known-framework-version.json` exists:

```bash
# Calculate current checksums
current_checksums = calculate_checksums(".claude/")

# Compare with stored checksums
if current_checksums != stored_checksums:
  if context == "agentful_framework":
    # We're in agentful repo
    "Framework updated. Changes detected in:
     - orchestrator.md (improved)
     - validation skill (new gate added)

     Testing updated framework..."
  else:
    # User project - agentful was updated
    "agentful framework updated.
     New capabilities available:
     - Enhanced orchestrator with work classification
     - New validation gates

     Would you like to:
     1. Continue using current setup
     2. Re-run architect to regenerate specialized agents
     3. See what's new"

    # Update stored checksums
    update_last_known_version()
```

### 4. Check Agent Improvement Suggestions

If `.agentful/agent-improvements.json` has HIGH priority items:

```bash
if agent_improvements.pending.any(priority == "HIGH"):
  if context == "agentful_framework":
    "Agent improvement suggestions detected:
     - Backend agent needs migration workflow

     Proceeding with agent improvements..."

    # Delegate to orchestrator for META_WORK
  else:
    "Note: The agentful framework has suggested improvements.
     These will be available when you update agentful."
```

### 5. Check Decisions

If `.agentful/decisions.json` has pending items:

```
⚠️  Pending decisions need your input:
1. "Should auth use JWT or session cookies?"
   Run: /agentful-decide

Cannot proceed until decisions are resolved.
```

### 6. Initialize State if Needed

If `.agentful/state.json` doesn't exist or is empty:

```bash
echo '{
  "version": "1.0",
  "current_task": null,
  "current_phase": "idle",
  "iterations": 0,
  "last_updated": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "blocked_on": []
}' > .agentful/state.json
```

### 7. Delegate to Orchestrator

You are NOT the orchestrator. Use the Task tool to delegate:

**If user provided a specific request:**
```
Task("orchestrator", "User request: [USER_REQUEST]. Classify work type and execute appropriate workflow.")
```

**If no request provided (default autonomous mode):**
```
Task("orchestrator", "Run autonomous development loop. Read state, pick next task, delegate to specialist agents, validate, update state, continue until complete.")
```

## Ralph Wiggum Integration

When running in a Ralph loop (`/ralph-loop`), this command will be called repeatedly.

Output this **ONLY when truly complete** (all features done, all gates passing):

```
<promise>AGENTFUL_COMPLETE</promise>
```

## Example Flow

```
1. Read state.json → "backend-auth" in progress
2. Read completion.json → auth: 30% complete
3. Read .claude/product/index.md → auth requirements
4. Delegate to @backend → "Complete auth implementation"
5. Wait for completion
6. Delegate to @reviewer → "Review auth changes"
7. If issues → @fixer → @reviewer again
8. Update completion.json → auth: 100%
9. Loop → What's next?
```

## Manual Usage

For one-shot development (not a Ralph loop):
1. Run `/agentful-start`
2. Orchestrator picks one task
3. Completes it with validation
4. Reports progress
5. Run again to continue

## Autonomous Usage

For continuous development:
```bash
/ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"
```

This will run 24/7 until:
- All features complete (100%)
- All quality gates passing
- Or max-iterations reached
