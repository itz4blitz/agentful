---
name: agentful
description: Quick reference for agentful autonomous development kit
---

# agentful Quick Reference

## What is agentful?

agentful is an autonomous product development kit for Claude Code that helps teams build products faster by:

- **Smart project analysis** - Auto-detects tech stack and architecture
- **Product spec generation** - Creates optimal structure (flat or hierarchical)
- **Specialized agent creation** - Generates backend/frontend/tester agents for your stack
- **Autonomous development** - Orchestrator agent coordinates feature development
- **Quality gates** - Automatic validation and review

## Quick Start

```bash
# Initialize agentful in your project
npx @itz4blitz/agentful init

# Start autonomous development (in Claude Code)
/agentful-start

# Check progress
/agentful-status
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `/agentful-start` | Start autonomous development loop |
| `/agentful-status` | View progress, completion percentage, current work |
| `/agentful-validate` | Run quality gates (tests, linting, security) |
| `/agentful-decide` | Answer pending decisions that block development |
| `/agentful` | This quick reference |

## Project Structure Options

agentful automatically detects the best structure for your project:

**Flat Structure (PRODUCT.md)**
- Best for: Small to medium projects (< 5 domains)
- Simple, single-file product specification
- All features in one place

**Hierarchical Structure (.claude/product/domains/)**
- Best for: Large projects, multiple domains, complex architectures
- Separate index.md for each domain
- Better organization for teams

Detection factors:
- Number of distinct domains
- Framework complexity
- Monorepo vs single package
- Team size considerations

## Real-World Examples

### Example 1: Stripe Integration
**Input:** "I need to add Stripe subscription management"

**What agentful does:**
1. Orchestrator analyzes product spec for "Billing & Subscriptions" domain
2. Delegates to @backend agent:
   - Integrates Stripe SDK
   - Creates webhook endpoints
   - Implements subscription CRUD
3. Delegates to @frontend agent:
   - Builds payment method UI
   - Creates subscription management dashboard
4. Delegates to @tester agent:
   - Writes tests for payment flows
   - Tests webhook processing
5. Runs quality gates
6. Reports completion with metrics

**Result:** Production-ready billing feature in one autonomous session

### Example 2: Production Bug
**Input:** "File uploads fail for files larger than 50MB"

**What agentful does:**
1. Orchestrator starts bug investigation workflow
2. Searches relevant code (upload routes, middleware configs)
3. Identifies root cause:
   - Found multer limit at 50MB in src/config/multer.ts:12
   - Express limit at 100MB was being overridden
4. Implements fix and updates tests
5. Validates with quality gates
6. Reports fix location and validation results

**Result:** Bug fixed with root cause analysis and test coverage

### Example 3: Complex Feature
**Input:** "Add collaborative workspaces with real-time editing"

**What agentful does:**
1. Orchestrator identifies multi-domain scope:
   - User Management (permissions)
   - Collaboration (workspaces)
   - Real-time infrastructure
2. @architect agent designs system:
   - Data models (workspaces, members, invites)
   - Permission roles (OWNER, ADMIN, EDITOR, VIEWER)
   - Tech selection (Yjs for CRDTs, Hocuspocus for WebSocket)
3. Parallel execution:
   - @backend: Invite API, workspace CRUD, WebSocket auth
   - @frontend: Workspace UI, member management, real-time editor
   - @tester: Multi-user scenario tests
4. Quality gates validate all components
5. Creates deployment checklist (Redis, Yjs server, docker-compose)

**Result:** Production-ready collaboration system with architecture docs

## Autonomous Development Loop

When you run `/agentful-start`, here's what happens:

1. **Read state** - Loads state.json, completion.json, decisions.json
2. **Identify next task** - Finds highest-priority incomplete feature
3. **Delegate to specialists** - Routes to appropriate agent (@backend, @frontend, etc.)
4. **Implement & test** - Agent builds feature and writes tests
5. **Quality validation** - Runs all quality gates
6. **Update completion** - Marks feature complete, updates progress
7. **Repeat** - Continues until all features complete or blocked by decisions

## Quality Gates

agentful automatically runs these checks:

- ✅ TypeScript compilation (no type errors)
- ✅ Linting (ESLint/Prettier/BIome)
- ✅ Unit tests (minimum 80% coverage)
- ✅ Integration tests
- ✅ Security audit (npm audit or equivalent)
- ✅ Dead code detection
- ✅ Performance benchmarks (if configured)

## State Management

agentful tracks progress in `.agentful/`:

```
.agentful/
├── state.json          # Current work, agent assignments
├── completion.json     # Feature completion status
├── decisions.json      # Pending user decisions
└── conversation-history.json  # Chat history (future)
```

## Best Practices

1. **Write clear product specs** - Good specs = better autonomous development
2. **Answer decisions promptly** - Decisions block the autonomous loop
3. **Review commits** - agentful creates commits, you should review
4. **Run validation often** - `/agentful-validate` catches issues early
5. **Check status before merging** - `/agentful-status` shows true completion

## Continuous Development

For 24/7 autonomous development, use Claude Code's ralph-loop:

```
/ralph-loop "/agentful-start" \
  --max-iterations 50 \
  --completion-promise "AGENTFUL_COMPLETE"
```

This runs agentful continuously until:
- All features are complete
- A decision is needed (pauses for you to answer)
- Quality gates fail (pauses for review)

## Architecture

agentful consists of:

1. **CLI tool** (`npx @itz4blitz/agentful`)
   - Project initialization
   - Tech stack detection
   - Agent generation
   - Template creation

2. **Claude Code slash commands**
   - `/agentful-start` - Orchestrator entry point
   - `/agentful-status` - Progress tracking
   - `/agentful-validate` - Quality gates
   - `/agentful-decide` - Decision resolution

3. **Specialized agents** (auto-generated)
   - @orchestrator - Coordinates all work
   - @backend - Builds APIs, database schemas
   - @frontend - Builds UI components, pages
   - @tester - Writes and runs tests
   - @reviewer - Code quality and security
   - @architect - System design (complex features)
   - @fixer - Bug fixes and validation failures

## Getting Help

- Documentation: https://agentful.app
- GitHub: https://github.com/itz4blitz/agentful
- Issues: https://github.com/itz4blitz/agentful/issues

## Version

Current version: 0.1.1

Check for updates: `npm outdated @itz4blitz/agentful`
