---
name: agentful-start
description: Start or resume structured product development loop. Delegates to orchestrator agent.
---

# agentful Start

This command initiates the structured product development loop with human checkpoints.

## Startup Sequence

### 0. State File Validation

Before processing any state files, validate their existence and structure. This prevents corrupted or missing state from causing failures.

#### Validation Pattern

```javascript
function validate_state_file(file_path, required_fields) {
  // Check file exists
  if (!exists(file_path)) {
    return { valid: false, error: `File not found: ${file_path}`, action: "initialize" };
  }

  // Check file is valid JSON
  let content;
  try {
    content = JSON.parse(Read(file_path));
  } catch (e) {
    return { valid: false, error: `Invalid JSON in ${file_path}`, action: "backup_and_reset" };
  }

  // Check required fields exist
  for (const field of required_fields) {
    if (!(field in content)) {
      return { valid: false, error: `Missing field '${field}' in ${file_path}`, action: "add_field", missing_field: field };
    }
  }

  return { valid: true };
}
```

#### Validate Core State Files

```bash
# Validate state.json
validation = validate_state_file(".agentful/state.json", ["current_task", "current_phase", "iterations", "blocked_on", "last_updated"])

if !validation.valid:
  if validation.action == "initialize":
    # Create default state.json
    Write(".agentful/state.json", JSON.stringify({
      version: "1.0",
      current_task: null,
      current_phase: "idle",
      iterations: 0,
      last_updated: new Date().toISOString(),
      blocked_on: []
    }))
  else if validation.action == "backup_and_reset":
    # Backup corrupted file
    Bash("cp .agentful/state.json .agentful/state.json.backup-$(date +%s)")
    # Create fresh file
    Write(".agentful/state.json", JSON.stringify({
      version: "1.0",
      current_task: null,
      current_phase: "idle",
      iterations: 0,
      last_updated: new Date().toISOString(),
      blocked_on: []
    }))
    console.log("⚠️  Corrupted state.json backed up and reset")
  else if validation.action == "add_field":
    # Read, add field, write back
    content = JSON.parse(Read(".agentful/state.json"))
    if validation.missing_field == "blocked_on":
      content.blocked_on = []
    else if validation.missing_field == "iterations":
      content.iterations = 0
    else if validation.missing_field == "last_updated":
      content.last_updated = new Date().toISOString()
    Write(".agentful/state.json", JSON.stringify(content))

# Validate completion.json
validation = validate_state_file(".agentful/completion.json", ["features", "gates"])

if !validation.valid:
  if validation.action == "initialize":
    # Create default completion.json
    Write(".agentful/completion.json", JSON.stringify({
      features: {},
      gates: {
        tests_passing: false,
        no_type_errors: false,
        no_dead_code: false,
        coverage_80: false,
        security_clean: false
      },
      overall_progress: 0
    }))
  else if validation.action == "backup_and_reset":
    # Backup corrupted file
    Bash("cp .agentful/completion.json .agentful/completion.json.backup-$(date +%s)")
    # Create fresh file
    Write(".agentful/completion.json", JSON.stringify({
      features: {},
      gates: {
        tests_passing: false,
        no_type_errors: false,
        no_dead_code: false,
        coverage_80: false,
        security_clean: false
      },
      overall_progress: 0
    }))
    console.log("⚠️  Corrupted completion.json backed up and reset")
  else if validation.action == "add_field":
    content = JSON.parse(Read(".agentful/completion.json"))
    if validation.missing_field == "features":
      content.features = {}
    else if validation.missing_field == "gates":
      content.gates = {
        tests_passing: false,
        no_type_errors: false,
        no_dead_code: false,
        coverage_80: false,
        security_clean: false
      }
    else if validation.missing_field == "overall_progress":
      content.overall_progress = 0
    Write(".agentful/completion.json", JSON.stringify(content))

# Validate architecture.json (if exists - not required)
if exists(".agentful/architecture.json"):
  validation = validate_state_file(".agentful/architecture.json", ["language", "framework"])

  if !validation.valid && validation.action == "backup_and_reset":
    # Architecture is critical - backup and warn
    Bash("cp .agentful/architecture.json .agentful/architecture.json.backup-$(date +%s)")
    console.log("❌ Corrupted architecture.json backed up. Run /agentful-analyze to regenerate")
```

### 1. Detect User Intent

Check if the user provided a specific request with this command:

**Examples:**
- `/agentful-start "Fix the memory leak in checkout flow"` → BUGFIX workflow
- `/agentful-start "Add subscription proration logic"` → FEATURE_DEVELOPMENT workflow
- `/agentful-start "Migrate from REST to GraphQL"` → REFACTOR workflow
- `/agentful-start` (no args) → Continue structured development loop

**User Request Detection Logic:**

```javascript
// Extract command arguments
const args = extract_command_args(); // Everything after "/agentful-start"

if (args && args.trim().length > 0) {
  // User provided a specific task description
  const user_request = args.trim();

  // Pass to orchestrator for classification and execution
  // Orchestrator will determine work type and route to appropriate workflow
  delegate_to_orchestrator(user_request);

} else {
  // No arguments - run standard autonomous development loop
  // Orchestrator reads state, picks next task from product spec, executes
  run_autonomous_loop();
}
```

