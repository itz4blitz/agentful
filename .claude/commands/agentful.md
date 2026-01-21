---
name: agentful
description: Natural language interface for agentful human-in-the-loop development. Processes user intent and routes to appropriate handlers.
---

# agentful

Natural language interface for human-in-the-loop product development with Claude Code.

## Implementation

When this command is invoked:

1. **Check if user provided input**: If arguments are provided, this is a natural language request
2. **If NO input**: Show brief status + quick reference
3. **If input provided**: Delegate to conversation skill (with validation)

## Validation

```javascript
function validate_state_file(file_path, required_fields) {
  // Check file exists
  if (!exists(file_path)) {
    return { valid: false, action: "not_found" };
  }

  // Check file is valid JSON
  let content;
  try {
    content = JSON.parse(Read(file_path));
  } catch (e) {
    return { valid: false, action: "corrupted" };
  }

  // Check required fields exist
  if (required_fields) {
    for (const field of required_fields) {
      if (!(field in content)) {
        return { valid: false, action: "incomplete", missing_field: field };
      }
    }
  }

  return { valid: true, content };
}
```

```javascript
function execute_agentful_command(args) {
  // Extract user input
  const userInput = args ? args.trim() : "";

  if (!userInput || userInput.length === 0) {
    // No input - show brief status and quick reference
    show_brief_status_and_help();
  } else {
    // User provided natural language input - delegate to conversation
    delegate_to_conversation(userInput);
  }
}

function show_brief_status_and_help() {
  // Validate state files before reading
  const stateValidation = validate_state_file('.agentful/state.json', ['current_phase']);
  const completionValidation = validate_state_file('.agentful/completion.json', ['overall_progress']);

  if (stateValidation.valid && completionValidation.valid) {
    const state = stateValidation.content;
    const completion = completionValidation.content;

    console.log(`
Current Status:
  Phase: ${state.current_phase || 'idle'}
  Progress: ${completion.overall_progress || 0}%
  ${state.current_task ? `Working on: ${state.current_task}` : 'No active task'}

`);
  } else {
    // State files don't exist yet or are invalid - that's ok for welcome message
    console.log("\nWelcome to agentful!\n");
  }

  // Show quick reference
  display_quick_reference();
}

function delegate_to_conversation(userInput) {
  // Validate conversation skill exists
  if (!exists('.claude/skills/conversation/SKILL.md')) {
    console.error(`
❌ Conversation skill not found!

The conversation skill handles natural language input. To fix:

1. Ensure .claude/skills/conversation/SKILL.md exists
2. Or run: /agentful-analyze to set up the project

Cannot process natural language without conversation skill.
`);
    return;
  }

  // Delegate using Task tool with explicit method
  try {
    Task("conversation", userInput);
  } catch (error) {
    console.error(`
❌ Failed to process request: ${error.message}

Possible causes:
- Conversation skill has syntax errors
- Task tool not available
- Invalid input format

Try using specific commands instead:
  /agentful-start     - Start development
  /agentful-status    - Show progress
  /agentful-validate  - Run quality checks
  /agentful-decide    - Answer decisions
`);
  }
}
```

### With Natural Language Input

The conversation skill handles:
- Intent classification (feature request, bug report, status check, etc.)
- Entity extraction (feature names, domain references)
- Reference resolution (pronouns like "it", "that")
- Ambiguity detection and clarification
- Routing to appropriate handlers (orchestrator, status, validate, etc.)

See `.claude/skills/conversation/SKILL.md` for detailed processing logic.

### Without Input

Show the Quick Reference guide below.

---

## Quick Reference

Human-in-the-loop product development with Claude Code.

## What It Does

agentful transforms product specifications into working software by:

1. **Understanding your stack** - Auto-detects languages, frameworks, patterns
2. **Planning the work** - Organizes features into domains and priorities
3. **Building with guidance** - Specialized agents implement, test, validate with human checkpoints
4. **Ensuring quality** - Automatic code review, testing, security checks
5. **Tracking progress** - Real-time completion metrics and state

**Result**: Ship features faster with consistent quality.

## Quick Start

```bash
# Install in your project
npx @itz4blitz/agentful init

# Start structured development
/agentful-start

# Monitor progress
/agentful-status
```

## Commands

