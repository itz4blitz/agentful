---
name: agentful
description: Natural language interface for agentful human-in-the-loop development. Processes user intent and routes to appropriate handlers.
---

# agentful

Natural language interface for human-in-the-loop product development with Claude Code.

## Implementation

When this command is invoked:

1. **Check if user provided input**: If arguments are provided, this is a natural language request
2. **If NO input**: Show the Quick Reference section below
3. **If input provided**: Use the Task tool to delegate to the conversation skill

```bash
# User runs: /agentful build authentication
# You should execute:
Task("conversation", "User said: 'build authentication'. Process this using the conversation skill workflow.")
```

The conversation skill will:
- Load conversation state and history
- Classify intent and extract entities
- Detect ambiguity and ask clarifying questions if needed
- Route to appropriate handler (orchestrator, status, validate, etc.)
- Update conversation state and history

## Command Behavior

### Without Arguments

```bash
/agentful
```

Shows quick reference and available commands.

### With Natural Language Input

```bash
/agentful <your request>
```

**Examples:**
- `/agentful build the authentication system`
- `/agentful fix the memory leak in checkout`
- `/agentful what's the status?`
- `/agentful validate the tests`

This invokes the **conversation skill** which:
1. Classifies your intent
2. Resolves references (pronouns like "it", "that")
3. Detects ambiguity and asks clarifying questions
4. Routes to appropriate handler (orchestrator, status, validate, etc.)

### Processing Flow

When user provides natural language input:

```typescript
// 1. Load conversation state and history
const state = load_conversation_state('.agentful/conversation-state.json');
const history = read_conversation_history('.agentful/conversation-history.json');
const productSpec = load_product_spec('.claude/product/');

// 2. Check for context loss (>24h gaps)
const contextRecovery = detect_context_loss(history.messages, state);
if (contextRecovery.is_stale) {
  return {
    message: contextRecovery.message,
    confirmation: contextRecovery.suggested_confirmation
  };
}

// 3. Detect mind changes ("actually", "wait", "never mind")
const mindChange = detect_mind_change(userMessage, state);
if (mindChange.detected && mindChange.reset_context) {
  reset_conversation_context(state);
}

// 4. Resolve references ("it", "that", "this" → actual feature names)
const resolved = resolve_references(userMessage, history.messages, state);

// 5. Classify intent
const intent = classify_intent(resolved.resolved, history.messages, productSpec);
// Possible intents: feature_request, bug_report, question, status_update,
//                   clarification, approval, rejection, pause, continue

// 6. Extract entities (features, domains, subtasks)
const entities = extract_feature_mention(resolved.resolved, productSpec);

// 7. Detect ambiguity
const ambiguity = detect_ambiguity(resolved.resolved);
if (ambiguity.is_ambiguous && ambiguity.confidence > 0.6) {
  const clarification = suggest_clarification(resolved.resolved, productSpec);
  return {
    message: clarification.primary_question,
    suggestions: clarification.suggested_responses
  };
}

// 8. Route to appropriate handler
const routing = route_to_handler(intent, entities);
switch (routing.handler) {
  case 'orchestrator':
    Task('orchestrator', routing.context);
    break;
  case 'status':
    Task('product-tracking', 'show_status');
    break;
  case 'validate':
    Task('validation', 'run_quality_gates');
    break;
  case 'decide':
    Task('decision-handler', 'list_pending_decisions');
    break;
  case 'product':
    Task('product-planning', routing.context);
    break;
  default:
    // Handle inline with conversation skill
    return generate_response(intent, entities, state);
}

// 9. Add to conversation history
add_message_to_history({
  role: 'user',
  content: userMessage,
  intent: intent.intent,
  entities: entities,
  references_resolved: resolved.references
});

// 10. Update conversation state
update_conversation_state(state, routing.result);
```

### Intent to Handler Mapping

| Intent | Handler | Notes |
|--------|---------|-------|
| `feature_request` | orchestrator | Delegates to FEATURE_DEVELOPMENT workflow |
| `bug_report` | orchestrator | Delegates to BUGFIX workflow |
| `status_update` | product-tracking | Shows completion percentage and current work |
| `validation` | validation skill | Runs quality gates |
| `decision` | decision handler | Lists/resolves pending decisions |
| `question` | inline | Answers using conversation history |
| `clarification` | inline | Provides more detail on previous response |
| `approval` | orchestrator | Continues current work |
| `rejection` | orchestrator | Stops current work |
| `pause` | state update | Marks work as paused |
| `continue` | orchestrator | Resumes paused work |

### Example Scenarios

**Scenario 1: Clear Feature Request**
```
User: /agentful build the authentication system
→ Intent: feature_request (confidence: 0.9)
→ Entities: feature "authentication system"
→ Route: orchestrator (FEATURE_DEVELOPMENT workflow)
→ No ambiguity, proceed immediately
```

**Scenario 2: Ambiguous Reference**
```
User: /agentful fix it
→ Intent: bug_report (confidence: 0.7)
→ Entities: none (pronoun "it" without referent)
→ Ambiguity: HIGH (pronoun_without_antecedent)
→ Response: "I want to make sure I understand correctly. What specifically would you like me to fix?"
```

**Scenario 3: Reference Resolution**
```
User: /agentful update it to use OAuth
Context: Currently working on "login feature"
→ Resolve: "it" → "login feature"
→ Intent: feature_request (confidence: 0.85)
→ Entities: feature "login", action "update to use OAuth"
→ Route: orchestrator (FEATURE_DEVELOPMENT workflow)
```

**Scenario 4: Status Check**
```
User: /agentful what's the status?
→ Intent: status_update (confidence: 0.95)
→ Route: product-tracking skill
→ Shows completion percentage, current work, blocked items
```

**Scenario 5: Mind Change**
```
User: /agentful actually never mind, let's do the dashboard instead
→ Mind change detected: HIGH confidence
→ Reset context: clear current feature
→ Intent: feature_request (confidence: 0.9)
→ Entities: feature "dashboard"
→ Route: orchestrator (FEATURE_DEVELOPMENT workflow)
```

**Scenario 6: Context Loss**
```
User: /agentful continue with that
Last message: 48 hours ago
→ Context loss detected: STALE
→ Response: "It's been 48 hours since our last conversation. We were working on the login feature. Would you like to continue with that, or would you prefer to start something new?"
```

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