**Delegation Flow:**

If user provided request:
```javascript
Task("orchestrator", `User request: "${user_request}". Classify work type (FEATURE_DEVELOPMENT, BUGFIX, ENHANCEMENT, REFACTOR, MAINTENANCE, META_WORK) and execute appropriate workflow.`);
```

If no request (autonomous mode):
```javascript
Task("orchestrator", "Run autonomous development loop. Read state, pick next incomplete task from product spec, delegate to specialist agents, validate, update state, continue until complete or blocked.");
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
1. "How should we handle race conditions in inventory allocation?"
   Options: Pessimistic locking, Optimistic locking with retry, Queue-based
   Blocking: checkout-feature
   Run: /agentful-decide

Cannot proceed until decisions are resolved.
```

### 6. Initialize All Required State Files

If any required state files don't exist, initialize them on first run:

```javascript
// Initialize state.json
if (!exists(".agentful/state.json")) {
  Write(".agentful/state.json", JSON.stringify({
    version: "1.0",
    current_task: null,
    current_phase: "idle",
    iterations: 0,
    last_updated: new Date().toISOString(),
    blocked_on: []
  }, null, 2));
}

// Initialize completion.json
if (!exists(".agentful/completion.json")) {
  Write(".agentful/completion.json", JSON.stringify({
    features: {},
    gates: {
      tests_passing: false,
      no_type_errors: false,
      no_dead_code: false,
      coverage_80: false,
      security_clean: false
    },
    overall_progress: 0
  }, null, 2));
}

// Initialize decisions.json
if (!exists(".agentful/decisions.json")) {
  Write(".agentful/decisions.json", JSON.stringify({
    pending: [],
    resolved: []
  }, null, 2));
}

// Initialize conversation-state.json
if (!exists(".agentful/conversation-state.json")) {
  Write(".agentful/conversation-state.json", JSON.stringify({
    current_feature: null,
    current_phase: "idle",
    last_action: null,
    related_features: [],
    session_start: new Date().toISOString(),
    last_message_time: new Date().toISOString(),
    message_count: 0
  }, null, 2));
}

// Initialize conversation-history.json
if (!exists(".agentful/conversation-history.json")) {
  Write(".agentful/conversation-history.json", JSON.stringify({
    version: "1.0",
    session_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    messages: [],
    context_snapshot: null
  }, null, 2));
}
```

### 7. Delegate to Orchestrator

You are NOT the orchestrator. Use the Task tool to delegate. Handle delegation failures gracefully:

**If user provided a specific request:**
```javascript
try {
  Task("orchestrator", `User request: "${user_request}". Classify work type (FEATURE_DEVELOPMENT, BUGFIX, ENHANCEMENT, REFACTOR, MAINTENANCE, META_WORK) and execute appropriate workflow.`);
} catch (error) {
  // Orchestrator delegation failed
  console.error("Failed to delegate to orchestrator:", error.message);

  // Fallback: Check if orchestrator agent exists
  if (!exists(".claude/agents/orchestrator.md")) {
    throw new Error(`
❌ Orchestrator agent not found!

The orchestrator coordinates all development work. To fix:

1. Run: /agentful-analyze
   (This will detect your stack and generate necessary agents)

2. Or manually ensure .claude/agents/orchestrator.md exists

Cannot proceed without orchestrator.
`);
  } else {
    // File exists but Task delegation failed for another reason
    throw new Error(`
❌ Failed to delegate to orchestrator: ${error.message}

The orchestrator agent exists but delegation failed. Possible causes:
- Task tool not available
- Orchestrator agent has syntax errors
- System resource limits

Please check the error above and try again.
`);
  }
}
```

**If no request provided (default autonomous mode):**
```javascript
try {
  Task("orchestrator", "Run autonomous development loop. Read state, pick next incomplete task from product spec, delegate to specialist agents, validate, update state, continue until complete or blocked.");
} catch (error) {
  console.error("Failed to delegate to orchestrator:", error.message);

  if (!exists(".claude/agents/orchestrator.md")) {
    throw new Error(`
❌ Orchestrator agent not found!

Run /agentful-analyze to set up your project.
`);
  } else {
    throw new Error(`Failed to start orchestrator: ${error.message}`);
  }
}
```

## Ralph Wiggum Integration

When running in a Ralph loop (`/ralph-loop`), this command will be called repeatedly.

Output this **ONLY when truly complete** (all features done, all gates passing):

```
<promise>AGENTFUL_COMPLETE</promise>
```

## Example Flow

```
1. Read state.json → "checkout-cart" in progress
2. Read completion.json → checkout: 60% complete
3. Read .claude/product/index.md → e-commerce requirements
4. Delegate to @backend → "Implement tax calculation service"
5. Wait for completion
6. Delegate to @reviewer → "Review checkout changes"
7. If issues → @fixer → @reviewer again
8. Update completion.json → checkout: 80%
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