| Command | What It Does |
|---------|--------------|
| `/agentful-start` | Start structured development loop |
| `/agentful-status` | Show completion percentage, current work |
| `/agentful-validate` | Run quality gates (tests, lint, security) |
| `/agentful-decide` | Answer blocking decisions |
| `/agentful-product` | Smart product requirements planning and analysis |
| `/agentful` | Show this reference |

### Product Planning (Optional)

Before starting development, you can use `/agentful-product` to:
- Create and refine product specifications
- Analyze requirements for gaps and ambiguities
- Get a readiness score before development begins
- Resolve blocking issues interactively

This is optional but recommended for complex projects. Run `/agentful-product` to get started.

## How It Works

### 1. Define Your Product

Create a product specification (choose one):

**Hierarchical structure** (recommended):
```
.claude/product/
├── index.md                 # Product overview
└── domains/
    ├── authentication/      # Auth domain
    │   ├── index.md        # Domain overview
    │   └── features/
    │       ├── login.md
    │       ├── register.md
    │       └── password-reset.md
    ├── user-management/     # User domain
    │   ├── index.md
    │   └── features/
    │       ├── profile.md
    │       └── settings.md
    └── dashboard/           # Dashboard domain
        └── features/
            ├── analytics.md
            └── reports.md
```

### 2. Start Development

```
/agentful-start
```

**What happens:**
- Orchestrator reads product spec
- Detects your tech stack (language, framework, patterns)
- Generates specialized agents matching your conventions
- Picks highest-priority incomplete feature
- Delegates to appropriate specialist agents
- Validates quality gates
- Updates completion status
- Repeats until 100% complete

### 3. Monitor Progress

```
/agentful-status
```

**Example output:**
```
Overall Progress: 47% (6/13 features complete)

┌─ Authentication Domain ──────────────────── 100% ✓
│  ✓ Login feature
│  ✓ Register feature
│  ✓ Password reset feature
│
├─ User Management Domain ───────────────────  60% │
│  ✓ Profile feature
│  ⟳ Settings feature (backend complete, frontend pending)
│
└─ Dashboard Domain ─────────────────────────   0% ○
   ○ Analytics feature (not started)
   ○ Reports feature (not started)

Quality Gates:
  ✅ Tests passing (47/47)
  ✅ No type errors
  ⚠️  Coverage at 78% (need 80%)
  ✅ No security issues
```

## Agent System

### Orchestrator
**Role**: Coordinates all development work
- Classifies work type (feature, bugfix, refactor, maintenance)
- Routes to appropriate workflow
- Delegates to specialist agents
- Tracks progress and blocks on decisions
- Never writes code directly

### Specialist Agents

| Agent | Responsibility |
|-------|----------------|
| **@architect** | Analyzes project patterns, generates specialized agents |
| **@backend** | APIs, database schemas, services, repositories, auth |
| **@frontend** | UI components, pages, state management, forms, styling |
| **@tester** | Unit tests, integration tests, E2E tests, 80% coverage |
| **@reviewer** | Code quality, dead code detection, security, lint |
| **@fixer** | Fixes validation failures, removes dead code, adds tests |

### How Delegation Works

```
User: "Build authentication system"

Orchestrator:
  → Classifies as FEATURE_DEVELOPMENT
  → Delegates to @backend: "Implement JWT login API"
  → Delegates to @frontend: "Create login form UI"
  → Delegates to @tester: "Write auth tests"
  → Delegates to @reviewer: "Review auth implementation"
  → Updates completion.json: auth = 100%
  → Continues to next feature
```

## Quality Gates

Every change automatically passes through **6 core automated quality gates**:

1. **Type checking** - No type errors
2. **Linting** - Consistent code style
3. **Tests** - All tests passing
4. **Coverage** - Minimum 80% code coverage
5. **Security** - No vulnerabilities, hardcoded secrets
6. **Dead code** - No unused exports, imports, files

> **Note**: The reviewer agent may run additional context-specific checks beyond these 6 core gates based on project needs (e.g., performance benchmarks, accessibility audits).

**If gates fail** → @fixer automatically resolves issues → re-validates

## State Tracking

Progress lives in `.agentful/`:

```
.agentful/
├── state.json              # Current work, phase, iterations
├── completion.json         # Feature completion (domains → features)
├── decisions.json          # Pending user decisions
└── architecture.json       # Detected tech stack, patterns
```

**Example completion.json:**
```json
{
  "domains": {
    "authentication": {
      "status": "complete",
      "score": 100,
      "features": {
        "login": { "status": "complete", "score": 100 },
        "register": { "status": "complete", "score": 100 }
      }
    }
  },
  "gates": {
    "tests_passing": true,
    "no_type_errors": true,
    "coverage_80": false
  },
  "overall_progress": 65
}
```

## Decision Handling

When agentful needs input:

1. **Pauses development** on blocked features
2. **Adds decision** to `decisions.json`
3. **Continues** with unblocked work
4. **Notifies you** to run `/agentful-decide`

**Example decision:**
```json
{
  "id": "decision-001",
  "question": "Should auth use JWT or session cookies?",
  "options": [
    "JWT (stateless, scalable)",
    "Sessions (simpler, built-in)",
    "Clerk (managed service)"
  ],
  "blocking": ["authentication/login", "authentication/register"]
}
```

## Work Types

| Type | Trigger | Workflow |
|------|---------|----------|
| **Feature** | "Build X", "Add Y feature" | Iterative loop with human checkpoints until complete |
| **Bugfix** | "Fix X bug", "Y is broken" | Quick fix → test → validate → stop |
| **Enhancement** | "Add X to Y", "Enhance Z" | Enhance → test → validate → stop |
| **Refactor** | "Refactor X", "Improve Y code" | Refactor → test → validate → stop |
| **Maintenance** | "Update deps", "Security scan" | Update → test → validate → stop |

## Extended Development Sessions

For longer development sessions with fewer interruptions, use the **Ralph Wiggum plugin** (requires separate installation):

```bash
/ralph-loop "/agentful-start" \
  --max-iterations 50 \
  --completion-promise "AGENTFUL_COMPLETE"
```

> **Note**: `/ralph-loop` is an external plugin command from the Ralph Wiggum plugin. Install separately from the Claude Code plugin registry.

Pauses when:
- Human decisions are needed
- All features complete (100%)
- Quality gates fail (requires review)

## Best Practices

**1. Write Clear Specifications**
- Define features with acceptance criteria
- Set priority levels (CRITICAL, HIGH, MEDIUM, LOW)
- Group related features into domains (for complex projects)

**2. Answer Decisions Promptly**
- Decisions block the development loop
- Use `/agentful-decide` to resolve multiple at once

**3. Review Commits**
- agentful creates commits after each validated change
- Review before pushing to main

**4. Run Validation Often**
- `/agentful-validate` catches issues early
- Fix small problems before they compound

**5. Check Status Before Merging**
- `/agentful-status` shows true completion
- Ensure all gates passing before deploying

## Technology Detection

agentful works with **any** tech stack:

- **Languages**: TypeScript, JavaScript, Python, Go, Rust, Java, C#, PHP, Ruby, Elixir, etc.
- **Frameworks**: React, Vue, Angular, Svelte, Next.js, Django, Flask, ASP.NET, Spring, Express, Fastify, etc.
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, etc.
- **Testing**: Jest, Vitest, Pytest, JUnit, Go test, etc.

It learns **your project's patterns** and generates agents that match your conventions.

## Architecture

```
┌─────────────────────────────────────────────┐
│              agentful Framework              │
├─────────────────────────────────────────────┤
│  CLI Tool (npx @itz4blitz/agentful init)    │
│  ├─ Project initialization                  │
│  ├─ Tech stack detection                    │
│  └─ Template creation                       │
├─────────────────────────────────────────────┤
│  Slash Commands (Claude Code)               │
│  ├─ /agentful-product (requirements)        │
│  ├─ /agentful-start  (orchestrator)        │
│  ├─ /agentful-status (progress)             │
│  ├─ /agentful-validate (quality gates)      │
│  └─ /agentful-decide  (decisions)          │
├─────────────────────────────────────────────┤
│  Agent System                               │
│  ├─ Orchestrator (coordination)             │
│  ├─ Architect (pattern detection)           │
│  ├─ Backend (APIs, database)                │
│  ├─ Frontend (UI, components)               │
│  ├─ Tester (tests, coverage)                │
│  ├─ Reviewer (quality, security)            │
│  └─ Fixer (validation failures)             │
└─────────────────────────────────────────────┘
```

## Get Help

- **Documentation**: https://agentful.app
- **GitHub**: https://github.com/itz4blitz/agentful
- **Issues**: https://github.com/itz4blitz/agentful/issues
- **Version**: 0.1.11 (check updates: `npm outdated @itz4blitz/agentful`)
